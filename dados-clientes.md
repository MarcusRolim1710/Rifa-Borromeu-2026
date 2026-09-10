\---



\## Contexto e Problema



\*\*1. Qual é o problema principal que você enfrenta hoje?\*\*



&#x09;R: Um sistema que gerencie uma RIFA. pontos  vendidos, pagos e pendentes com cadastro do vendedor. . .



\*\*2. Como você resolve esse problema atualmente?\*\*



&#x09;R: planilha



\*\*3. O que te faz querer mudar agora?\*\*



&#x09;R: organização facilidade de uso fidelidade dos dados e conferencia facilitada

&#x09;

\---



\## Usuários e Stakeholders



\*\*4. Quem vai usar o sistema no dia a dia?\*\*



&#x09;R: Administrador geral e vendedores.





\*\*5. Quantas pessoas serão impactadas, direta ou indiretamente?\*\*



&#x09;R: estimativa de no maximo 50 entre  administrador e vendedores



\---



\## Objetivos e Sucesso



\*\*6. Qual resultado concreto você espera alcançar com o software?\*\*



&#x09;R: facilitar o registro e acompanhamento das vendas de pontos da RIFA



\*\*7. Como você vai saber que o projeto foi um sucesso?\*\*



&#x09;R: quando 100% dos  registros feito com uso somente desta aplicação.



\---



\## Escopo e Funcionalidades



\*\*8. Se você pudesse ter apenas 3 funcionalidades no lançamento, quais seriam?\*\*



&#x09;R: 1º-painel do adminstrador  com CRUD para vendas com dados  de qual vendedor realizoue qual numero ou ranger foi vendido.

&#x09;   2º-dashboard com total de numeros  vendidos, valores a receber e recebidos com ranking de qual vendedor vendeu mais.

&#x09;   3º-acesso do vendedo ver numeros vendidos somente dele, e adicionar vendas com dados para quem vendeu.



\*\*9. O que está explicitamente fora do escopo — o que o sistema não precisa fazer?\*\*



&#x09;R: autenticação com outros metodos como google. por hora somente pensei nisto.



\*\*10. Quais sistemas externos precisam se integrar com essa solução?\*\*

Revela dependências técnicas (ERPs, APIs, bancos de dados, autenticação).

&#x09;R: banco de dados a ser definido. autenticação inicial  por meio de tela de login.



\---



\## Restrições e Contexto Técnico



\*\*11. Existem restrições de tecnologia, segurança ou compliance que devo conhecer?\*\*



&#x09;R: o administrador pode ver todos os dados de vendas, mas os  vendedores somente  podem ver os proprios.

Administrador somente direciona nemeros ou ranger de numeros  para o vendedor, e o vendedor resgistra o comprador final.

vamos usar aplicação PWA usando vite+react+ts.



\*\*12. Qual é o orçamento disponível e o modelo de contratação esperado?\*\*



&#x09;R: Vamos usar sempre planos gratuitos de aplicações. visando 0 custos.



\---



\## Riscos e Prioridades



\*\*13. O que você considera o maior risco para esse projeto não funcionar?\*\*

Abre espaço para o cliente verbalizar medos e resistências internas, que normalmente não aparecem espontaneamente.

&#x09;R: o gerenciamenteo nao ficar intuitivo ou facil para uso dos vendedores ou nao ser possivel realizar usando a aplicação mobile.



\---





Com as respostas em mãos, você terá insumos suficientes para preencher as seções clássicas de um PRD:



\- \*\*Problem Statement\*\* 

\- \*\*Users \& Stakeholders\*\* 

\- \*\*Goals \& Success Metrics\*\* 

\- \*\*Scope \& Features (MVP)\*\* 

\- \*\*Integrations \& Technical Constraints\*\* 

\- \*\*Budget \& Delivery Model\*\* 

\- \*\*Risks\*\* 



\## PONTOS/requisitos Importantes



\- \*\*Esconder API Keys\*\*

\- \*\*Limpar secrets do git\*\*

\- \*\*Public Key DB\*\*

\- \*\*Ativar RLS\*\*

\- \*\*Criptografia de dados\*\*

\- \*\*Auth Server side\*\*

\- \*\*Restringir acessos\*\*

\- \*\*Bloquear Mass Assignment\*\*

\- \*\*Proteger cookies\*\*

\- \*\*Hash nas senhas\*\*

\- \*\*Rate limit\*\*

\- \*\*Bot protection\*\*

\- \*\*Queries parametrizadas\*\*

\- \*\*Validação dos Inputs\*\*

\- \*\*Vazar conteúdo\*\*

\- \*\*Restringir uploads\*\*

\- \*\*Trim respostas de API\*\*

\- \*\*Add security headers\*\*

\- \*\*Forçar HTTPS\*\*

\- \*\*Scam de dependências\*\*



