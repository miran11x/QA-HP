const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get queue metrics
router.get('/', authenticateToken, (req, res) => {
  const metrics = {
    totalCalls: 0,
    avgWaitTime: 0,
    avgHandleTime: 0,
    abandonRate: 0
  };

  // Return dummy data for now (you can implement real logic later)
  res.json(metrics);
});

module.exports = router;