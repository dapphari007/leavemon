/**
 * Consolidated Database Management Tools
 * 
 * This script combines functionality from multiple database management scripts:
 * - check-database-fixes.js: Verify database fixes
 * - check-typeorm-connection.js: Test database connection
 * - fix-database-and-migrations.js: Fix database schema and migration issues
 * - fix-migrations.js: Fix migration issues
 * - manage-roles-cli.js: Manage roles from command line
 * - reset-database.js: Reset the database
 * - sync-essential-data.js: Sync essential data
 * - test-initialization.js: Test system initialization
 * 
 * Usage:
 *   node database-tools.js <command> [options]
 * 
 * Commands:
 *   check           Check if database fixes are working properly
 *   test-connection Test database connection and list sample tables
 *   fix             Fix database schema and migration issues
 *   fix-migrations  Fix migration issues and run migrations in correct order
 *   roles           Manage roles (show, create)
 *   reset           Reset the database (drop and recreate)
 *   sync            Synchronize essential data
 *   test-init       Test system initialization
 *   help            Show this help message
 * 
 * Examples:
 *   node database-tools.js check
 *   node database-tools.js test-connection
 *   node database-tools.js fix
 *   node database-tools.js roles show
 *   node database-tools.js roles create "Project Manager" "Manages projects" '{"projects":{"create":true}}'
 *   node database-tools.js reset
 */

// Import required modules
const { Client } = require('pg');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Database connection info
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'leave_management',
};

// Main function to process commands
async function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'check':
        await checkDatabaseFixes();
        break;
      case 'test-connection':
        await testDatabaseConnection();
        break;
      case 'fix':
        await fixDatabaseAndMigrations();
        break;
      case 'fix-migrations':
        await fixMigrations();
        break;
      case 'roles':
        await manageRoles(args.slice(1));
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'sync':
        await syncEssentialData();
        break;
      case 'test-init':
        await testInitialization();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error executing command '${command}':`, error);
    process.exit(1);
  }
}

// Show help message
function showHelp() {
  console.log(`
Consolidated Database Management Tools

Usage:
  node database-tools.js <command> [options]

Commands:
  check           Check if database fixes are working properly
  test-connection Test database connection and list sample tables
  fix             Fix database schema and migration issues
  fix-migrations  Fix migration issues and run migrations in correct order
  roles           Manage roles (show, create)
  reset           Reset the database (drop and recreate)
  sync            Synchronize essential data
  test-init       Test system initialization
  help            Show this help message

Examples:
  node database-tools.js check
  node database-tools.js test-connection
  node database-tools.js fix
  node database-tools.js roles show
  node database-tools.js roles create "Project Manager" "Manages projects" '{"projects":{"create":true}}'
  node database-tools.js reset
  `);
}

//=============================================================================
// CHECK DATABASE FIXES
//=============================================================================

/**
 * Check if database fixes are working properly
 */
async function checkDatabaseFixes() {
  const dbClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
  });

  try {
    console.log("Starting database fix verification...");
    
    // Connect to the database
    await dbClient.connect();
    console.log("Connected to database");
    
    // Check if roles table exists
    const rolesTableExists = await dbClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      )
    `);
    
    if (!rolesTableExists.rows[0].exists) {
      console.error("❌ Roles table does not exist!");
      return;
    }
    
    console.log("✅ Roles table exists");
    
    // Check if all roles have timestamps set
    const missingTimestamps = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM roles
      WHERE "createdAt" IS NULL OR "updatedAt" IS NULL
    `);
    
    const count = parseInt(missingTimestamps.rows[0].count);
    
    if (count > 0) {
      console.error(`❌ Found ${count} roles with missing timestamps!`);
    } else {
      console.log("✅ All roles have timestamps set correctly");
    }
    
    // Check if foreign key constraints exist
    const foreignKeys = await dbClient.query(`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_name IN ('users', 'roles', 'departments', 'positions')
    `);
    
    console.log("\nForeign key constraints:");
    foreignKeys.rows.forEach(row => {
      console.log(`✅ ${row.constraint_name} on table ${row.table_name}`);
    });
    
    // Check if hrId and teamLeadId columns exist in users table
    const userColumns = await dbClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('hrId', 'teamLeadId', 'roleId', 'departmentId', 'positionId')
    `);
    
    console.log("\nUser table columns:");
    const columnNames = userColumns.rows.map(row => row.column_name);
    
    ['hrId', 'teamLeadId', 'roleId', 'departmentId', 'positionId'].forEach(column => {
      if (columnNames.includes(column)) {
        console.log(`✅ ${column} column exists`);
      } else {
        console.error(`❌ ${column} column is missing!`);
      }
    });
    
    // Check if migrations are marked as completed
    const migrations = await dbClient.query(`
      SELECT name
      FROM migrations
      WHERE name LIKE '%AddRolesDepartmentsPositionsPages%'
      OR name LIKE '%AddHrAndTeamLeadToUsers%'
    `);
    
    console.log("\nMigration status:");
    if (migrations.rows.length > 0) {
      migrations.rows.forEach(row => {
        console.log(`✅ Migration ${row.name} is marked as completed`);
      });
    } else {
      console.error("❌ Key migrations are not marked as completed!");
    }
    
    console.log("\n✅ Database fix verification completed");
    
  } catch (error) {
    console.error("Error during database fix verification:", error);
  } finally {
    // Close connection
    await dbClient.end();
    console.log("Database connection closed");
  }
}

