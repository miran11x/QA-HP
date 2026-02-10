const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all audits
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM audits ORDER BY audit_date DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching audits:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Make sure we return an array even if empty
    res.json(rows || []);
  });
});

// Delete audit
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM audits WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting audit:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({ message: 'Audit deleted successfully' });
  });
});

module.exports = router;