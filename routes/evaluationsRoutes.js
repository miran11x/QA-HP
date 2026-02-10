const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all evaluations
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM evaluations ORDER BY evaluation_date DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching evaluations:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Make sure we return an array even if empty
    res.json(rows || []);
  });
});

// Update coaching status
router.patch('/:id/coaching', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { coaching_status } = req.body;

  db.run(
    'UPDATE evaluations SET coaching_status = ? WHERE id = ?',
    [coaching_status, id],
    function (err) {
      if (err) {
        console.error('Error updating coaching status:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      res.json({ message: 'Coaching status updated successfully' });
    }
  );
});

module.exports = router;