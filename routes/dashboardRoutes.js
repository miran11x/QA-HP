const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Get dashboard statistics
router.get('/stats', (req, res) => {
  // Count total users
  db.get('SELECT COUNT(*) as total FROM users', (err, totalUsers) => {
    if (err) {
      console.error('Error counting total users:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Count agents
    db.get('SELECT COUNT(*) as total FROM users WHERE role = ?', ['Agent'], (err, totalAgents) => {
      if (err) {
        console.error('Error counting agents:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // For now, return 0 for evaluations, coaching, and sessions (no data yet)
      res.json({
        totalUsers: totalUsers.total,
        totalAgents: totalAgents.total,
        totalEvaluations: 0,
        pendingCoaching: 0,
        activeSessions: 0
      });
    });
  });
});

module.exports = router;