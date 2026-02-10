const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Create sessions table
db.run(`
  CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    trainer TEXT NOT NULL,
    agent_ids TEXT,
    date TEXT NOT NULL,
    duration TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create attendance table
db.run(`
  CREATE TABLE IF NOT EXISTS session_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    agent_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
  )
`);

// Get statistics
router.get('/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM training_sessions', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.total = row.total;
    
    db.get('SELECT COUNT(*) as pending FROM training_sessions WHERE status = "pending"', (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.pending = row.pending;
      
      db.get('SELECT COUNT(*) as completed FROM training_sessions WHERE status = "done"', (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.completed = row.completed;
        
        db.get('SELECT COUNT(*) as archived FROM training_sessions WHERE status = "archived"', (err, row) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          stats.archived = row.archived;
          
          res.json(stats);
        });
      });
    });
  });
});

// Get all sessions
router.get('/', (req, res) => {
  db.all('SELECT * FROM training_sessions ORDER BY date DESC', (err, sessions) => {
    if (err) {
      console.error('Error fetching sessions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const parsedSessions = sessions.map(session => ({
      ...session,
      agent_ids: session.agent_ids ? JSON.parse(session.agent_ids) : []
    }));
    
    res.json(parsedSessions || []);
  });
});

// Get session attendance
router.get('/:id/attendance', (req, res) => {
  const { id } = req.params;
  
  db.all('SELECT * FROM session_attendance WHERE session_id = ?', [id], (err, attendance) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Calculate stats
    const total = attendance.length;
    const done = attendance.filter(a => a.status === 'done').length;
    const pending = attendance.filter(a => a.status === 'pending').length;
    
    res.json({
      attendance,
      stats: { total, done, pending }
    });
  });
});

// Create session (with auto-generated attendance)
router.post('/', (req, res) => {
  const { title, description, trainer, agent_ids, date, duration } = req.body;

  db.run(
    'INSERT INTO training_sessions (title, description, trainer, agent_ids, date, duration) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, trainer, JSON.stringify(agent_ids), date, duration],
    function(err) {
      if (err) {
        console.error('Error creating session:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const sessionId = this.lastID;
      
      // Get all agents to create attendance records
      db.all('SELECT id, name FROM users WHERE role = "agent"', (err, agents) => {
        if (err) {
          console.error('Error fetching agents:', err);
          return res.status(201).json({ id: sessionId, message: 'Session created but attendance not generated' });
        }
        
        // Create attendance record for each agent
        const stmt = db.prepare('INSERT INTO session_attendance (session_id, agent_id, agent_name, status) VALUES (?, ?, ?, ?)');
        agents.forEach(agent => {
          stmt.run(sessionId, agent.id, agent.name, 'pending');
        });
        stmt.finalize();
        
        res.status(201).json({ id: sessionId, message: 'Session created successfully with attendance records' });
      });
    }
  );
});

// Update attendance status for an agent
router.patch('/:sessionId/attendance/:agentId', (req, res) => {
  const { sessionId, agentId } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE session_attendance SET status = ? WHERE session_id = ? AND agent_id = ?',
    [status, sessionId, agentId],
    function(err) {
      if (err) {
        console.error('Error updating attendance:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Attendance updated successfully' });
    }
  );
});

// Update session
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, trainer, agent_ids, date, duration, status } = req.body;

  db.run(
    'UPDATE training_sessions SET title = ?, description = ?, trainer = ?, agent_ids = ?, date = ?, duration = ?, status = ? WHERE id = ?',
    [title, description, trainer, JSON.stringify(agent_ids), date, duration, status, id],
    function(err) {
      if (err) {
        console.error('Error updating session:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Session updated successfully' });
    }
  );
});

// Archive/Unarchive session
router.patch('/:id/archive', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE training_sessions SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        console.error('Error archiving session:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Session status updated successfully' });
    }
  );
});

// Delete session
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM training_sessions WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting session:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Session deleted successfully' });
  });
});

module.exports = router;