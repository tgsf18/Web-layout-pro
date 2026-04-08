-- Schema de exemplo para o sistema Conliz
-- Compatível com PostgreSQL (ajuste pequenos detalhes para MySQL se necessário)

-- Tabela de usuários (admin / cliente)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL, -- armazenar hash (bcrypt/scrypt) em produção
  cargo VARCHAR(20) NOT NULL CHECK (cargo IN ('admin', 'cliente')),
  foto_perfil VARCHAR(512),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projetos / obras
CREATE TABLE IF NOT EXISTS projetos (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome_obra VARCHAR(255) NOT NULL,
  endereco VARCHAR(512),
  status VARCHAR(40) NOT NULL CHECK (status IN ('planejamento', 'andamento', 'concluido', 'pausado')),
  orcamento_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(14,2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Diário de obra (fotos + anotações por dia)
CREATE TABLE IF NOT EXISTS diario_obra (
  id SERIAL PRIMARY KEY,
  projeto_id INT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  url_foto VARCHAR(512)
);

-- Cronograma / tarefas
CREATE TABLE IF NOT EXISTS cronograma (
  id SERIAL PRIMARY KEY,
  projeto_id INT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  tarefa VARCHAR(255) NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  progresso INT NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100)
);

-- Exemplo de dados iniciais (opcional)
INSERT INTO usuarios (nome, email, senha, cargo, foto_perfil)
VALUES
  ('Admin Conliz', 'admin@conliz.com', '$2b$10$EXEMPLO_HASH_CONLIZ', 'admin', NULL),
  ('Cliente Demo', 'cliente@conliz.com', '$2b$10$EXEMPLO_HASH_DEMO', 'cliente', NULL);

INSERT INTO projetos (cliente_id, nome_obra, endereco, status, orcamento_total, valor_pago)
VALUES
  (2, 'Residência Jardim Paulista', 'Av. das Palmeiras, 120 - São Paulo', 'andamento', 320000.00, 120000.00);
