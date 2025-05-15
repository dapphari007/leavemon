/**
 * Quick Database Management Tool
 * 
 * A simplified interface for common database operations.
 * 
 * Usage:
 *   node db-quick.js <command>
 * 
 * Commands:
 *   check     - Check database status and fixes
 *   connect   - Test database connection
 *   fix       - Fix database issues
 *   reset     - Reset database (drop and recreate)
 *   roles     - Show all roles
 *   help      - Show this help message
 */

const { execSync } = require('child_process');

// Get command line arguments
const command = process.argv[2];

// Show help if no command provided
if (!command || command === 'help') {
  showHelp();
  process.exit(0);
}

// Process the command
try {
  switch (command) {
    case 'check':
      console.log('Checking database status...');
      execSync('node database-tools.js check', { stdio: 'inherit' });
      break;
      
    case 'connect':
      console.log('Testing database connection...');
      execSync('node database-tools.js test-connection', { stdio: 'inherit' });
      break;
      
    case 'fix':
      console.log('Fixing database issues...');
      execSync('node database-tools.js fix', { stdio: 'inherit' });
      break;
      
    case 'reset':
      // Ask for confirmation before resetting
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('⚠️ WARNING: This will DELETE all data in the database. Are you sure? (yes/no): ', answer => {
        readline.close();
        if (answer.toLowerCase() === 'yes') {
          console.log('Resetting database...');
          execSync('node database-tools.js reset', { stdio: 'inherit' });
        } else {
          console.log('Database reset cancelled.');
        }
      });
      break;
      
    case 'roles':
      console.log('Showing all roles...');
      execSync('node database-tools.js roles show', { stdio: 'inherit' });
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
} catch (error) {
  console.error(`Error executing command: ${error.message}`);
  process.exit(1);
}

// Help function
function showHelp() {
  console.log(`
Quick Database Management Tool

Usage:
  node db-quick.js <command>

Commands:
  check     - Check database status and fixes
  connect   - Test database connection
  fix       - Fix database issues
  reset     - Reset database (drop and recreate)
  roles     - Show all roles
  help      - Show this help message

Examples:
  node db-quick.js check
  node db-quick.js connect
  node db-quick.js fix
  `);
}