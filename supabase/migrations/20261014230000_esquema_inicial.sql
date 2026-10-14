-- Esquema inicial: Gestão Laudino 3D
-- Vitrine pública de produtos impressos em 3D, precificador e controle de orçamentos/pedidos.
-- Leitura pública só do que é vitrine; toda escrita exige um usuário cadastrado em public.admins.

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "admin ve a propria linha" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Filamentos
-- ---------------------------------------------------------------------------
create table public.filamentos (
  id bigint generated always as identity primary key,
  nome text not null,
  material text not null default 'PLA',
  cor text,
  marca text,
  preco_kg numeric(10, 2) not null check (preco_kg >= 0),
  estoque_g integer not null default 0 check (estoque_g >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger filamentos_updated_at before update on public.filamentos
  for each row execute function public.set_updated_at();

alter table public.filamentos enable row level security;

create policy "filamentos ativos sao publicos" on public.filamentos
  for select to anon
  using (ativo);

create policy "logado ve ativos, admin ve todos" on public.filamentos
  for select to authenticated
  using (ativo or (select public.is_admin()));

create policy "admin gerencia filamentos" on public.filamentos
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Produtos (vitrine)
-- ---------------------------------------------------------------------------
create table public.produtos (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  imagem_url text,
  stl_url text,
  peso_g numeric(10, 2) check (peso_g >= 0),
  tempo_impressao_min integer check (tempo_impressao_min >= 0),
  filamento_id bigint references public.filamentos (id) on delete set null,
  preco_venda numeric(10, 2) check (preco_venda >= 0),
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index produtos_filamento_id_idx on public.produtos (filamento_id);

create trigger produtos_updated_at before update on public.produtos
  for each row execute function public.set_updated_at();

alter table public.produtos enable row level security;

create policy "produtos publicados sao publicos" on public.produtos
  for select to anon
  using (publicado);

create policy "logado ve publicados, admin ve todos" on public.produtos
  for select to authenticated
  using (publicado or (select public.is_admin()));

create policy "admin gerencia produtos" on public.produtos
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Configurações de custo (linha única, id = 1)
-- ---------------------------------------------------------------------------
create table public.configuracoes (
  id smallint primary key default 1 check (id = 1),
  tarifa_kwh numeric(10, 4) not null default 0.95,
  potencia_impressora_w numeric(10, 2) not null default 150,
  custo_maquina_hora numeric(10, 2) not null default 1.50,
  custo_mao_obra_hora numeric(10, 2) not null default 0,
  taxa_falha_pct numeric(5, 2) not null default 10,
  margem_lucro_pct numeric(6, 2) not null default 100,
  updated_at timestamptz not null default now()
);

create trigger configuracoes_updated_at before update on public.configuracoes
  for each row execute function public.set_updated_at();

insert into public.configuracoes (id) values (1);

alter table public.configuracoes enable row level security;

create policy "admin le configuracoes" on public.configuracoes
  for select to authenticated
  using ((select public.is_admin()));

create policy "admin altera configuracoes" on public.configuracoes
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Orçamentos (gerados pelo precificador)
-- ---------------------------------------------------------------------------
create table public.orcamentos (
  id bigint generated always as identity primary key,
  cliente_nome text,
  cliente_contato text,
  descricao text not null,
  filamento_id bigint references public.filamentos (id) on delete set null,
  peso_g numeric(10, 2) not null check (peso_g >= 0),
  tempo_min integer not null check (tempo_min >= 0),
  quantidade integer not null default 1 check (quantidade > 0),
  custo_material numeric(10, 2) not null,
  custo_energia numeric(10, 2) not null,
  custo_maquina numeric(10, 2) not null,
  custo_mao_obra numeric(10, 2) not null default 0,
  custo_extra numeric(10, 2) not null default 0,
  custo_total numeric(10, 2) not null,
  preco_final numeric(10, 2) not null,
  status text not null default 'aberto'
    check (status in ('aberto', 'enviado', 'aprovado', 'recusado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orcamentos_filamento_id_idx on public.orcamentos (filamento_id);

create trigger orcamentos_updated_at before update on public.orcamentos
  for each row execute function public.set_updated_at();

alter table public.orcamentos enable row level security;

create policy "admin gerencia orcamentos" on public.orcamentos
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
create table public.pedidos (
  id bigint generated always as identity primary key,
  orcamento_id bigint references public.orcamentos (id) on delete set null,
  produto_id bigint references public.produtos (id) on delete set null,
  cliente_nome text not null,
  cliente_contato text,
  quantidade integer not null default 1 check (quantidade > 0),
  valor numeric(10, 2) not null check (valor >= 0),
  status text not null default 'novo'
    check (status in ('novo', 'imprimindo', 'pronto', 'entregue', 'cancelado')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pedidos_orcamento_id_idx on public.pedidos (orcamento_id);
create index pedidos_produto_id_idx on public.pedidos (produto_id);

create trigger pedidos_updated_at before update on public.pedidos
  for each row execute function public.set_updated_at();

alter table public.pedidos enable row level security;

create policy "admin gerencia pedidos" on public.pedidos
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
