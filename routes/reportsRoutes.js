const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');

// Get report stats
router.get('/stats', authenticateToken, (req, res) => {
  const stats = {
    totalEvaluations: 0,
    thisWeek: 0,
    thisMonth: 0,
    averageScore: 0
  };

  // Get total evaluations
  db.get('SELECT COUNT(*) as count FROM evaluations', (err, result) => {
    if (!err && result) {
      stats.totalEvaluations = result.count;
    }

    // Get this week's evaluations
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    db.get(
      'SELECT COUNT(*) as count FROM evaluations WHERE created_at >= ?',
      [weekAgo.toISOString()],
      (err, result) => {
        if (!err && result) {
          stats.thisWeek = result.count;
        }

        // Get this month's evaluations
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        db.get(
          'SELECT COUNT(*) as count FROM evaluations WHERE created_at >= ?',
          [monthAgo.toISOString()],
          (err, result) => {
            if (!err && result) {
              stats.thisMonth = result.count;
            }

            // Get average score
            db.get(
              'SELECT AVG(overall_score_percentage) as avg FROM evaluations',
              (err, result) => {
                if (!err && result && result.avg) {
                  stats.averageScore = Math.round(result.avg);
                }

                res.json(stats);
              }
            );
          }
        );
      }
    );
  });
});

