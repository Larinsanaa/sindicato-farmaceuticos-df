-- Schema do banco (Supabase/Postgres) — deduzido do código do backend.
-- Rodar no SQL Editor do Supabase (Dashboard > SQL Editor > New query > colar > Run).

-- =========================
-- Tabela de usuários
-- =========================
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  email text not null unique,
  senha text not null, -- hash bcrypt
  nivel_acesso text not null default 'usuario', -- 'presidente' ou 'usuario' (usuario = avaliador)
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Tabela de avaliações
-- =========================
create table if not exists avaliacao (
  id uuid primary key default gen_random_uuid(),
  avaliador_id uuid not null references usuarios (id),
  farmacia text not null,
  cnpj text not null,
  endereco text not null,
  observacao text,
  nota_geral numeric(3, 2),
  classificacao text,
  resumo text,
  total_respostas integer,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

-- =========================
-- Respostas de cada avaliação
-- =========================
create table if not exists resposta (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references avaliacao (id) on delete cascade,
  secao text not null,
  pergunta text not null,
  valor integer not null check (valor between 1 and 5), -- estrelas por item
  created_at timestamptz not null default now()
);

-- =========================
-- Empresas (cadastro por CNPJ)
-- =========================
create table if not exists empresa (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text not null unique,
  owner_id uuid references usuarios (id),
  created_at timestamptz not null default now()
);

-- =========================
-- Usuários de teste (senha de ambos: senha123)
-- =========================
insert into usuarios (nome, cpf, email, senha, nivel_acesso)
values
  ('Avaliador Teste', '12345678901', 'avaliador@teste.com', '$2b$08$KUGVdi88tim2QNmxiD6GceY6ZBuouRCT7j1z0.P/uLN5Blh4M7NQ6', 'usuario'),
  ('Presidente Teste', '10987654321', 'presidente@teste.com', '$2b$08$KUGVdi88tim2QNmxiD6GceY6ZBuouRCT7j1z0.P/uLN5Blh4M7NQ6', 'presidente')
on conflict (email) do nothing;
