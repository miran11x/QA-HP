const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'runaki_qa.db');
const db = new sqlite3.Database(dbPath);

const testUsers = [
  // OWNER
  { name: 'Miran Mohammed', email: 'miran.mohammed@runaki.com', password: 'owner123', role: 'Owner' },
  
  // QA OFFICERS (2)
  { name: 'Sarah Johnson', email: 'sarah.qa@runaki.com', password: 'qa123', role: 'QA Officer' },
  { name: 'Ahmed Hassan', email: 'ahmed.qa@runaki.com', password: 'qa123', role: 'QA Officer' },
  
  // TRAINER (1)
  { name: 'John Smith', email: 'john.trainer@runaki.com', password: 'trainer123', role: 'Trainer' },
  
  // SUPERVISOR (1)
  { name: 'Lisa Anderson', email: 'lisa.supervisor@runaki.com', password: 'supervisor123', role: 'Supervisor' },
  
  // AGENTS (75)
  { name: 'Agent 1', email: 'agent1@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 2', email: 'agent2@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 3', email: 'agent3@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 4', email: 'agent4@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 5', email: 'agent5@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 6', email: 'agent6@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 7', email: 'agent7@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 8', email: 'agent8@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 9', email: 'agent9@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 10', email: 'agent10@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 11', email: 'agent11@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 12', email: 'agent12@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 13', email: 'agent13@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 14', email: 'agent14@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 15', email: 'agent15@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 16', email: 'agent16@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 17', email: 'agent17@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 18', email: 'agent18@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 19', email: 'agent19@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 20', email: 'agent20@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 21', email: 'agent21@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 22', email: 'agent22@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 23', email: 'agent23@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 24', email: 'agent24@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 25', email: 'agent25@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 26', email: 'agent26@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 27', email: 'agent27@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 28', email: 'agent28@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 29', email: 'agent29@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 30', email: 'agent30@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 31', email: 'agent31@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 32', email: 'agent32@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 33', email: 'agent33@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 34', email: 'agent34@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 35', email: 'agent35@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 36', email: 'agent36@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 37', email: 'agent37@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 38', email: 'agent38@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 39', email: 'agent39@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 40', email: 'agent40@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 41', email: 'agent41@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 42', email: 'agent42@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 43', email: 'agent43@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 44', email: 'agent44@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 45', email: 'agent45@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 46', email: 'agent46@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 47', email: 'agent47@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 48', email: 'agent48@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 49', email: 'agent49@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 50', email: 'agent50@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 51', email: 'agent51@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 52', email: 'agent52@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 53', email: 'agent53@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 54', email: 'agent54@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 55', email: 'agent55@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 56', email: 'agent56@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 57', email: 'agent57@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 58', email: 'agent58@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 59', email: 'agent59@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 60', email: 'agent60@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 61', email: 'agent61@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 62', email: 'agent62@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 63', email: 'agent63@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 64', email: 'agent64@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 65', email: 'agent65@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 66', email: 'agent66@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 67', email: 'agent67@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 68', email: 'agent68@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 69', email: 'agent69@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 70', email: 'agent70@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 71', email: 'agent71@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 72', email: 'agent72@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 73', email: 'agent73@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 74', email: 'agent74@runaki.com', password: 'agent123', role: 'Agent' },
  { name: 'Agent 75', email: 'agent75@runaki.com', password: 'agent123', role: 'Agent' }
];

async function restoreTestUsers() {
  console.log('🔄 Restoring test users...\n');

  // Delete all current users
  console.log('🗑️  Deleting current users...');
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM users', (err) => {
      if (err) reject(err);
      else {
        console.log('✅ All users deleted!\n');
        resolve();
      }
    });
  });

  // Insert test users
  console.log('📥 Inserting test users...');
  let inserted = 0;

  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
        [user.name, user.email, hashedPassword, user.role],
        (err) => {
          if (err) {
            console.log(`❌ Failed: ${user.name}`);
            reject(err);
          } else {
            inserted++;
            resolve();
          }
        }
      );
    });
  }

  console.log(`\n✅ ${inserted} test users restored!\n`);

  // Show summary
  db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role', (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('📊 USER COUNT:');
      rows.forEach(row => {
        console.log(`   ${row.role}: ${row.count}`);
      });
      console.log('\n🎉 ROLLBACK COMPLETE! 🎉\n');
      console.log('Login with:');
      console.log('Email: miran.mohammed@runaki.com');
      console.log('Password: owner123\n');
    }
    db.close();
  });
}

restoreTestUsers().catch(err => {
  console.error('❌ Restore failed:', err);
  db.close();
});