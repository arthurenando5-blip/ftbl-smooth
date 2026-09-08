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
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const verifyOwner = (req, res, next) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Acesso apenas para o dono' });
  next();
};

// Criar comentário
router.post('/create', verifyToken, async (req, res) => {
  const { ratingId, text } = req.body;
  
  try {
    const result = await db.run(
      'INSERT INTO comments (rating_id, user_id, text) VALUES (?, ?, ?)',
      [ratingId, req.userId, text]
    );
    res.json({ success: true, commentId: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar comentário' });
  }
});

// Obter comentários de uma avaliação
router.get('/rating/:ratingId', async (req, res) => {
  try {
    const comments = await db.all(`
      SELECT c.*, u.username, u.avatar, u.is_owner,
             (SELECT COUNT(*) FROM likes WHERE comment_id = c.id) as likeCount
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.rating_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.ratingId]);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Curtir comentário
router.post('/like', verifyToken, async (req, res) => {
  const { commentId } = req.body;
  
  try {
    // Verificar se já curtiu
    const like = await db.get(
      'SELECT * FROM likes WHERE comment_id = ? AND user_id = ?',
      [commentId, req.userId]
    );
    
    if (like) {
      // Remover curtida
      await db.run('DELETE FROM likes WHERE comment_id = ? AND user_id = ?', [commentId, req.userId]);
      res.json({ success: true, liked: false });
    } else {
      // Adicionar curtida
      await db.run(
        'INSERT INTO likes (comment_id, user_id) VALUES (?, ?)',
        [commentId, req.userId]
      );
      res.json({ success: true, liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao curtir' });
  }
});

// Denunciar comentário
router.post('/report', verifyToken, async (req, res) => {
  const { commentId, reason } = req.body;
  
  try {
    await db.run(
      'INSERT INTO reports (comment_id, reported_by, reason) VALUES (?, ?, ?)',
      [commentId, req.userId, reason]
    );
    res.json({ success: true, message: 'Denúncia enviada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao denunciar' });
  }
});

module.exports = router;
