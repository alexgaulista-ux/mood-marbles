CREATE TABLE registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setor TEXT NOT NULL,
  sentimento TEXT NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabela de usuários para login
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL
);

-- Usuário padrão (alterar depois)
INSERT INTO usuarios (usuario, senha) VALUES ('admin', 'Duroline001*');
