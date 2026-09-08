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

// Enviar feedback
router.post('/send', verifyToken, async (req, res) => {
  const { type, message } = req.body;
  
  try {
    await db.run(
      'INSERT INTO feedback (user_id, type, message) VALUES (?, ?, ?)',
      [req.userId, type, message]
    );
    res.json({ success: true, message: 'Feedback enviado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar feedback' });
  }
});

module.exports = router;
