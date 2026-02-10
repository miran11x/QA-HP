const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create activity_logs table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating activity_logs table:', err);
  }
});

// Get all activity logs
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100',
    (err, activities) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(activities || []);
    }
  );
});

// Create activity log (helper function for other routes to use)
const createActivityLog = (action, description, performedBy, details = null) => {
  db.run(
    'INSERT INTO activity_logs (action, description, performed_by, details, created_at) VALUES (?, ?, ?, ?, ?)',
    [action, description, performedBy, details, new Date().toISOString()],
    (err) => {
      if (err) {
        console.error('Error creating activity log:', err);
      }
    }
  );
};

// Export the helper function
router.createActivityLog = createActivityLog;

module.exports = router;