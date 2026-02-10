const pool = require('../utils/db');

// Create new evaluation
const createEvaluation = async (req, res) => {
  try {
    const {
      agent_name,
      coordinator,
      qa_name,
      subject,
      phone_number,
      ticket_id,
      waiting_time,
      call_duration,
      email_address,
      greeting_script,
      customer_info,
      faq_alignment,
      tagging_topic,
      communication_problem_solving,
      tone_of_voice,
      ending,
      rude_behaviour,
      hang_up,
      active_listening,
      improvement_areas,
      positive_comments,
      bad_comments,
      feedback,
      hold_unhold,
      coaching_status
    } = req.body;

    // Validate required fields
    const requiredFields = {
      agent_name, coordinator, qa_name, subject, phone_number,
      waiting_time, call_duration, email_address,
      greeting_script, customer_info, faq_alignment, tagging_topic,
      communication_problem_solving, tone_of_voice, ending,
      rude_behaviour, hang_up, active_listening,
      improvement_areas, positive_comments, bad_comments,
      feedback, hold_unhold, coaching_status
    };

    const missingFields = Object.keys(requiredFields).filter(key => 
      requiredFields[key] === undefined || requiredFields[key] === null || requiredFields[key] === ''
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        missing_fields: missingFields
      });
    }

    // Format phone number (remove leading 0 if 11 digits)
    let formatted_phone = phone_number.replace(/\s/g, ''); // Remove spaces
    if (formatted_phone.length === 11 && formatted_phone.startsWith('0')) {
      formatted_phone = formatted_phone.substring(1);
    }

    // Validate phone number is 10 digits
    if (formatted_phone.length !== 10 || !/^\d{10}$/.test(formatted_phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    // Calculate overall score (sum of 10 criteria, max 10)
    const overall_score = 
      greeting_script + customer_info + faq_alignment + tagging_topic +
      communication_problem_solving + tone_of_voice + ending +
      rude_behaviour + hang_up + active_listening;

    // Insert evaluation
    const result = await pool.query(
      `INSERT INTO evaluations (
        agent_name, coordinator, qa_name, subject, phone_number, ticket_id,
        waiting_time, call_duration, email_address, evaluation_date,
        greeting_script, customer_info, faq_alignment, tagging_topic,
        communication_problem_solving, tone_of_voice, ending,
        rude_behaviour, hang_up, active_listening,
        improvement_areas, positive_comments, bad_comments, feedback,
        hold_unhold, coaching_status, overall_score
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(),
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *`,
      [
        agent_name, coordinator, qa_name, subject, formatted_phone, ticket_id,
        waiting_time, call_duration, email_address,
        greeting_script, customer_info, faq_alignment, tagging_topic,
        communication_problem_solving, tone_of_voice, ending,
        rude_behaviour, hang_up, active_listening,
        improvement_areas, positive_comments, bad_comments, feedback,
        hold_unhold, coaching_status, overall_score
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Evaluation created successfully',
      evaluation: result.rows[0]
    });

  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating evaluation',
      error: error.message
    });
  }
};

// Get all evaluations
const getAllEvaluations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM evaluations ORDER BY evaluation_date DESC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      evaluations: result.rows
    });

  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching evaluations',
      error: error.message
    });
  }
};

// Get evaluations by agent
const getEvaluationsByAgent = async (req, res) => {
  try {
    const { agent_name } = req.params;

    const result = await pool.query(
      'SELECT * FROM evaluations WHERE agent_name = $1 ORDER BY evaluation_date DESC',
      [agent_name]
    );

    res.json({
      success: true,
      count: result.rows.length,
      evaluations: result.rows
    });

  } catch (error) {
    console.error('Get agent evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agent evaluations',
      error: error.message
    });
  }
};

// Get evaluations by QA
const getEvaluationsByQA = async (req, res) => {
  try {
    const { qa_name } = req.params;

    const result = await pool.query(
      'SELECT * FROM evaluations WHERE qa_name = $1 ORDER BY evaluation_date DESC',
      [qa_name]
    );

    res.json({
      success: true,
      count: result.rows.length,
      evaluations: result.rows
    });

  } catch (error) {
    console.error('Get QA evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching QA evaluations',
      error: error.message
    });
  }
};

// Get pending coaching evaluations
const getPendingCoaching = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM evaluations 
       WHERE coaching_status = 'Pending' 
       ORDER BY evaluation_date DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      evaluations: result.rows
    });

  } catch (error) {
    console.error('Get pending coaching error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending coaching',
      error: error.message
    });
  }
};

// Update coaching status
const updateCoachingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { coaching_status } = req.body;

    if (!coaching_status || !['Done', 'Pending'].includes(coaching_status)) {
      return res.status(400).json({
        success: false,
        message: 'Coaching status must be "Done" or "Pending"'
      });
    }

    const result = await pool.query(
      'UPDATE evaluations SET coaching_status = $1 WHERE id = $2 RETURNING *',
      [coaching_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.json({
      success: true,
      message: 'Coaching status updated successfully',
      evaluation: result.rows[0]
    });

  } catch (error) {
    console.error('Update coaching status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating coaching status',
      error: error.message
    });
  }
};

// Get evaluation by ID
const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM evaluations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.json({
      success: true,
      evaluation: result.rows[0]
    });

  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching evaluation',
      error: error.message
    });
  }
};

module.exports = {
  createEvaluation,
  getAllEvaluations,
  getEvaluationsByAgent,
  getEvaluationsByQA,
  getPendingCoaching,
  updateCoachingStatus,
  getEvaluationById
};