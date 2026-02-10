const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./runaki_qa.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      }
    });

    // Evaluations table
    db.run(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        agent_phone TEXT,
        qa_name TEXT NOT NULL,
        evaluation_date DATE NOT NULL,
        opening INTEGER DEFAULT 0,
        probing INTEGER DEFAULT 0,
        product_knowledge INTEGER DEFAULT 0,
        objection_handling INTEGER DEFAULT 0,
        closing INTEGER DEFAULT 0,
        communication INTEGER DEFAULT 0,
        empathy INTEGER DEFAULT 0,
        professionalism INTEGER DEFAULT 0,
        hold_procedure INTEGER DEFAULT 0,
        call_control INTEGER DEFAULT 0,
        overall_score REAL,
        comments TEXT,
        coaching_status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Spot checks table
    db.run(`
      CREATE TABLE IF NOT EXISTS spot_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        check_date DATE NOT NULL,
        type TEXT NOT NULL,
        result TEXT NOT NULL,
        percentage INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audits table
    db.run(`
      CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        audit_date DATE NOT NULL,
        greeting_correct BOOLEAN NOT NULL,
        farewell_correct BOOLEAN NOT NULL,
        percentage INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // VIVA templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS viva_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        questions TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // VIVA results table
    db.run(`
      CREATE TABLE IF NOT EXISTS viva_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        template_title TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        conducted_date DATE NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES viva_templates(id)
      )
    `);

    // Sessions table
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        session_date DATE NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Session attendance table
    db.run(`
      CREATE TABLE IF NOT EXISTS session_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Check if users exist, if not create default users
    db.get('SELECT COUNT(*) as count FROM users', async (err, result) => {
      if (err) {
        console.error('Error checking users:', err);
        return;
      }

      console.log(`Found ${result.count} users in database`);

      if (result.count === 0) {
        console.log('Creating default users...');
        
        const hashedPassword = await bcrypt.hash('Owner001', 10);
        
        // Create owner
        db.run(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Miran Mohammed', 'miran.mohammed111@gmail.com', hashedPassword, 'owner'],
          (err) => {
            if (err) {
              console.error('Error creating owner:', err);
            } else {
              console.log('✅ Owner account created');
            }
          }
        );

        // Create 75 agents
        const agentPassword = await bcrypt.hash('Agent001', 10);
        const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
        
        for (let i = 1; i <= 75; i++) {
          const agentNum = String(i).padStart(3, '0');
          stmt.run(
            `Agent ${agentNum}`,
            `agent${agentNum}@runaki.com`,
            agentPassword,
            'agent'
          );
        }
        
        stmt.finalize(() => {
          console.log('✅ 75 agents created');
          
          // Count total users after creation
          db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
            if (!err) {
              console.log(`✅ Total users in database: ${result.count}`);
            }
          });
        });

        // Create sample QA users
        const qaPassword = await bcrypt.hash('QA001', 10);
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Sarah Johnson', 'sarah.qa@runaki.com', qaPassword, 'qa']);
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Ahmed Ali', 'ahmed.qa@runaki.com', qaPassword, 'qa']);
        
        // Create sample trainer
        const trainerPassword = await bcrypt.hash('Trainer001', 10);
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Linda Smith', 'linda.trainer@runaki.com', trainerPassword, 'trainer']);
        
        // Create sample supervisor
        const supervisorPassword = await bcrypt.hash('Super001', 10);
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['John Davis', 'john.supervisor@runaki.com', supervisorPassword, 'supervisor']);
      }
    });

    console.log('Database initialized successfully');
  });
}

module.exports = db;