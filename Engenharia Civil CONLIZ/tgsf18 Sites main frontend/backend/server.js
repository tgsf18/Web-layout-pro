const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const https = require('https');

const DB_PATH = path.join(__dirname, 'conliz.db');
const JWT_SECRET = process.env.JWT_SECRET || 'Qw3rty!2026$#@_Conliz_Produção_Use_ENV';

const db = new sqlite3.Database(DB_PATH);

// Inicializa banco
const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      cargo TEXT NOT NULL CHECK(cargo IN ('admin','cliente')),
      foto_perfil TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      nome_obra TEXT NOT NULL,
      endereco TEXT,
      status TEXT NOT NULL,
      orcamento_total REAL DEFAULT 0,
      valor_pago REAL DEFAULT 0,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS insumos (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      material TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      supplier TEXT NOT NULL,
      quote_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      imagem_url TEXT NOT NULL,
      descricao TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed admin/demo users
    db.get(`SELECT COUNT(1) as c FROM usuarios`, (err, row) => {
      if (err) return;
      if (row.c === 0) {
        const passAdmin = bcrypt.hashSync('conliz123', 10);
        const passDemo = bcrypt.hashSync('cliente123', 10);
        db.run(`INSERT INTO usuarios (nome,email,senha,cargo) VALUES (?,?,?,?)`, ['Admin Conliz','admin@conliz.com', passAdmin, 'admin']);
        db.run(`INSERT INTO usuarios (nome,email,senha,cargo) VALUES (?,?,?,?)`, ['Cliente Demo','cliente@conliz.com', passDemo, 'cliente']);
      }
    });
  });
};


initDb();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios' });

  try {
    const hashed = await bcrypt.hash(senha, 10);
    db.run(`INSERT INTO usuarios (nome,email,senha,cargo) VALUES (?,?,?,?)`, [nome, email, hashed, 'cliente'], function(err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email já cadastrado' });
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }

      const user = { id: this.lastID, nome, email, cargo: 'cliente' };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user, token });
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ error: 'Campos obrigatórios' });

  db.get(`SELECT * FROM usuarios WHERE lower(email)=lower(?) OR lower(nome)=lower(?)`, [usuario, usuario], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro no banco' });
    if (!row) return res.status(401).json({ error: 'Usuário não encontrado' });

    const match = await bcrypt.compare(senha, row.senha);
    if (!match) return res.status(401).json({ error: 'Senha incorreta' });

    const user = { id: row.id, nome: row.nome, email: row.email, cargo: row.cargo };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  });
});

app.get('/api/users', (req, res) => {
  db.all(`SELECT id,nome,email,cargo,foto_perfil,criado_em FROM usuarios ORDER BY id`, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro no banco' });
    res.json(rows);
  });
});

app.post('/api/projects', (req, res) => {
  const { token, nome_obra, endereco, status, orcamento_total, valor_pago, cliente_id } = req.body;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const ownerId = payload.id;
    const clientId = cliente_id || ownerId;
    db.run(`INSERT INTO projetos (cliente_id,nome_obra,endereco,status,orcamento_total,valor_pago) VALUES (?,?,?,?,?,?)`, [clientId, nome_obra, endereco, status, orcamento_total || 0, valor_pago || 0], function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao salvar projeto' });
      res.json({ id: this.lastID });
    });
  } catch (e) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.get('/api/projects', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let isAdmin = false;
  let userId = null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      isAdmin = payload.cargo === 'admin';
      userId = payload.id;
    } catch {}
  }

  if (isAdmin) {
    db.all(`SELECT * FROM projetos ORDER BY id DESC`, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erro no banco' });
      res.json(rows);
    });
  } else if (userId) {
    db.all(`SELECT * FROM projetos WHERE cliente_id=? ORDER BY id DESC`, [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erro no banco' });
      res.json(rows);
    });
  } else {
    res.status(401).json({ error: 'Não autorizado' });
  }
});

