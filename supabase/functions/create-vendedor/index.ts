import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const supabaseSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY")!;
  if (!supabaseUrl || !supabaseSecret) return new Response(JSON.stringify({ error: "Missing env" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

  const userClient = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: uErr } = await userClient.auth.getUser();
  if (uErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

  const { data: profile } = await userClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });

  const admin = createClient(supabaseUrl, supabaseSecret);
  const body = await req.json().catch(() => ({}));

  // reset
  if (body.action === "reset" && body.user_id) {
    const { error } = await admin.auth.admin.updateUserById(body.user_id, { password: "Borromeu2026!", user_metadata: { must_change_password: true } });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    await admin.from("profiles").update({ must_change_password: true }).eq("id", body.user_id);
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  const email: string = (body.email ?? "").toLowerCase().trim();
  const password: string = body.password ?? "Borromeu2026!";
  const name: string = (body.name ?? "").trim();
  const phone: string | null = body.phone ?? null;
  if (!email || !name) return new Response(JSON.stringify({ error: "email e name obrigatórios" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  if (!email.endsWith("@boromeu.com")) return new Response(JSON.stringify({ error: "email deve ser @boromeu.com" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, must_change_password: true },
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

  const uid = data.user?.id;
  if (!uid) return new Response(JSON.stringify({ error: "user not created" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });

  const { error: pErr } = await admin.from("profiles").insert({ id: uid, role: "seller", name, phone, must_change_password: true });
  if (pErr) return new Response(JSON.stringify({ error: pErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

  return new Response(JSON.stringify({ ok: true, id: uid, email }), { headers: { ...cors, "Content-Type": "application/json" } });
});
