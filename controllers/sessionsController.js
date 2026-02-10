const db = require('../utils/db');

// ================= CREATE SESSION =================
const createSession = (req, res) => {
  const { title, description, session_date } = req.body;

  if (!title || !session_date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }

  db.run(
    `INSERT INTO sessions (title, description, session_date) VALUES (?, ?, ?)`,
    [title, description, session_date],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create session' });
      }

      const sessionId = this.lastID;

      // Create attendance for 75 agents
      db.all(`SELECT name FROM users WHERE role = 'agent'`, [], (err, agents) => {
        if (err) return res.status(500).json({ error: 'Failed to create attendance' });

        const stmt = db.prepare(
          `INSERT INTO session_attendance (session_id, agent_name) VALUES (?, ?)`
        );

        agents.forEach(agent => {
          stmt.run(sessionId, agent.name);
        });

        stmt.finalize();
        res.json({ message: 'Session created successfully' });
      });
    }
  );
};

// ================= GET ALL SESSIONS =================
const getAllSessions = (req, res) => {
  const status = req.query.status || 'active';

  db.all(
    `SELECT * FROM sessions WHERE status = ? ORDER BY created_at DESC`,
    [status],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });

      res.json({ sessions: rows });
    }
  );
};

// ================= GET SESSION DETAILS =================
const getSessionById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM sessions WHERE id = ?`, [id], (err, session) => {
    if (!session) return res.status(404).json({ error: 'Session not found' });

    db.all(
      `SELECT * FROM session_attendance WHERE session_id = ?`,
      [id],
      (err, attendance) => {
        res.json({
          ...session,
          attendance,
          attendance_done: attendance.filter(a => a.status === 'done').length,
          attendance_pending: attendance.filter(a => a.status === 'pending').length
        });
      }
    );
  });
};

// ================= UPDATE ATTENDANCE =================
const updateAttendanceStatus = (req, res) => {
  const { id, agentName } = req.params;
  const { status } = req.body;

  db.run(
    `UPDATE session_attendance SET status = ? WHERE session_id = ? AND agent_name = ?`,
    [status, id, agentName],
    err => {
      if (err) return res.status(500).json({ error: 'Failed to update attendance' });
      res.json({ message: 'Attendance updated' });
    }
  );
};

// ================= ARCHIVE SESSION =================
const archiveSession = (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE sessions SET status = 'archived' WHERE id = ?`,
    [id],
    err => {
      if (err) return res.status(500).json({ error: 'Failed to archive session' });
      res.json({ message: 'Session archived' });
    }
  );
};

// ================= DELETE SESSION =================
const deleteSession = (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM sessions WHERE id = ?`, [id], err => {
    if (err) return res.status(500).json({ error: 'Failed to delete session' });
    res.json({ message: 'Session deleted' });
  });
};

// ================= EXPORTS =================
module.exports = {
  createSession,
  getAllSessions,
  getSessionById,
  updateAttendanceStatus,
  archiveSession,
  deleteSession
};