// Export weekly report
router.get('/export/weekly', authenticateToken, async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    db.all(
      `SELECT * FROM evaluations WHERE created_at >= ? ORDER BY qa_name, created_at`,
      [weekAgo.toISOString()],
      async (err, evaluations) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Weekly Report');

        // Add headers
        worksheet.columns = [
          { header: 'Call Date', key: 'call_date', width: 15 },
          { header: 'Call Time', key: 'call_time', width: 12 },
          { header: 'Evaluation Date', key: 'evaluation_date', width: 15 },
          { header: 'Agent Name', key: 'agent_name', width: 25 },
          { header: 'Agent Email', key: 'agent_email', width: 30 },
          { header: 'TC', key: 'tc', width: 20 },
          { header: 'QA Name', key: 'qa_name', width: 20 },
          { header: 'Call Unique ID', key: 'call_unique_id', width: 20 },
          { header: 'Duration', key: 'duration', width: 12 },
          { header: 'Overall Score', key: 'overall_score', width: 12 },
          { header: 'Overall Score %', key: 'overall_score_percentage', width: 15 }
        ];

        // Add data
        evaluations.forEach(evaluation => {
          worksheet.addRow({
            call_date: evaluation.call_date || 'N/A',
            call_time: evaluation.call_time || 'N/A',
            evaluation_date: evaluation.evaluation_date || 'N/A',
            agent_name: evaluation.agent_name || 'N/A',
            agent_email: evaluation.agent_email || 'N/A',
            tc: evaluation.tc || 'N/A',
            qa_name: evaluation.qa_name || 'N/A',
            call_unique_id: evaluation.call_unique_id || 'N/A',
            duration: evaluation.duration || 'N/A',
            overall_score: evaluation.overall_score || 0,
            overall_score_percentage: `${evaluation.overall_score_percentage || 0}%`
          });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }
        };

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=Weekly_Report_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
      }
    );
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Export monthly report
router.get('/export/monthly', authenticateToken, async (req, res) => {
  try {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    db.all(
      `SELECT * FROM evaluations WHERE created_at >= ? ORDER BY qa_name, created_at`,
      [monthAgo.toISOString()],
      async (err, evaluations) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Monthly Report');

        // Add headers
        worksheet.columns = [
          { header: 'Call Date', key: 'call_date', width: 15 },
          { header: 'Call Time', key: 'call_time', width: 12 },
          { header: 'Evaluation Date', key: 'evaluation_date', width: 15 },
          { header: 'Agent Name', key: 'agent_name', width: 25 },
          { header: 'Agent Email', key: 'agent_email', width: 30 },
          { header: 'TC', key: 'tc', width: 20 },
          { header: 'QA Name', key: 'qa_name', width: 20 },
          { header: 'Call Unique ID', key: 'call_unique_id', width: 20 },
          { header: 'Duration', key: 'duration', width: 12 },
          { header: 'Overall Score', key: 'overall_score', width: 12 },
          { header: 'Overall Score %', key: 'overall_score_percentage', width: 15 }
        ];

        // Add data
        evaluations.forEach(evaluation => {
          worksheet.addRow({
            call_date: evaluation.call_date || 'N/A',
            call_time: evaluation.call_time || 'N/A',
            evaluation_date: evaluation.evaluation_date || 'N/A',
            agent_name: evaluation.agent_name || 'N/A',
            agent_email: evaluation.agent_email || 'N/A',
            tc: evaluation.tc || 'N/A',
            qa_name: evaluation.qa_name || 'N/A',
            call_unique_id: evaluation.call_unique_id || 'N/A',
            duration: evaluation.duration || 'N/A',
            overall_score: evaluation.overall_score || 0,
            overall_score_percentage: `${evaluation.overall_score_percentage || 0}%`
          });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }
        };

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=Monthly_Report_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
      }
    );
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Export finance report (2 tabs)
router.get('/export/finance', authenticateToken, async (req, res) => {
  try {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    db.all(
      `SELECT * FROM evaluations WHERE created_at >= ? ORDER BY qa_name, created_at`,
      [monthAgo.toISOString()],
      async (err, evaluations) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        const workbook = new ExcelJS.Workbook();

        // TAB 1: Raw Data
        const rawSheet = workbook.addWorksheet('Raw Data');
        rawSheet.columns = [
          { header: 'Call Date', key: 'call_date', width: 15 },
          { header: 'Call Time', key: 'call_time', width: 12 },
          { header: 'Evaluation Date', key: 'evaluation_date', width: 15 },
          { header: 'Agent Name', key: 'agent_name', width: 25 },
          { header: 'Agent Email', key: 'agent_email', width: 30 },
          { header: 'TC', key: 'tc', width: 20 },
          { header: 'QA Name', key: 'qa_name', width: 20 },
          { header: 'Call Unique ID', key: 'call_unique_id', width: 20 },
          { header: 'Duration', key: 'duration', width: 12 },
          { header: 'Overall Score', key: 'overall_score', width: 12 },
          { header: 'Overall Score %', key: 'overall_score_percentage', width: 15 }
        ];

        evaluations.forEach(evaluation => {
          rawSheet.addRow({
            call_date: evaluation.call_date || 'N/A',
            call_time: evaluation.call_time || 'N/A',
            evaluation_date: evaluation.evaluation_date || 'N/A',
            agent_name: evaluation.agent_name || 'N/A',
            agent_email: evaluation.agent_email || 'N/A',
            tc: evaluation.tc || 'N/A',
            qa_name: evaluation.qa_name || 'N/A',
            call_unique_id: evaluation.call_unique_id || 'N/A',
            duration: evaluation.duration || 'N/A',
            overall_score: evaluation.overall_score || 0,
            overall_score_percentage: `${evaluation.overall_score_percentage || 0}%`
          });
        });

        rawSheet.getRow(1).font = { bold: true };
        rawSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }
        };

        // TAB 2: Summary for Finance
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
          { header: 'Agent Name', key: 'agent_name', width: 25 },
          { header: 'Agent Email', key: 'agent_email', width: 30 },
          { header: 'Total Evaluated Calls', key: 'total_calls', width: 20 },
          { header: 'Avg Score %', key: 'avg_score', width: 15 }
        ];

        // Calculate summary data
        const agentStats = {};
        evaluations.forEach(evaluation => {
          const agentEmail = evaluation.agent_email;
          if (!agentStats[agentEmail]) {
            agentStats[agentEmail] = {
              name: evaluation.agent_name,
              email: agentEmail,
              totalCalls: 0,
              totalScore: 0
            };
          }
          agentStats[agentEmail].totalCalls++;
          agentStats[agentEmail].totalScore += evaluation.overall_score_percentage || 0;
        });

        Object.values(agentStats).forEach(agent => {
          summarySheet.addRow({
            agent_name: agent.name,
            agent_email: agent.email,
            total_calls: agent.totalCalls,
            avg_score: `${Math.round(agent.totalScore / agent.totalCalls)}%`
          });
        });

        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }
        };

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=Monthly_Finance_Report_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
      }
    );
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;