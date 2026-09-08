const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.isOwner = decoded.isOwner;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const verifyOwner = (req, res, next) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Acesso apenas para o dono' });
  next();
};

// Painel do Dono - Dados gerais
router.get('/dashboard', verifyToken, verifyOwner, async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const activeUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE status = "ativo"');
    const bannedUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE is_banned = 1');
    const totalVideos = await db.get('SELECT COUNT(*) as count FROM videos');
    const totalRatings = await db.get('SELECT COUNT(*) as count FROM ratings');

    res.json({
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      bannedUsers: bannedUsers.count,
      totalVideos: totalVideos.count,
      totalRatings: totalRatings.count
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Banir usuário
router.post('/ban-user', verifyToken, verifyOwner, async (req, res) => {
  const { userId } = req.body;
  
  try {
    await db.run('UPDATE users SET is_banned = 1 WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Usuário banido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Liberar usuário por TikTok
router.post('/grant-access', verifyToken, verifyOwner, async (req, res) => {
  const { tiktok, days } = req.body;
  
  try {
    let user = await db.get('SELECT * FROM users WHERE tiktok = ?', [tiktok]);
    
    if (!user) {
      const username = tiktok.replace('@', '');
      const result = await db.run(
        'INSERT INTO users (username, tiktok, status, access_level) VALUES (?, ?, ?, ?)',
        [username, tiktok, 'ativo', 'user']
      );
      user = { id: result.lastID, username, tiktok };
    }

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (days || 30));
    
    await db.run(
      'UPDATE users SET status = ?, access_expires_at = ? WHERE id = ?',
      ['ativo', expireDate.toISOString(), user.id]
    );

    res.json({ success: true, message: 'Usuário liberado', user });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Copiar configurações (Reverse, CC, Motion Blur, etc)
router.post('/copy-config', verifyToken, verifyOwner, async (req, res) => {
  const { sourceVideoId, type } = req.body;
  
  try {
    const config = await db.get(
      'SELECT * FROM video_processing WHERE video_id = ?',
      [sourceVideoId]
    );
    if (!config) return res.status(404).json({ error: 'Configuração não encontrada' });

    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Obter denúncias
router.get('/reports', verifyToken, verifyOwner, async (req, res) => {
  try {
    const reports = await db.all(`
      SELECT r.*, c.text, u.username FROM reports r
      JOIN comments c ON r.comment_id = c.id
      JOIN users u ON r.reported_by = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Remover comentário
router.post('/remove-comment', verifyToken, verifyOwner, async (req, res) => {
  const { commentId } = req.body;
  
  try {
    await db.run('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ success: true, message: 'Comentário removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
