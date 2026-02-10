const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Create spot_checks table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS spot_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    agent_name TEXT NOT NULL,
    call_date TEXT NOT NULL,
    score INTEGER NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id)
  )
`);

// Get statistics
router.get('/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM spot_checks WHERE status = "active"', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.total = row.total;
    
    db.get('SELECT AVG(score) as avg FROM spot_checks WHERE status = "active"', (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.avgScore = Math.round(row.avg || 0);
      
      db.get('SELECT COUNT(*) as passed FROM spot_checks WHERE status = "active" AND score >= 80', (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.passed = row.passed;
        
        db.get('SELECT COUNT(*) as archived FROM spot_checks WHERE status = "archived"', (err, row) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          stats.archived = row.archived;
          
          res.json(stats);
        });
      });
    });
  });
});

// Get all spot checks
router.get('/', (req, res) => {
  db.all('SELECT * FROM spot_checks ORDER BY created_at DESC', (err, checks) => {
    if (err) {
      console.error('Error fetching spot checks:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(checks || []);
  });
});

// Create spot check
router.post('/', (req, res) => {
  const { agent_id, agent_name, call_date, score, notes, created_by } = req.body;

  db.run(
    'INSERT INTO spot_checks (agent_id, agent_name, call_date, score, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [agent_id, agent_name, call_date, score, notes, created_by],
    function(err) {
      if (err) {
        console.error('Error creating spot check:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, message: 'Spot check created successfully' });
    }
  );
});

// Archive/Unarchive spot check
router.patch('/:id/archive', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE spot_checks SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        console.error('Error archiving spot check:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Spot check status updated successfully' });
    }
  );
});

// Delete spot check
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM spot_checks WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting spot check:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Spot check deleted successfully' });
  });
});

module.exports = router;