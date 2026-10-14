-- AgroSentinela — esquema inicial.
-- Movimentações de estoque (entradas e saídas) e fusões de cadastro confirmadas pelo usuário.

create table if not exists public.movimentacoes (
  id text primary key,
  produto text not null,
  categoria text,
  unidade text not null,
  quantidade numeric not null check (quantidade >= 0),
  estoque_minimo numeric,
  tipo text not null check (tipo in ('entrada', 'saida')),
  data date not null,
  preco numeric,            -- null = preço não informado (diferente de zero)
  lote text,
  validade date,            -- null = validade não informada
  fornecedor text,
  destino text,
  responsavel text,
  simulado boolean default false,
  criado_em timestamptz not null default now()
);
create index if not exists movimentacoes_produto_data on public.movimentacoes (produto, data);

create table if not exists public.fusoes (
  origem text primary key,
  destino text not null
);

-- Protótipo de demonstração sem login: leitura e escrita pela chave pública (anon).
-- Em produção, trocar por políticas vinculadas a auth.uid() e à propriedade do usuário.
alter table public.movimentacoes enable row level security;
alter table public.fusoes enable row level security;
create policy "demo leitura" on public.movimentacoes for select using (true);
create policy "demo escrita" on public.movimentacoes for insert with check (true);
create policy "demo atualizacao" on public.movimentacoes for update using (true);
create policy "demo exclusao" on public.movimentacoes for delete using (true);
create policy "demo leitura fusoes" on public.fusoes for select using (true);
create policy "demo escrita fusoes" on public.fusoes for insert with check (true);
create policy "demo exclusao fusoes" on public.fusoes for delete using (true);