// === INSUMOS API ===
app.get('/api/insumos', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id;
    const isAdmin = payload.cargo === 'admin';
    
    const query = isAdmin 
      ? `SELECT * FROM insumos ORDER BY created_at DESC`
      : `SELECT * FROM insumos WHERE user_id=? ORDER BY created_at DESC`;
    
    db.all(query, isAdmin ? [] : [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar insumos' });
      res.json(rows);
    });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.post('/api/insumos', (req, res) => {
  const { token, material, unit, quantity, unit_price, supplier, quote_date } = req.body;
  if (!token || !material?.trim() || !unit?.trim() || !supplier?.trim() || !quote_date) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id;

    db.run(`INSERT INTO insumos (id, user_id, material, unit, quantity, unit_price, supplier, quote_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [`ins-${Date.now()}-${Math.random().toString(36).slice(2)}`, userId, material.trim(), unit.trim(), 
       Number(quantity), Number(unit_price), supplier.trim(), quote_date],
      function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao salvar insumo' });
        res.json({ id: this.lastID, success: true });
      }
    );
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.put('/api/insumos/:id', (req, res) => {
  const insumoId = req.params.id;
  const { token, material, unit, quantity, unit_price, supplier, quote_date } = req.body;
  if (!token || !material?.trim() || !unit?.trim() || !supplier?.trim() || !quote_date) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id;
    const isAdmin = payload.cargo === 'admin';

    const query = `UPDATE insumos SET material=?, unit=?, quantity=?, unit_price=?, supplier=?, quote_date=?, updated_at=CURRENT_TIMESTAMP 
                   WHERE id=? ${isAdmin ? '' : 'AND user_id=?'}`;
    
    db.run(query, [material.trim(), unit.trim(), Number(quantity), Number(unit_price), supplier.trim(), quote_date, insumoId, ...(isAdmin ? [] : [userId])], function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar' });
      if (this.changes === 0) return res.status(404).json({ error: 'Insumo não encontrado' });
      res.json({ success: true });
    });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.delete('/api/insumos/:id', (req, res) => {
  const insumoId = req.params.id;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id;
    const isAdmin = payload.cargo === 'admin';

    const query = `DELETE FROM insumos WHERE id=? ${isAdmin ? '' : 'AND user_id=?'}`;
    db.run(query, [insumoId, ...(isAdmin ? [] : [userId])], function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao excluir' });
      if (this.changes === 0) return res.status(404).json({ error: 'Insumo não encontrado' });
      res.json({ success: true });
    });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// === PORTFOLIO API ===
app.get('/api/portfolio', (req, res) => {
  db.all(`SELECT * FROM portfolio ORDER BY id DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar portfolio' });
    res.json(rows);
  });
});

app.post('/api/portfolio', (req, res) => {
  // Idealmente, validar se é admin aqui usando o token
  const { token, titulo, categoria, imagem_url, descricao } = req.body;
  
  // Validação simples
  if (!titulo || !categoria || !imagem_url) {
    return res.status(400).json({ error: 'Preencha título, categoria e imagem.' });
  }

  db.run(`INSERT INTO portfolio (titulo, categoria, imagem_url, descricao) VALUES (?, ?, ?, ?)`, 
    [titulo, categoria, imagem_url, descricao], 
    function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao salvar item no portfolio' });
      res.json({ id: this.lastID, success: true });
    }
  );
});


app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  db.run(`DELETE FROM usuarios WHERE id = ?`, [userId], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
    if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === '1' || process.env.NODE_ENV === 'production';

if (USE_HTTPS) {
  // Certificados: defina caminhos via env ou coloque server.key/server.crt na pasta backend
  const keyPath = process.env.SSL_KEY || path.join(__dirname, 'server.key');
  const certPath = process.env.SSL_CERT || path.join(__dirname, 'server.crt');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    https.createServer(options, app).listen(PORT, () =>
      console.log(`API segura rodando em https://localhost:${PORT}`)
    );
  } else {
    console.error('Certificados SSL não encontrados. Gere server.key/server.crt ou defina variáveis de ambiente SSL_KEY/SSL_CERT.');
    process.exit(1);
  }
} else {
  app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
}
