-- SQL para criar as tabelas usadas pelo backend
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  cpf TEXT,
  foto_perfil TEXT,
  nivel_acesso TEXT NOT NULL DEFAULT 'usuario'
    CHECK (nivel_acesso IN ('presidente', 'usuario')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

CREATE TABLE IF NOT EXISTS avaliacao (
  id BIGSERIAL PRIMARY KEY,
  avaliador_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  farmacia TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  observacao TEXT,
  nota_geral NUMERIC(4,2) NOT NULL DEFAULT 0,
  classificacao TEXT,
  resumo TEXT,
  total_respostas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resposta (
  id BIGSERIAL PRIMARY KEY,
  avaliacao_id BIGINT NOT NULL REFERENCES avaliacao(id) ON DELETE CASCADE,
  secao TEXT,
  pergunta TEXT,
  valor INTEGER NOT NULL CHECK (valor BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empresa (
  id BIGSERIAL PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT,
  nome_fantasia TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_avaliador_id ON avaliacao(avaliador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_cnpj ON avaliacao(cnpj);
CREATE INDEX IF NOT EXISTS idx_resposta_avaliacao_id ON resposta(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_empresa_cnpj ON empresa(cnpj);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_usuarios ON usuarios;
CREATE TRIGGER trg_set_updated_at_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_avaliacao ON avaliacao;
CREATE TRIGGER trg_set_updated_at_avaliacao
BEFORE UPDATE ON avaliacao
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
