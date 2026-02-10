const pool = require('../utils/db');

// Create VIVA template
const createVivaTemplate = async (req, res) => {
  try {
    const { viva_name, questions } = req.body;

    // Validate required fields
    if (!viva_name || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'VIVA name and questions array are required'
      });
    }

    // Validate questions count (3-5 questions)
    if (questions.length < 3 || questions.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'VIVA must have between 3 and 5 questions'
      });
    }

    // Validate each question is not empty
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i] || questions[i].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} cannot be empty`
        });
      }
    }

    const total_questions = questions.length;

    // Insert VIVA template
    const result = await pool.query(
      `INSERT INTO viva_templates (viva_name, questions, total_questions) 
       VALUES ($1, $2, $3) RETURNING *`,
      [viva_name, JSON.stringify(questions), total_questions]
    );

    res.status(201).json({
      success: true,
      message: 'VIVA template created successfully',
      viva_template: result.rows[0]
    });

  } catch (error) {
    console.error('Create VIVA template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating VIVA template',
      error: error.message
    });
  }
};

// Get all VIVA templates
const getAllVivaTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM viva_templates ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      viva_templates: result.rows
    });

  } catch (error) {
    console.error('Get VIVA templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching VIVA templates',
      error: error.message
    });
  }
};

// Get VIVA template by ID
const getVivaTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM viva_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'VIVA template not found'
      });
    }

    res.json({
      success: true,
      viva_template: result.rows[0]
    });

  } catch (error) {
    console.error('Get VIVA template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching VIVA template',
      error: error.message
    });
  }
};

// Update VIVA template
const updateVivaTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { viva_name, questions } = req.body;

    // Validate questions if provided
    if (questions) {
      if (!Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: 'Questions must be an array'
        });
      }

      if (questions.length < 3 || questions.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'VIVA must have between 3 and 5 questions'
        });
      }

      for (let i = 0; i < questions.length; i++) {
        if (!questions[i] || questions[i].trim() === '') {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1} cannot be empty`
          });
        }
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (viva_name) {
      updates.push(`viva_name = $${paramCount++}`);
      values.push(viva_name);
    }

    if (questions) {
      updates.push(`questions = $${paramCount++}`);
      values.push(JSON.stringify(questions));
      updates.push(`total_questions = $${paramCount++}`);
      values.push(questions.length);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    const query = `UPDATE viva_templates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'VIVA template not found'
      });
    }

    res.json({
      success: true,
      message: 'VIVA template updated successfully',
      viva_template: result.rows[0]
    });

  } catch (error) {
    console.error('Update VIVA template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating VIVA template',
      error: error.message
    });
  }
};

// Delete VIVA template
const deleteVivaTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM viva_templates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'VIVA template not found'
      });
    }

    res.json({
      success: true,
      message: 'VIVA template deleted successfully',
      viva_template: result.rows[0]
    });

  } catch (error) {
    console.error('Delete VIVA template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting VIVA template',
      error: error.message
    });
  }
};

// Conduct VIVA (create VIVA result)
const conductViva = async (req, res) => {
  try {
    const { viva_template_id, agent_name, answers, comments } = req.body;

    // Validate required fields
    if (!viva_template_id || !agent_name || !answers) {
      return res.status(400).json({
        success: false,
        message: 'VIVA template ID, agent name, and answers are required'
      });
    }

    // Get VIVA template
    const templateResult = await pool.query(
      'SELECT * FROM viva_templates WHERE id = $1',
      [viva_template_id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'VIVA template not found'
      });
    }

    const template = templateResult.rows[0];
    const viva_name = template.viva_name;
    const total_questions = template.total_questions;

    // Validate answers object
    if (typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an object with question numbers as keys'
      });
    }

    // Validate all questions are answered
    const answerKeys = Object.keys(answers);
    if (answerKeys.length !== total_questions) {
      return res.status(400).json({
        success: false,
        message: `All ${total_questions} questions must be answered`
      });
    }

    // Validate each answer is either "correct" or "incorrect"
    let correct_count = 0;
    for (let i = 1; i <= total_questions; i++) {
      const answer = answers[i.toString()];
      if (!answer || !['correct', 'incorrect'].includes(answer.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Question ${i} answer must be "correct" or "incorrect"`
        });
      }
      if (answer.toLowerCase() === 'correct') {
        correct_count++;
      }
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

    // Calculate score and percentage
    const score = correct_count;
    const avg_percentage = Math.round((correct_count / total_questions) * 100);

    // Insert VIVA result
    const result = await pool.query(
      `INSERT INTO viva_results (
        viva_template_id, viva_name, agent_name, tc_name, 
        answers, score, total_questions, avg_percentage, comments, date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
      RETURNING *`,
      [viva_template_id, viva_name, agent_name, tc_name, 
       JSON.stringify(answers), score, total_questions, avg_percentage, comments || null]
    );

    res.status(201).json({
      success: true,
      message: 'VIVA conducted successfully',
      viva_result: result.rows[0]
    });

  } catch (error) {
    console.error('Conduct VIVA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error conducting VIVA',
      error: error.message
    });
  }
};

// Get all VIVA results
const getAllVivaResults = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM viva_results ORDER BY date DESC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      viva_results: result.rows
    });

  } catch (error) {
    console.error('Get VIVA results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching VIVA results',
      error: error.message
    });
  }
};

// Get VIVA results by agent
const getVivaResultsByAgent = async (req, res) => {
  try {
    const { agent_name } = req.params;

    const result = await pool.query(
      'SELECT * FROM viva_results WHERE agent_name = $1 ORDER BY date DESC',
      [agent_name]
    );

    res.json({
      success: true,
      count: result.rows.length,
      viva_results: result.rows
    });

  } catch (error) {
    console.error('Get agent VIVA results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching agent VIVA results',
      error: error.message
    });
  }
};

// Get VIVA result by ID
const getVivaResultById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM viva_results WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'VIVA result not found'
      });
    }

    res.json({
      success: true,
      viva_result: result.rows[0]
    });

  } catch (error) {
    console.error('Get VIVA result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching VIVA result',
      error: error.message
    });
  }
};

module.exports = {
  createVivaTemplate,
  getAllVivaTemplates,
  getVivaTemplateById,
  updateVivaTemplate,
  deleteVivaTemplate,
  conductViva,
  getAllVivaResults,
  getVivaResultsByAgent,
  getVivaResultById
};