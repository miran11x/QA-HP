const pool = require('../utils/db');
const xlsx = require('xlsx');

// Import Queue Metrics Excel file
const importQueueMetrics = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload an Excel file.'
      });
    }

    // Read Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty'
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of data) {
      try {
        // Extract data from row (map Excel columns to database columns)
        const call_date = row['Date'] || null;
        const caller = row['Caller'] || null;
        const queue = row['Queue'] || null;
        const wait = row['Wait'] || null;
        const duration = row['Duration'] || null;
        const position = row['Pos.'] || null;
        const disconnection = row['Disconnection'] || null;
        const transferred_to = row['Transferred to'] || null;
        const handled_by = row['Handled by'] || null;
        const attempts = row['Attempts'] || null;
        const code = row['Code'] || null;
        const stints = row['Stints'] || null;
        const srv = row['Srv'] || null;
        const call_unique_id = row['Call Unique ID'] || null;
        const moh_events = row['MOH events'] || null;
        const moh_duration = row['MOH duration'] || null;
        const ivr_duration = row['IVR duration'] || null;
        const ivr_path = row['IVR path'] || null;
        const dnis = row['DNIS'] || null;
        const ivr = row['IVR'] || null;
        const tag = row['Tag'] || null;
        const feat = row['Feat'] || null;
        const vars = row['Vars'] || null;
        const feature_codes = row['Feature Codes'] || ''; // Keep even if blank
        const variables = row['Variables'] || null;
        const url = row['URL'] || null;

        // Skip rows without essential data
        if (!handled_by || !caller) {
          skipped++;
          continue;
        }

        // Insert into database
        await pool.query(
          `INSERT INTO imported_calls (
            call_date, caller, queue, wait, duration, position, disconnection,
            transferred_to, handled_by, attempts, code, stints, srv,
            call_unique_id, moh_events, moh_duration, ivr_duration, ivr_path,
            dnis, ivr, tag, feat, vars, feature_codes, variables, url, evaluated
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, false
          )`,
          [
            call_date, caller, queue, wait, duration, position, disconnection,
            transferred_to, handled_by, attempts, code, stints, srv,
            call_unique_id, moh_events, moh_duration, ivr_duration, ivr_path,
            dnis, ivr, tag, feat, vars, feature_codes, variables, url
          ]
        );

        imported++;

      } catch (error) {
        errors.push({
          row: row,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Queue Metrics import completed',
      imported,
      skipped,
      errors: errors.length,
      error_details: errors.length > 0 ? errors.slice(0, 10) : [] // Show first 10 errors
    });

  } catch (error) {
    console.error('Import Queue Metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error importing Queue Metrics',
      error: error.message
    });
  }
};

// Get all imported calls (for selection)
const getAllImportedCalls = async (req, res) => {
  try {
    const { agent_name, evaluated, limit = 100 } = req.query;

    let query = `SELECT 
      id, call_date, caller as phone_number, handled_by as agent_name, 
      wait as waiting_time, duration as call_duration, feature_codes as subject
      FROM imported_calls WHERE 1=1`;
    
    const params = [];
    let paramCount = 1;

    // Filter by agent name
    if (agent_name) {
      query += ` AND handled_by ILIKE $${paramCount++}`;
      params.push(`%${agent_name}%`);
    }

    // Filter by evaluated status
    if (evaluated !== undefined) {
      query += ` AND evaluated = $${paramCount++}`;
      params.push(evaluated === 'true');
    }

    query += ` ORDER BY call_date DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      calls: result.rows
    });

  } catch (error) {
    console.error('Get imported calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching imported calls',
      error: error.message
    });
  }
};

// Get imported call by ID
const getImportedCallById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM imported_calls WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.json({
      success: true,
      call: result.rows[0]
    });

  } catch (error) {
    console.error('Get imported call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching call',
      error: error.message
    });
  }
};

// Mark call as evaluated
const markCallAsEvaluated = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE imported_calls SET evaluated = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.json({
      success: true,
      message: 'Call marked as evaluated',
      call: result.rows[0]
    });

  } catch (error) {
    console.error('Mark call as evaluated error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking call as evaluated',
      error: error.message
    });
  }
};

// Delete all imported calls (clear data)
const clearAllImportedCalls = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM imported_calls RETURNING COUNT(*)');

    res.json({
      success: true,
      message: 'All imported calls cleared successfully'
    });

  } catch (error) {
    console.error('Clear imported calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing imported calls',
      error: error.message
    });
  }
};

module.exports = {
  importQueueMetrics,
  getAllImportedCalls,
  getImportedCallById,
  markCallAsEvaluated,
  clearAllImportedCalls
};