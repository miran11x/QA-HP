const pool = require('../utils/db');

// Get all agents
const getAllAgents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, team_leader, assigned_qa, created_at 
       FROM users 
       WHERE role = 'agent' 
       ORDER BY name`
    );

    res.json({
      success: true,
      count: result.rows.length,
      agents: result.rows
    });

  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agents',
      error: error.message
    });
  }
};

// Get agents by QA
const getAgentsByQA = async (req, res) => {
  try {
    const { qa_name } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, team_leader, assigned_qa, created_at 
       FROM users 
       WHERE role = 'agent' AND assigned_qa = $1 
       ORDER BY name`,
      [qa_name]
    );

    res.json({
      success: true,
      count: result.rows.length,
      agents: result.rows
    });

  } catch (error) {
    console.error('Get agents by QA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agents',
      error: error.message
    });
  }
};

// Get agents by Team Leader
const getAgentsByTeamLeader = async (req, res) => {
  try {
    const { team_leader } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, team_leader, assigned_qa, created_at 
       FROM users 
       WHERE role = 'agent' AND team_leader = $1 
       ORDER BY name`,
      [team_leader]
    );

    res.json({
      success: true,
      count: result.rows.length,
      agents: result.rows
    });

  } catch (error) {
    console.error('Get agents by team leader error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agents',
      error: error.message
    });
  }
};

// Get all staff (QAs, Trainers, Supervisors, Owner)
const getAllStaff = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at 
       FROM users 
       WHERE role IN ('qa', 'trainer', 'supervisor', 'owner') 
       ORDER BY role, name`
    );

    res.json({
      success: true,
      count: result.rows.length,
      staff: result.rows
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching staff',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, role, team_leader, assigned_qa, created_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: error.message
    });
  }
};

// Get dashboard stats for QA
const getQADashboard = async (req, res) => {
  try {
    const { qa_name } = req.params;

    // Get current month evaluations
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Total evaluations this month
    const evaluationsResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM evaluations 
       WHERE qa_name = $1 AND evaluation_date >= $2`,
      [qa_name, firstDayOfMonth]
    );

    // Assigned agents count
    const agentsResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM users 
       WHERE role = 'agent' AND assigned_qa = $1`,
      [qa_name]
    );

    const totalEvaluations = parseInt(evaluationsResult.rows[0].total);
    const assignedAgents = parseInt(agentsResult.rows[0].total);
    const target = assignedAgents * 20; // 20 evaluations per agent
    const remaining = Math.max(0, target - totalEvaluations);
    const progress = target > 0 ? Math.round((totalEvaluations / target) * 100) : 0;

    // Pending coaching count
    const pendingCoachingResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM evaluations 
       WHERE qa_name = $1 AND coaching_status = 'Pending'`,
      [qa_name]
    );

    res.json({
      success: true,
      dashboard: {
        qa_name,
        assigned_agents: assignedAgents,
        monthly_target: target,
        completed_evaluations: totalEvaluations,
        remaining_evaluations: remaining,
        progress_percentage: progress,
        pending_coaching: parseInt(pendingCoachingResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error('Get QA dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching QA dashboard',
      error: error.message
    });
  }
};

// Get dashboard stats for Agent
const getAgentDashboard = async (req, res) => {
  try {
    const { agent_name } = req.params;

    // Total evaluations
    const totalEvaluationsResult = await pool.query(
      `SELECT COUNT(*) as total FROM evaluations WHERE agent_name = $1`,
      [agent_name]
    );

    // Average score
    const avgScoreResult = await pool.query(
      `SELECT AVG(overall_score) as avg_score FROM evaluations WHERE agent_name = $1`,
      [agent_name]
    );

    // Pending coaching
    const pendingCoachingResult = await pool.query(
      `SELECT COUNT(*) as total FROM evaluations WHERE agent_name = $1 AND coaching_status = 'Pending'`,
      [agent_name]
    );

    // Recent evaluations (last 10)
    const recentEvaluationsResult = await pool.query(
      `SELECT evaluation_date, overall_score, qa_name, coaching_status 
       FROM evaluations 
       WHERE agent_name = $1 
       ORDER BY evaluation_date DESC 
       LIMIT 10`,
      [agent_name]
    );

    // Agent rank (leaderboard position)
    const rankResult = await pool.query(
      `WITH agent_scores AS (
        SELECT agent_name, AVG(overall_score) as avg_score
        FROM evaluations
        GROUP BY agent_name
      ),
      ranked_agents AS (
        SELECT agent_name, avg_score, 
               ROW_NUMBER() OVER (ORDER BY avg_score DESC) as rank
        FROM agent_scores
      )
      SELECT rank FROM ranked_agents WHERE agent_name = $1`,
      [agent_name]
    );

    const avgScore = parseFloat(avgScoreResult.rows[0].avg_score) || 0;
    const rank = rankResult.rows.length > 0 ? parseInt(rankResult.rows[0].rank) : null;

    res.json({
      success: true,
      dashboard: {
        agent_name,
        total_evaluations: parseInt(totalEvaluationsResult.rows[0].total),
        average_score: Math.round(avgScore * 10) / 10,
        pending_coaching: parseInt(pendingCoachingResult.rows[0].total),
        leaderboard_rank: rank,
        recent_evaluations: recentEvaluationsResult.rows
      }
    });

  } catch (error) {
    console.error('Get agent dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agent dashboard',
      error: error.message
    });
  }
};

// Get leaderboard (top agents by average score)
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT 
        agent_name, 
        COUNT(*) as total_evaluations,
        AVG(overall_score) as avg_score,
        ROW_NUMBER() OVER (ORDER BY AVG(overall_score) DESC) as rank
      FROM evaluations
      GROUP BY agent_name
      ORDER BY avg_score DESC
      LIMIT $1`,
      [parseInt(limit)]
    );

    const leaderboard = result.rows.map(row => ({
      rank: parseInt(row.rank),
      agent_name: row.agent_name,
      total_evaluations: parseInt(row.total_evaluations),
      average_score: Math.round(parseFloat(row.avg_score) * 10) / 10
    }));

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard',
      error: error.message
    });
  }
};

module.exports = {
  getAllAgents,
  getAgentsByQA,
  getAgentsByTeamLeader,
  getAllStaff,
  getUserById,
  getQADashboard,
  getAgentDashboard,
  getLeaderboard
};