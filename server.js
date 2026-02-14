const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes.js');
const usersRoutes = require('./routes/usersRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const evaluationsRoutes = require('./routes/evaluationsRoutes.js');
const auditsRoutes = require('./routes/auditsRoutes.js');
const reportsRoutes = require('./routes/reportsRoutes.js');
const activityLogRoutes = require('./routes/activityLogRoutes.js');
const queueMetricsRoutes = require('./routes/queueMetricsRoutes.js');
const spotChecksRoutes = require('./routes/spotChecksRoutes.js');
const vivaRoutes = require('./routes/vivaRoutes.js');
const sessionsRoutes = require('./routes/sessionsRoutes.js');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/queue-metrics', queueMetricsRoutes);
app.use('/api/spot-checks', spotChecksRoutes);
app.use('/api/viva', vivaRoutes);
app.use('/api/sessions', sessionsRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Runaki QA System API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ All routes connected successfully!`);
});