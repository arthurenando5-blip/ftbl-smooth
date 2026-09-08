const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const FFmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ftbl-smooth-secret-key-2024';
const OWNER_ID = 'neyftbl';
const INITIAL_KEY = 'Ftbl';

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(fileUpload({ limits: { fileSize: 500 * 1024 * 1024 } }));
app.use(express.static('public'));

// Create directories
const dirs = ['uploads', 'videos', 'processed'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Database Setup
const db = new sqlite3.Database('./ftbl.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('✓ Database connected');
});

// Create Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    tiktok TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    access_granted BOOLEAN DEFAULT 0,
    banned BOOLEAN DEFAULT 0,
    access_time INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    key_value TEXT UNIQUE NOT NULL,
    valid BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    original_file TEXT,
    processed_file TEXT,
    effects TEXT,
    reverse BOOLEAN DEFAULT 0,
    motion_blur BOOLEAN DEFAULT 0,
    cc_dark BOOLEAN DEFAULT 0,
    zoom BOOLEAN DEFAULT 0,
    slow_motion BOOLEAN DEFAULT 0,
    upscale_4k BOOLEAN DEFAULT 0,
    topaz BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    video_id INTEGER,
    stars INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(video_id) REFERENCES videos(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating_id INTEGER,
    user_id INTEGER,
    text TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(rating_id) REFERENCES ratings(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    banned_by INTEGER,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(banned_by) REFERENCES users(id)
  )`);
});

// Initialize owner
setTimeout(() => {
  db.get("SELECT * FROM users WHERE username = ?", [OWNER_ID], (err, row) => {
    if (!row) {
      db.run(
        "INSERT INTO users (username, role, access_granted) VALUES (?, ?, ?)",
        [OWNER_ID, 'OWNER', 1],
        function(err) {
          if (!err) {
            const ownerId = this.lastID;
            db.run(
              "INSERT INTO keys (user_id, key_value) VALUES (?, ?)",
              [ownerId, INITIAL_KEY],
              () => console.log('✓ Owner initialized')
            );
          }
        }
      );
    }
  });
}, 500);

// Middleware: Verify Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sem token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware: Verify Owner
const verifyOwner = (req, res, next) => {
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ error: 'Apenas o dono pode acessar' });
  }
  next();
};

// ========== AUTHENTICATION ==========

// Register/Get User
app.post('/api/auth/register', (req, res) => {
  const { username, tiktok } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (row) return res.status(400).json({ error: 'Usuário já existe' });
    
    db.run(
      "INSERT INTO users (username, tiktok) VALUES (?, ?)",
      [username, tiktok || ''],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, username, message: 'Usuário criado' });
      }
    );
  });
});

// Verify Key
app.post('/api/auth/verify-key', (req, res) => {
  const { username, key } = req.body;
  
  db.get("SELECT users.*, keys.key_value FROM users LEFT JOIN keys ON users.id = keys.user_id WHERE users.username = ?", [username], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Usuário não encontrado', valid: false });
    if (user.banned) return res.status(403).json({ error: 'Usuário banido', valid: false });
    if (!user.access_granted && user.role !== 'OWNER') return res.status(403).json({ error: 'Acesso não liberado', valid: false });
    if (user.key_value !== key) return res.status(401).json({ error: 'Key incorreta', valid: false });
    
    // Check access time
    if (user.access_time > 0) {
      const now = new Date().getTime();
      if (now > user.access_time) {
        return res.status(403).json({ error: 'Acesso expirado', valid: false });
      }
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ valid: true, token, username: user.username, role: user.role, message: 'Key válida!' });
  });
});

// ========== OWNER PANEL ==========

// Get all users
app.get('/api/owner/users', verifyToken, verifyOwner, (req, res) => {
  db.all("SELECT id, username, tiktok, role, access_granted, banned, access_time, created_at FROM users", [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

// Grant Access
app.post('/api/owner/grant-access', verifyToken, verifyOwner, (req, res) => {
  const { username } = req.body;
  
  db.run(
    "UPDATE users SET access_granted = 1, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
    [username],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Acesso liberado' });
    }
  );
});

// Ban User
app.post('/api/owner/ban-user', verifyToken, verifyOwner, (req, res) => {
  const { user_id, reason } = req.body;
  
  db.run(
    "UPDATE users SET banned = 1 WHERE id = ?",
    [user_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        "INSERT INTO bans (user_id, banned_by, reason) VALUES (?, ?, ?)",
        [user_id, req.user.id, reason || 'Banido pelo dono'],
        () => {
          // Invalidate all sessions
          db.run("DELETE FROM sessions WHERE user_id = ?", [user_id]);
          res.json({ success: true, message: 'Usuário banido' });
        }
      );
    }
  );
});

// Set User Time
app.post('/api/owner/set-time', verifyToken, verifyOwner, (req, res) => {
  const { user_id, hours } = req.body;
  const accessTime = new Date().getTime() + (hours * 60 * 60 * 1000);
  
  db.run(
    "UPDATE users SET access_time = ? WHERE id = ?",
    [accessTime, user_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Tempo de acesso definido' });
    }
  );
});

// ========== VIDEO PROCESSING ==========

// Upload Video
app.post('/api/upload', verifyToken, (req, res) => {
  if (!req.files || !req.files.video) {
    return res.status(400).json({ error: 'Nenhum vídeo enviado' });
  }
  
  const video = req.files.video;
  const filename = `${req.user.id}-${Date.now()}-${video.name}`;
  const filepath = path.join('uploads', filename);
  
  video.mv(filepath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json({ 
      success: true, 
      filename: filename,
      path: filepath,
      message: 'Vídeo enviado com sucesso'
    });
  });
});

// Process Video with Effects
app.post('/api/process-video', verifyToken, (req, res) => {
  const { filename, effects } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: 'Arquivo não especificado' });
  }
  
  const inputPath = path.join('uploads', filename);
  const outputPath = path.join('processed', `processed-${Date.now()}.mp4`);
  
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  // Build FFmpeg command
  let command = FFmpeg(inputPath);
  
  // Apply effects
  if (effects.reverse) {
    command = command.videoFilter('reverse');
  }
  
  if (effects.motionBlur) {
    command = command.videoFilter('tblend=all_mode=average');
  }
  
  if (effects.ccDark) {
    command = command.videoFilter('eq=contrast=1.2:saturation=0.9:brightness=-0.1');
  }
  
  if (effects.zoom) {
    command = command.videoFilter('scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2');
  }
  
  if (effects.slowMotion) {
    command = command.videoFilter('setpts=2*PTS');
  }
  
  if (effects.upscale4k) {
    command = command.videoFilter('scale=3840:2160');
  }
  
  command
    .output(outputPath)
    .on('end', () => {
      // Save to database
      db.run(
        "INSERT INTO videos (user_id, original_file, processed_file, effects, reverse, motion_blur, cc_dark, zoom, slow_motion, upscale_4k) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          req.user.id,
          filename,
          path.basename(outputPath),
          JSON.stringify(effects),
          effects.reverse ? 1 : 0,
          effects.motionBlur ? 1 : 0,
          effects.ccDark ? 1 : 0,
          effects.zoom ? 1 : 0,
          effects.slowMotion ? 1 : 0,
          effects.upscale4k ? 1 : 0
        ],
        function(err) {
          if (err) console.error('Database error:', err);
          res.json({ 
            success: true, 
            processedFile: path.basename(outputPath),
            message: 'Vídeo processado com sucesso!' 
          });
        }
      );
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Erro ao processar vídeo: ' + err.message });
    })
    .run();
});

// Download Processed Video
app.get('/api/download/:filename', (req, res) => {
  const filepath = path.join('processed', req.params.filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  res.download(filepath);
});

// ========== RATINGS & FEEDBACK ==========

// Submit Rating
app.post('/api/rating', verifyToken, (req, res) => {
  const { video_id, stars, comment } = req.body;
  
  db.run(
    "INSERT INTO ratings (user_id, video_id, stars, comment) VALUES (?, ?, ?, ?)",
    [req.user.id, video_id, stars, comment || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, message: 'Avaliação enviada!' });
    }
  );
});

// Get Ratings
app.get('/api/ratings', (req, res) => {
  db.all(`
    SELECT r.id, r.stars, r.comment, r.created_at, u.username, u.tiktok
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `, [], (err, ratings) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(ratings);
  });
});

// Submit Feedback
app.post('/api/feedback', verifyToken, (req, res) => {
  const { message, type } = req.body;
  
  db.run(
    "INSERT INTO feedback (user_id, message, type) VALUES (?, ?, ?)",
    [req.user.id, message, type || 'feedback'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Feedback enviado!' });
    }
  );
});

// Get Feedback (Owner only)
app.get('/api/owner/feedback', verifyToken, verifyOwner, (req, res) => {
  db.all(`
    SELECT f.id, f.message, f.type, f.created_at, u.username
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `, [], (err, feedback) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(feedback);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║  🔥 FTBL SMOOTH - SERVER INICIADO   ║
║        http://localhost:${PORT}         ║
║                                      ║
║  Criador: neyftbl                    ║
║  Tema: Preto + Azul-Ciano            ║
╚══════════════════════════════════════╝
  `);
});

module.exports = app;
