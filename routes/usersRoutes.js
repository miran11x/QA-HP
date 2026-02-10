const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const bcrypt = require('bcryptjs');

// Get user statistics
router.get('/stats', (req, res) => {
  db.all('SELECT role FROM users', (err, users) => {
    if (err) {
      console.error('Error fetching stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const stats = {
      total: users.length,
      agents: users.filter(u => u.role === 'agent').length,
      qa: users.filter(u => u.role === 'qa').length,
      trainers: users.filter(u => u.role === 'trainer').length,
      supervisors: users.filter(u => u.role === 'supervisor').length,
      owners: users.filter(u => u.role === 'owner').length
    };

    res.json(stats);
  });
});

// Get all users
router.get('/', (req, res) => {
  db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users || []);
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

// Create new user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [name, email, hashedPassword, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          console.error('Error creating user:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          id: this.lastID,
          name,
          email,
          role,
          message: 'User created successfully'
        });
      }
    );
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  try {
    let query = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
    let params = [name, email, role, id];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?';
      params = [name, email, role, hashedPassword, id];
    }

    db.run(query, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Error updating user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User updated successfully' });
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;