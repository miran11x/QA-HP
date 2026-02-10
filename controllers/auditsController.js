const pool = require('../utils/db');

// Create hung-up audit
const createAudit = async (req, res) => {
  try {
    const {
      caller_number,
      agent_name,
      waiting_time,
      call_duration,
      disconnection_by,
      evaluation_comment,
      hung_up
    } = req.body;

    // Validate required fields
    if (!caller_number || !agent_name || !waiting_time || !call_duration || 
        !disconnection_by || !evaluation_comment || !hung_up) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate disconnection_by
    if (!['Agent', 'Caller'].includes(disconnection_by)) {
      return res.status(400).json({
        success: false,
        message: 'Disconnection By must be "Agent" or "Caller"'
      });
    }

    // Validate hung_up
    if (!['Correct', 'Incorrect'].includes(hung_up)) {
      return res.status(400).json({
        success: false,
        message: 'Hung-Up must be "Correct" or "Incorrect"'
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

    // Calculate percentage (100% if Correct, 0% if Incorrect)
    const percentage = hung_up === 'Correct' ? 100 : 0;

    // Insert audit
    const result = await pool.query(
      `INSERT INTO audits (
        date, caller_number, agent_name, waiting_time, call_duration,
        disconnection_by, tc_name, evaluation_comment, hung_up, percentage
      ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [caller_number, agent_name, waiting_time, call_duration, 
       disconnection_by, tc_name, evaluation_comment, hung_up, percentage]
    );

    res.status(201).json({
      success: true,
      message: 'Audit created successfully',
      audit: result.rows[0]
    });

  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating audit',
      error: error.message
    });
  }
};

// Get all audits
const getAllAudits = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM audits ORDER BY date DESC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      audits: result.rows
    });

  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching audits',
      error: error.message
    });
  }
};

// Get audits by agent
const getAuditsByAgent = async (req, res) => {
  try {
    const { agent_name } = req.params;

    const result = await pool.query(
      'SELECT * FROM audits WHERE agent_name = $1 ORDER BY date DESC',
      [agent_name]
    );

    res.json({
      success: true,
      count: result.rows.length,
      audits: result.rows
    });

  } catch (error) {
    console.error('Get agent audits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agent audits',
      error: error.message
    });
  }
};

// Get audit by ID
const getAuditById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM audits WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    res.json({
      success: true,
      audit: result.rows[0]
    });

  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching audit',
      error: error.message
    });
  }
};

// Update audit
const updateAudit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      caller_number,
      agent_name,
      waiting_time,
      call_duration,
      disconnection_by,
      evaluation_comment,
      hung_up
    } = req.body;

    // Validate hung_up if provided
    if (hung_up && !['Correct', 'Incorrect'].includes(hung_up)) {
      return res.status(400).json({
        success: false,
        message: 'Hung-Up must be "Correct" or "Incorrect"'
      });
    }

    // Validate disconnection_by if provided
    if (disconnection_by && !['Agent', 'Caller'].includes(disconnection_by)) {
      return res.status(400).json({
        success: false,
        message: 'Disconnection By must be "Agent" or "Caller"'
      });
    }

    // Calculate new percentage if hung_up is updated
    const percentage = hung_up ? (hung_up === 'Correct' ? 100 : 0) : undefined;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (caller_number) {
      updates.push(`caller_number = $${paramCount++}`);
      values.push(caller_number);
    }
    if (agent_name) {
      updates.push(`agent_name = $${paramCount++}`);
      values.push(agent_name);
    }
    if (waiting_time) {
      updates.push(`waiting_time = $${paramCount++}`);
      values.push(waiting_time);
    }
    if (call_duration) {
      updates.push(`call_duration = $${paramCount++}`);
      values.push(call_duration);
    }
    if (disconnection_by) {
      updates.push(`disconnection_by = $${paramCount++}`);
      values.push(disconnection_by);
    }
    if (evaluation_comment) {
      updates.push(`evaluation_comment = $${paramCount++}`);
      values.push(evaluation_comment);
    }
    if (hung_up) {
      updates.push(`hung_up = $${paramCount++}`);
      values.push(hung_up);
      updates.push(`percentage = $${paramCount++}`);
      values.push(percentage);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    const query = `UPDATE audits SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    res.json({
      success: true,
      message: 'Audit updated successfully',
      audit: result.rows[0]
    });

  } catch (error) {
    console.error('Update audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating audit',
      error: error.message
    });
  }
};

// Delete audit
const deleteAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM audits WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    res.json({
      success: true,
      message: 'Audit deleted successfully',
      audit: result.rows[0]
    });

  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting audit',
      error: error.message
    });
  }
};

module.exports = {
  createAudit,
  getAllAudits,
  getAuditsByAgent,
  getAuditById,
  updateAudit,
  deleteAudit
};