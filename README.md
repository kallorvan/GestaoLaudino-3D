# Gestão Laudino 3D

Site da Laudino 3D: vitrine de peças impressas em 3D (PLA), precificador de impressão e área administrativa, com banco de dados no Supabase.

## Páginas

| Página | Para quem | O que faz |
| --- | --- | --- |
| `index.html` | Público | Vitrine com os produtos marcados como publicados. |
| `precificador.html` | Público / admin | Calcula custo e preço de venda a partir do peso e do tempo do fatiador. Admin salva orçamentos e os parâmetros de custo padrão. |
| `admin.html` | Admin | Login e cadastro de produtos, filamentos, orçamentos e pedidos. |

É um site estático (HTML, CSS e JS puros, sem build). Abra com qualquer servidor local, por exemplo `python3 -m http.server`, ou publique no GitHub Pages, Netlify ou Vercel.

## Como o preço é calculado

Os parâmetros ficam na aba **Parâmetros** do admin (tabela `configuracoes`). Por peça:

- Material = peso (kg) × preço do filamento (R$/kg)
- Energia = potência (kW) × horas × tarifa (R$/kWh)
- Máquina = horas × (valor da impressora ÷ vida útil em horas + manutenção por hora)
- Custo = (material + energia + máquina) × (1 + taxa de falha) + mão de obra + extras + embalagem

Preço = custo × quantidade × (1 + margem) ÷ (1 − impostos − taxa de venda), nunca abaixo do preço mínimo por peça. A lógica fica em `assets/js/precificador.js`.

## Banco de dados (Supabase)

Projeto `pdmrsehoflbiycrfashf` (região sa-east-1). O esquema está em `supabase/migrations/`.

Tabelas: `clientes`, `fornecedores`, `filamentos` (ligado ao fornecedor), `produtos`, `configuracoes` (linha única com os parâmetros de custo), `orcamentos` e `pedidos` (ligados ao cliente) e `admins`.

Segurança (RLS ligada em todas as tabelas):

- Visitantes leem só produtos publicados e filamentos ativos.
- Toda escrita, e a leitura de orçamentos, pedidos e configurações, exige um usuário listado em `admins`.

### Primeiro acesso de administrador

1. No painel do Supabase, em Authentication > Users, crie seu usuário com e-mail e senha.
2. Entre em `admin.html`. A página mostra o comando SQL com o seu id; rode-o no SQL Editor:

   ```sql
   insert into public.admins (user_id) values ('<seu-user-id>');
   ```

3. Recarregue a página. Recomenda-se desligar novos cadastros em Authentication > Sign In / Providers.

A chave em `assets/js/config.js` é a chave *publishable*, feita para ficar no navegador; nunca coloque a chave `service_role` no site.
