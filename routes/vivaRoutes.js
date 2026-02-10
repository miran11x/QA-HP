const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Create viva_quizzes table
db.run(`
  CREATE TABLE IF NOT EXISTS viva_quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create viva_questions table
db.run(`
  CREATE TABLE IF NOT EXISTS viva_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES viva_quizzes(id) ON DELETE CASCADE
  )
`);

// Get statistics
router.get('/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM viva_quizzes WHERE status = "active"', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.total = row.total;
    
    db.get('SELECT COUNT(*) as totalQuestions FROM viva_questions', (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.totalQuestions = row.totalQuestions;
      
      db.get('SELECT COUNT(*) as archived FROM viva_quizzes WHERE status = "archived"', (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.archived = row.archived;
        
        res.json(stats);
      });
    });
  });
});

// Get all quizzes with questions
router.get('/', (req, res) => {
  db.all('SELECT * FROM viva_quizzes ORDER BY created_at DESC', (err, quizzes) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (quizzes.length === 0) {
      return res.json([]);
    }

    const quizzesWithQuestions = [];
    let completed = 0;

    quizzes.forEach((quiz) => {
      db.all('SELECT * FROM viva_questions WHERE quiz_id = ?', [quiz.id], (err, questions) => {
        if (err) {
          console.error('Error fetching questions:', err);
        }
        quizzesWithQuestions.push({ ...quiz, questions: questions || [] });
        completed++;
        if (completed === quizzes.length) {
          res.json(quizzesWithQuestions);
        }
      });
    });
  });
});

// Create quiz with questions
router.post('/', (req, res) => {
  const { title, description, questions, created_by } = req.body;

  db.run(
    'INSERT INTO viva_quizzes (title, description, created_by) VALUES (?, ?, ?)',
    [title, description, created_by],
    function(err) {
      if (err) {
        console.error('Error creating quiz:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const quizId = this.lastID;

      if (questions && questions.length > 0) {
        const stmt = db.prepare('INSERT INTO viva_questions (quiz_id, question, answer) VALUES (?, ?, ?)');
        questions.forEach((q) => {
          stmt.run(quizId, q.question, q.answer);
        });
        stmt.finalize();
      }

      res.status(201).json({ id: quizId, message: 'Quiz created successfully' });
    }
  );
});

// Archive/Unarchive quiz
router.patch('/:id/archive', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE viva_quizzes SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        console.error('Error archiving quiz:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Quiz status updated successfully' });
    }
  );
});

// Delete quiz
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM viva_quizzes WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting quiz:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  });
});

module.exports = router;