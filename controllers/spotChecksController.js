const pool = require('../utils/db');

// Create spot check (all 4 types)
const createSpotCheck = async (req, res) => {
  try {
    const {
      type,
      caller_number,
      agent_name,
      result,
      detailed_comment
    } = req.body;

    // Validate required fields
    if (!type || !caller_number || !agent_name || !result || !detailed_comment) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (type, caller_number, agent_name, result, detailed_comment)'
      });
    }

    // Validate type
    const validTypes = ['communication', 'new_levels', 'hold_unhold', 'indra'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be: communication, new_levels, hold_unhold, or indra'
      });
    }

    // Validate result based on type
    let validResults = [];
    switch(type) {
      case 'communication':
        validResults = ['Correct', 'Incorrect'];
        break;
      case 'new_levels':
        validResults = ['Correct', 'Incorrect'];
        break;
      case 'hold_unhold':
        validResults = ['Correct', 'Incorrect'];
        break;
      case 'indra':
        validResults = ['Used', 'Not Used'];
        break;
    }

    if (!validResults.includes(result)) {
      return res.status(400).json({
        success: false,
        message: `Invalid result for ${type}. Must be: ${validResults.join(' or ')}`
      });
    }

    // Get TC name from agents table
    const agentResult = await pool.query(
      'SELECT team_leader FROM users WHERE name = $1 AND role = $2',
      [agent_name, 'agent']
    );

    if (agentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const tc_name = agentResult.rows[0].team_leader;

    // Calculate score (100% if Correct/Used, 0% if Incorrect/Not Used)
    let score_percentage;
    if (type === 'indra') {
      score_percentage = result === 'Used' ? 100 : 0;
    } else {
      score_percentage = result === 'Correct' ? 100 : 0;
    }

    // Insert spot check
    const insertResult = await pool.query(
      `INSERT INTO spot_checks (
        type, date, caller_number, agent_name, tc_name, 
        result, detailed_comment, score_percentage
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [type, caller_number, agent_name, tc_name, result, detailed_comment, score_percentage]
    );

    res.status(201).json({
      success: true,
      message: 'Spot check created successfully',
      spot_check: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Create spot check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating spot check',
      error: error.message
    });
  }
};

// Get all spot checks
const getAllSpotChecks = async (req, res) => {
  try {
    const { type } = req.query; // Optional filter by type

    let query = 'SELECT * FROM spot_checks';
    let params = [];

    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      spot_checks: result.rows
    });

  } catch (error) {
    console.error('Get spot checks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching spot checks',
      error: error.message
    });
  }
};

// Get spot checks by agent
const getSpotChecksByAgent = async (req, res) => {
  try {
    const { agent_name } = req.params;

    const result = await pool.query(
      'SELECT * FROM spot_checks WHERE agent_name = $1 ORDER BY date DESC',
      [agent_name]
    );

    res.json({
      success: true,
      count: result.rows.length,
      spot_checks: result.rows
    });

  } catch (error) {
    console.error('Get agent spot checks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agent spot checks',
      error: error.message
    });
  }
};

// Get spot checks by type
const getSpotChecksByType = async (req, res) => {
  try {
    const { type } = req.params;

    const validTypes = ['communication', 'new_levels', 'hold_unhold', 'indra'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be: communication, new_levels, hold_unhold, or indra'
      });
    }

    const result = await pool.query(
      'SELECT * FROM spot_checks WHERE type = $1 ORDER BY date DESC',
      [type]
    );

    res.json({
      success: true,
      count: result.rows.length,
      spot_checks: result.rows
    });

  } catch (error) {
    console.error('Get spot checks by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching spot checks',
      error: error.message
    });
  }
};

// Get spot check by ID
const getSpotCheckById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM spot_checks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Spot check not found'
      });
    }

    res.json({
      success: true,
      spot_check: result.rows[0]
    });

  } catch (error) {
    console.error('Get spot check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching spot check',
      error: error.message
    });
  }
};

// Delete spot check
const deleteSpotCheck = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM spot_checks WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Spot check not found'
      });
    }

    res.json({
      success: true,
      message: 'Spot check deleted successfully',
      spot_check: result.rows[0]
    });

  } catch (error) {
    console.error('Delete spot check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting spot check',
      error: error.message
    });
  }
};

module.exports = {
  createSpotCheck,
  getAllSpotChecks,
  getSpotChecksByAgent,
  getSpotChecksByType,
  getSpotCheckById,
  deleteSpotCheck
};