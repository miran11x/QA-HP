const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const evaluationsRoutes = require('./routes/evaluationsRoutes');
const auditsRoutes = require('./routes/auditsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const queueMetricsRoutes = require('./routes/queueMetricsRoutes');
const spotChecksRoutes = require('./routes/spotChecksRoutes');
const vivaRoutes = require('./routes/vivaRoutes');
const sessionsRoutes = require('./routes/sessionsRoutes');

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