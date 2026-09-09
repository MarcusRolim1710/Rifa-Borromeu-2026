# Capela Noturna — Brand Spec extraído de backgroud-capela.png

Imagem: capela de madeira iluminada sob céu estrelado com Via Láctea. Luz quente âmbar contrasta com azul noturno profundo.

## Tokens :root (6 obrigatórios)

```css
:root {
  --bg:      oklch(97.5% 0.015 75);  /* #F7F2E6 — pedra clara / piso iluminado */
  --surface: oklch(100% 0 0);        /* #FFFFFF — superfície elevada */
  --fg:      oklch(18% 0.035 265);   /* #0E1E3A — noite profunda, céu topo */
  --muted:   oklch(56% 0.018 75);    /* #8E8478 — taupe pedra / texto secundário */
  --border:  oklch(89% 0.02 75);     /* #E9DDC7 — areia / junta do piso */
  --accent:  oklch(69% 0.135 58);    /* #D98E2E — luz âmbar da capela */
}
```

Tokens estendidos (derivados da imagem):
- --accent-2: oklch(62% 0.12 55) #B86F1B — madeira queimada
- --accent-3: oklch(82% 0.08 70) #F0C27A — brilho interno
- --night: oklch(22% 0.05 265) #14295A — azul Via Láctea
- --night-2: oklch(14% 0.03 270) #0A1428 — zênite
- --leaf: oklch(35% 0.04 145) #2B3D2E — vegetação noturna
- --stone: oklch(93% 0.015 75) #EAE0CC
- --success: oklch(58% 0.12 145)
- --danger: oklch(55% 0.18 25)

## Tipografia

- --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif — para títulos, evoca solenidade
- --font-body: "Inter", "DM Sans", system-ui, sans-serif — corpo neutro
- --font-mono: "JetBrains Mono", ui-monospace, monospace — numerais / labels

## Regras visuais (5)

1. **Luz como acento:** O âmbar (#D98E2E) aparece no máximo 2x por viewport — CTA, borda ativa ou ponto de luz. Nunca como fundo total.
2. **Contraste noturno:** Textos sobre o azul profundo sempre em #F7F2E6 ou branco com 4.5:1. O céu nunca recebe texto muted.
3. **Madeira = estrutura:** Bordas, divisores e cards usam raio 14-18px e bordas hairline cor --border, remetendo às vigas expostas.
4. **Contemplativo, não festivo:** Sem gradientes roxos. Luz com glow suave (sombra oklch warm) em vez de gradiente.
5. **Fotografia como prova:** Sempre que possível, usar a imagem real da capela como hero; overlays em vidro fosco (backdrop-blur) nunca cobrem o ponto de luz.
