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

// Criar avaliação
router.post('/create', verifyToken, async (req, res) => {
  const { videoId, stars, comment } = req.body;
  
  try {
    const result = await db.run(
      'INSERT INTO ratings (user_id, video_id, stars, comment, app_version) VALUES (?, ?, ?, ?, ?)',
      [req.userId, videoId, stars, comment, '1.0.0']
    );

    res.json({ success: true, ratingId: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Obter todas as avaliações
router.get('/all', async (req, res) => {
  try {
    const ratings = await db.all(`
      SELECT r.*, u.username, u.tiktok, u.avatar FROM ratings r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