//=============================================================================
// FIX DATABASE AND MIGRATIONS
//=============================================================================

/**
 * Fix database schema and migration issues
 */
async function fixDatabaseAndMigrations() {
  try {
    console.log(`Starting database and migration fix process for '${dbConfig.database}'...`);
    
    // Connect to postgres database for admin operations
    const adminClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: 'postgres', // Connect to default postgres database
    });
    
    await adminClient.connect();
    console.log("Connected to postgres database");
    
    // Check if our database exists
    const checkResult = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );
    
    const dbExists = checkResult.rows.length > 0;
    
    if (!dbExists) {
      // Create the database if it doesn't exist
      console.log(`Creating database '${dbConfig.database}'...`);
      await adminClient.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' created successfully`);
    } else {
      console.log(`Database '${dbConfig.database}' already exists`);
    }
    
    // Close admin connection
    await adminClient.end();
    console.log("Admin database connection closed");
    
    // Now connect to the database to fix schema
    console.log(`Connecting to '${dbConfig.database}' to fix schema...`);
    const dbClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    });
    
    await dbClient.connect();
    
    // Create extension for UUID generation if it doesn't exist
    console.log("Ensuring UUID extension exists...");
    await dbClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create migrations table if it doesn't exist
    console.log("Ensuring migrations table exists...");
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" character varying NOT NULL,
        "name" character varying NOT NULL
      )
    `);
    
    // Create enum types if they don't exist
    console.log("Creating enum types if they don't exist...");
    await dbClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('super_admin', 'hr', 'manager', 'team_lead', 'employee');
        END IF;
      END
      $$;
    `);

    await dbClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_level_enum') THEN
          CREATE TYPE "user_level_enum" AS ENUM ('1', '2', '3', '4');
        END IF;
      END
      $$;
    `);

    await dbClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
          CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'other');
        END IF;
      END
      $$;
    `);

    await dbClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_status_enum') THEN
          CREATE TYPE "leave_request_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'partially_approved');
        END IF;
      END
      $$;
    `);

    await dbClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_type_enum') THEN
          CREATE TYPE "leave_request_type_enum" AS ENUM ('full_day', 'first_half', 'second_half');
        END IF;
      END
      $$;
    `);
    
    // Create roles table with UUID primary key
    console.log("Ensuring roles table exists with correct schema...");
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "permissions" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);
    
    // Create departments table
    console.log("Ensuring departments table exists...");
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "managerId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_departments_name" UNIQUE ("name"),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id")
      )
    `);
    
    // Create positions table
    console.log("Ensuring positions table exists...");
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS "positions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "departmentId" uuid,
        "level" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_positions" PRIMARY KEY ("id")
      )
    `);
    
    // Create users table if it doesn't exist
    console.log("Ensuring users table exists with all required columns...");
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "phoneNumber" character varying,
        "address" character varying,
        "role" "user_role_enum" NOT NULL DEFAULT 'employee',
        "level" "user_level_enum" NOT NULL DEFAULT '1',
        "gender" "gender_enum",
        "managerId" uuid,
        "hrId" uuid,
        "teamLeadId" uuid,
        "department" character varying(100),
        "position" character varying(100),
        "roleId" uuid,
        "departmentId" uuid,
        "positionId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    
    // Add columns to users table if they don't exist
    console.log("Ensuring all required columns exist in users table...");
    await dbClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'hrId') THEN
          ALTER TABLE "users" ADD COLUMN "hrId" uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'teamLeadId') THEN
          ALTER TABLE "users" ADD COLUMN "teamLeadId" uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'roleId') THEN
          ALTER TABLE "users" ADD COLUMN "roleId" uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'departmentId') THEN
          ALTER TABLE "users" ADD COLUMN "departmentId" uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'positionId') THEN
          ALTER TABLE "users" ADD COLUMN "positionId" uuid;
        END IF;
      END
      $$;
    `);
    
    // Add foreign key constraints if they don't exist
    console.log("Adding foreign key constraints...");
    await dbClient.query(`
      DO $$
      BEGIN
        -- FK_users_roles
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_roles' 
          AND table_name = 'users'
        ) THEN
          BEGIN
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_roles" 
            FOREIGN KEY ("roleId") 
            REFERENCES "roles"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_users_roles constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_users_departments
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_departments' 
          AND table_name = 'users'
        ) THEN
          BEGIN
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_departments" 
            FOREIGN KEY ("departmentId") 
            REFERENCES "departments"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_users_departments constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_users_positions
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_positions' 
          AND table_name = 'users'
        ) THEN
          BEGIN
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_positions" 
            FOREIGN KEY ("positionId") 
            REFERENCES "positions"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_users_positions constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_users_manager
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_manager' 
          AND table_name = 'users'
        ) THEN
          BEGIN
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_manager" 
            FOREIGN KEY ("managerId") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_users_manager constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_users_hr
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_hr' 
          AND table_name = 'users'
        ) THEN
          BEGIN
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_hr" 
            FOREIGN KEY ("hrId") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_users_hr constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_users_teamLead
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_teamLead' 
          AND table_name = 'users'
        ) THEN
          BEGIN
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_teamLead" 
            FOREIGN KEY ("teamLeadId") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_users_teamLead constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_positions_departments
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_positions_departments' 
          AND table_name = 'positions'
        ) THEN
          BEGIN
            ALTER TABLE "positions" 
            ADD CONSTRAINT "FK_positions_departments" 
            FOREIGN KEY ("departmentId") 
            REFERENCES "departments"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_positions_departments constraint: %', SQLERRM;
          END;
        END IF;
        
        -- FK_departments_users
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_departments_users' 
          AND table_name = 'departments'
        ) THEN
          BEGIN
            ALTER TABLE "departments" 
            ADD CONSTRAINT "FK_departments_users" 
            FOREIGN KEY ("managerId") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL;
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Could not add FK_departments_users constraint: %', SQLERRM;
          END;
        END IF;
      END
      $$;
    `);
    
    // Fix timestamps in roles table
    console.log("Fixing timestamps in roles table...");
    await dbClient.query(`
      UPDATE roles
      SET "createdAt" = now(), "updatedAt" = now()
      WHERE "createdAt" IS NULL OR "updatedAt" IS NULL
    `);
    
    // Mark migrations as completed
    console.log("Marking essential migrations as completed...");
    
    // Check if migrations table exists
    const migrationsExist = await dbClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);
    
    if (migrationsExist.rows[0].exists) {
      // Check if the migrations are already marked as completed
      const migrationCheck = await dbClient.query(`
        SELECT COUNT(*) as count
        FROM migrations
        WHERE name LIKE '%AddRolesDepartmentsPositionsPages%'
        OR name LIKE '%AddHrAndTeamLeadToUsers%'
      `);
      
      if (parseInt(migrationCheck.rows[0].count) === 0) {
        // Add the migration records
        await dbClient.query(`
          INSERT INTO migrations (timestamp, name)
          VALUES 
            ('1621500000000', 'AddRolesDepartmentsPositionsPages1621500000000'),
            ('1621600000000', 'AddHrAndTeamLeadToUsers1621600000000')
          ON CONFLICT DO NOTHING
        `);
        console.log("Added missing migration records");
      } else {
        console.log("Migration records already exist");
      }
    }
    
    // Close connection
    await dbClient.end();
    console.log("Database connection closed");
    
    console.log("\n✅ Database and migration fixes completed successfully!");
    
  } catch (error) {
    console.error("Error during database and migration fixes:", error);
    throw error;
  }
}

//=============================================================================
// FIX MIGRATIONS
//=============================================================================

/**
 * Fix migration issues and run migrations in the correct order
 */
async function fixMigrations() {
  try {
    console.log('Starting migration fix process...');
    
    // Change to the server directory
    process.chdir(path.join(__dirname, 'server'));
    
    // Run the migration fix script
    console.log('Running migration fix script...');
    execSync('npx ts-node src/scripts/fixMigrationOrder.ts', { stdio: 'inherit' });
    
    // Run the positions table fix script
    console.log('Running positions table fix script...');
    execSync('npx ts-node src/scripts/fixPositionsTable.ts', { stdio: 'inherit' });
    
    // Run the positions data fix script
    console.log('Running positions data fix script...');
    execSync('npx ts-node src/scripts/fixPositionsData.ts', { stdio: 'inherit' });
    
    console.log('Migration fix completed successfully!');
    console.log('You can now start the server normally with: npm run dev');
  } catch (error) {
    console.error('Error fixing migrations:', error.message);
    throw error;
  }
}

//=============================================================================
// MANAGE ROLES
//=============================================================================

/**
 * Manage roles from the command line
 */
async function manageRoles(roleArgs) {
  try {
    // Import required modules
    require('ts-node/register');
    const { AppDataSource, initializeDatabase } = require('./server/src/config/database');
    const { Role } = require('./server/src/models');
    
    if (roleArgs.length === 0 || roleArgs[0] === 'help') {
      console.log("Roles management commands:");
      console.log("  node database-tools.js roles show                    # Show all roles");
      console.log("  node database-tools.js roles create NAME DESC PERMS  # Create a role");
      console.log("Example:");
      console.log('  node database-tools.js roles create "Project Manager" "Manages projects" \'{"projects":{"create":true,"read":true,"update":true,"delete":false}}\'');
      return;
    }
    
    const roleCommand = roleArgs[0];
    
    if (roleCommand === 'show') {
      // Show all roles
      await showRoles();
    } else if (roleCommand === 'create' && roleArgs.length >= 3) {
      // Create a role
      const roleName = roleArgs[1];
      const description = roleArgs[2];
      
      // Parse permissions if provided
      let permissions = null;
      if (roleArgs.length >= 4) {
        try {
          permissions = JSON.parse(roleArgs[3]);
        } catch (e) {
          console.error("Error parsing permissions JSON:", e);
          throw e;
        }
      }
      
      await createCustomRole(roleName, description, permissions);
    } else {
      console.error("Invalid role command or missing arguments.");
      console.log("Use 'node database-tools.js roles help' for usage information.");
    }
    
    // Function to show all roles
    async function showRoles() {
      try {
        // Initialize database if not already connected
        if (!AppDataSource.isInitialized) {
          await initializeDatabase();
          console.log("Database connected successfully");
        }

        const roleRepository = AppDataSource.getRepository(Role);
        
        // Get all roles
        const roles = await roleRepository.find({
          order: {
            isSystem: "DESC",
            name: "ASC"
          }
        });

        if (roles.length === 0) {
          console.log("No roles found in the database.");
        } else {
          console.log("\n=== ROLES IN DATABASE ===");
          console.log("Total roles:", roles.length);
          console.log("------------------------");
          
          roles.forEach((role, index) => {
            console.log(`${index + 1}. ${role.name} ${role.isSystem ? '(System)' : ''}`);
            console.log(`   ID: ${role.id}`);
            console.log(`   Description: ${role.description || 'N/A'}`);
            console.log(`   Active: ${role.isActive ? 'Yes' : 'No'}`);
            
            // Parse and display permissions in a readable format
            if (role.permissions) {
              try {
                const permissions = JSON.parse(role.permissions);
                console.log(`   Permissions: ${JSON.stringify(permissions, null, 2).substring(0, 100)}...`);
              } catch (e) {
                console.log(`   Permissions: ${role.permissions.substring(0, 100)}...`);
              }
            } else {
              console.log(`   Permissions: None`);
            }
            console.log("------------------------");
          });
        }

        await AppDataSource.destroy();
        console.log("Database connection closed");
        
        return roles;
      } catch (error) {
        console.error("Error showing roles:", error);
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
        throw error;
      }
    }

    // Function to create a custom role
    async function createCustomRole(roleName, description, permissions) {
      try {
        // Initialize database if not already connected
        if (!AppDataSource.isInitialized) {
          await initializeDatabase();
          console.log("Database connected successfully");
        }

        const roleRepository = AppDataSource.getRepository(Role);

        // Check if role already exists
        const existingRole = await roleRepository.findOne({ where: { name: roleName } });
        if (existingRole) {
          console.log(`Role '${roleName}' already exists.`);
          
          // Show all roles
          await showRoles();
          return;
        }

        // Create new role
        const role = new Role();
        role.name = roleName;
        role.description = description;
        role.permissions = permissions ? JSON.stringify(permissions) : null;
        role.isActive = true;
        role.isSystem = false;

        // Save role to database
        const savedRole = await roleRepository.save(role);
        console.log(`Role '${roleName}' created successfully.`);

        // Show all roles after creation
        await showRoles();
      } catch (error) {
        console.error("Error creating custom role:", error);
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Error in role management:", error);
    throw error;
  }
}

//=============================================================================
// RESET DATABASE
//=============================================================================

/**
 * Reset the database (drop and recreate)
 */
async function resetDatabase() {
  try {
    console.log(`Starting database reset process for '${dbConfig.database}'...`);
    
    // Connect to postgres database for admin operations
    const adminClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: 'postgres', // Connect to default postgres database
    });
    
    await adminClient.connect();
    console.log("Connected to postgres database");
    
    // Check if our database exists
    const checkResult = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );
    
    const dbExists = checkResult.rows.length > 0;
    
    if (dbExists) {
      // Terminate all connections to the database before dropping
      console.log(`Terminating all connections to '${dbConfig.database}'...`);
      await adminClient.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [dbConfig.database]);
      
      // Drop the database
      console.log(`Dropping database '${dbConfig.database}'...`);
      await adminClient.query(`DROP DATABASE ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' dropped successfully`);
    } else {
      console.log(`Database '${dbConfig.database}' does not exist, will create new`);
    }
    
    // Create the database
    console.log(`Creating database '${dbConfig.database}'...`);
    await adminClient.query(`CREATE DATABASE ${dbConfig.database}`);
    console.log(`Database '${dbConfig.database}' created successfully`);
    
    // Close admin connection
    await adminClient.end();
    console.log("Admin database connection closed");
    
    // Now connect to the new database to initialize schema
    console.log(`Connecting to '${dbConfig.database}' to initialize schema...`);
    const dbClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    });
    
    await dbClient.connect();
    
    // Create extension for UUID generation if it doesn't exist
    console.log("Ensuring UUID extension exists...");
    await dbClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create roles table
    console.log("Creating roles table...");
    await dbClient.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSONB,
        "isActive" BOOLEAN DEFAULT true,
        "isSystem" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Insert default admin role
    const now = new Date();
    const adminPermissions = JSON.stringify({
      "users": {"create": true, "read": true, "update": true, "delete": true},
      "roles": {"create": true, "read": true, "update": true, "delete": true},
      "system": {"manage": true}
    });
    
    console.log("Creating default admin role...");
    await dbClient.query(`
      INSERT INTO roles (name, description, permissions, "isActive", "isSystem", "createdAt", "updatedAt")
      VALUES ('Administrator', 'System administrator with full access', $1, true, true, $2, $2)
    `, [adminPermissions, now]);
    
    // Insert default user role
    const userPermissions = JSON.stringify({
      "users": {"create": false, "read": true, "update": false, "delete": false},
      "roles": {"create": false, "read": true, "update": false, "delete": false}
    });
    
    console.log("Creating default user role...");
    await dbClient.query(`
      INSERT INTO roles (name, description, permissions, "isActive", "isSystem", "createdAt", "updatedAt")
      VALUES ('User', 'Regular user with limited access', $1, true, true, $2, $2)
    `, [userPermissions, now]);
    
    console.log("Database schema initialized with default roles");
    
    // Close connection
    await dbClient.end();
    console.log("Database connection closed");
    
    console.log("\n✅ Database reset completed successfully!");
    console.log(`The '${dbConfig.database}' database has been recreated with the initial schema.`);
    console.log("You can now run your application with the fresh database.");
  } catch (error) {
    console.error("Error during database reset:", error);
    throw error;
  }
}

