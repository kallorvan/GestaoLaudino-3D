-- Cadastro de clientes e fornecedores, e parâmetros de custo mais completos para o precificador.

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
create table public.clientes (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null default 'PF' check (tipo in ('PF', 'PJ')),
  documento text,
  email text,
  telefone text,
  cep text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf char(2),
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clientes_updated_at before update on public.clientes
  for each row execute function public.set_updated_at();

alter table public.clientes enable row level security;

create policy "admin gerencia clientes" on public.clientes
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Fornecedores
-- ---------------------------------------------------------------------------
create table public.fornecedores (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null default 'PJ' check (tipo in ('PF', 'PJ')),
  documento text,
  contato text,
  email text,
  telefone text,
  site text,
  categoria text not null default 'filamento'
    check (categoria in ('filamento', 'pecas', 'embalagem', 'servico', 'outros')),
  cidade text,
  uf char(2),
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger fornecedores_updated_at before update on public.fornecedores
  for each row execute function public.set_updated_at();

alter table public.fornecedores enable row level security;

create policy "admin gerencia fornecedores" on public.fornecedores
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Ligações com as tabelas existentes
-- ---------------------------------------------------------------------------
alter table public.filamentos
  add column fornecedor_id bigint references public.fornecedores (id) on delete set null;
create index filamentos_fornecedor_id_idx on public.filamentos (fornecedor_id);

alter table public.orcamentos
  add column cliente_id bigint references public.clientes (id) on delete set null,
  add column custo_embalagem numeric(10, 2) not null default 0,
  add column valor_impostos_taxas numeric(10, 2) not null default 0;
create index orcamentos_cliente_id_idx on public.orcamentos (cliente_id);

alter table public.pedidos
  add column cliente_id bigint references public.clientes (id) on delete set null;
create index pedidos_cliente_id_idx on public.pedidos (cliente_id);

-- ---------------------------------------------------------------------------
-- Parâmetros de custo
-- O desgaste da máquina passa a ser calculado: valor da impressora / vida útil + manutenção por hora.
-- ---------------------------------------------------------------------------
alter table public.configuracoes
  add column valor_impressora numeric(10, 2) not null default 3000,
  add column vida_util_horas integer not null default 6000 check (vida_util_horas > 0),
  add column manutencao_hora numeric(10, 2) not null default 0.30,
  add column custo_embalagem numeric(10, 2) not null default 0,
  add column impostos_pct numeric(5, 2) not null default 0,
  add column taxa_venda_pct numeric(5, 2) not null default 0,
  add column preco_minimo numeric(10, 2) not null default 0,
  add constraint configuracoes_deducoes_check check (impostos_pct + taxa_venda_pct < 95);

comment on column public.configuracoes.custo_maquina_hora is
  'Obsoleto: o desgaste agora é valor_impressora / vida_util_horas + manutencao_hora.';
