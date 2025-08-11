CREATE TABLE registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setor TEXT NOT NULL,
  sentimento TEXT NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios (usuario, senha) VALUES ('admin', 'admin123');