//=============================================================================
// SYNC ESSENTIAL DATA
//=============================================================================

/**
 * Synchronize essential data (roles and approval workflows)
 */
async function syncEssentialData() {
  try {
    console.log("Starting essential data synchronization...");
    
    // Import required modules
    require('ts-node/register');
    const { SyncService } = require('./server/src/services/syncService');
    
    // Run the synchronization
    await SyncService.syncAll();
    
    console.log("Essential data synchronization completed successfully");
  } catch (error) {
    console.error("Error during synchronization:", error);
    throw error;
  }
}

//=============================================================================
// TEST INITIALIZATION
//=============================================================================

/**
 * Test system initialization
 */
async function testInitialization() {
  try {
    console.log('Starting system initialization test...');
    
    // Change to the server directory
    process.chdir(path.join(__dirname, 'server'));
    
    // Run the initialization script directly
    console.log('Running initialization script...');
    execSync('npx ts-node src/scripts/initializeSystem.ts', { stdio: 'inherit' });
    
    // Check if the super admin user exists
    console.log('\nChecking if super admin user exists...');
    execSync('npx ts-node src/scripts/check-superadmin.ts', { stdio: 'inherit' });
    
    // Check if the test user exists
    console.log('\nChecking if test user exists...');
    execSync('npx ts-node src/scripts/check-test-user.ts', { stdio: 'inherit' });
    
    // List all users
    console.log('\nListing all users...');
    execSync('npx ts-node src/scripts/list-users.ts', { stdio: 'inherit' });
    
    console.log('\nSystem initialization test completed successfully!');
    console.log('You can now start the server normally with: npm run dev');
  } catch (error) {
    console.error('Error during system initialization test:', error.message);
    throw error;
  }
}

//=============================================================================
// TEST DATABASE CONNECTION
//=============================================================================

/**
 * Test database connection and list sample tables
 * Functionality from check-typeorm-connection.js
 */
async function testDatabaseConnection() {
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
  });

  try {
    console.log('Initializing database connection...');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`Database: ${dbConfig.database}`);
    
    await client.connect();
    console.log('Database connection initialized successfully!');
    
    // Run a simple query to list tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 5;
    `);
    
    console.log('Sample tables in the database:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Get total table count
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log(`\nTotal tables in database: ${countResult.rows[0].total}`);
    
    await client.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error initializing database connection:', error);
    process.exit(1);
  }
}

// Run the main function
main();