/**
 * Consolidated Migration Script
 * 
 * This script combines all database migration and management functionality into a single file.
 * It replaces multiple individual scripts with a unified approach to database management.
 * 
 * Features:
 * - Database initialization and connection
 * - Running migrations in the correct order
 * - Fixing database schema and data issues
 * - Creating and managing roles
 * - Resetting the database
 * - Creating and resetting the super admin user
 * - Listing users and roles
 * - Initializing system data
 * 
 * Usage:
 *   ts-node src/scripts/consolidatedMigration.ts <command> [options]
 * 
 * Commands:
 *   migrate           Run all pending migrations
 *   reset             Reset the database (drop and recreate)
 *   superadmin        Reset or create the super admin user
 *   list-users        List all users in the database
 *   show-roles        Show all roles in the database
 *   create-role       Create a new role
 *   fix               Fix database schema and data issues
 *   init              Initialize the database with essential data
 *   help              Show this help message
 */

import { AppDataSource, initializeDatabase } from "../config/database";
import config from "../config/config";
import { Client } from "pg";
import logger from "../utils/logger";
import { hashPassword } from "../utils/auth";
import { initializeWorkflows } from "../services/workflowInitService";
import { initializeSystemRoles } from "../controllers/roleController";
import { initializeSystemPages } from "../controllers/pageController";
import { Between } from "typeorm";

// Import all models directly to ensure they're registered with TypeORM
import { User, UserRole, UserLevel, Gender } from "../models/User";
import { LeaveType } from "../models/LeaveType";
import { Department } from "../models/Department";
import { Position } from "../models/Position";
import { Role } from "../models/Role";
import { Holiday } from "../models/Holiday";
import { Page } from "../models/Page";
import { ApprovalWorkflow } from "../models/ApprovalWorkflow";

// Import all entity models to ensure they're registered with TypeORM
import "../models";

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

/**
 * Main function to process commands
 */
async function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'migrate':
        await runConsolidatedMigration(true);
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'superadmin':
        await resetSuperAdmin(true);
        break;
      case 'list-users':
        await listUsers(true);
        break;
      case 'show-roles':
        await showRoles(true);
        break;
      case 'create-role':
        await createCustomRole(args.slice(1), true);
        break;
      case 'fix':
        await fixDatabaseAndMigrations();
        break;
      case 'init':
        await initializeSystemData();
        await createDefaultData();
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

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Consolidated Migration Script

Usage:
  ts-node src/scripts/consolidatedMigration.ts <command> [options]

Commands:
  migrate           Run all pending migrations
  reset             Reset the database (drop and recreate)
  superadmin        Reset or create the super admin user
  list-users        List all users in the database
  show-roles        Show all roles in the database
  create-role       Create a new role
  fix               Fix database schema and data issues
  init              Initialize the database with essential data
  help              Show this help message

Examples:
  ts-node src/scripts/consolidatedMigration.ts migrate
  ts-node src/scripts/consolidatedMigration.ts reset
  ts-node src/scripts/consolidatedMigration.ts superadmin
  ts-node src/scripts/consolidatedMigration.ts create-role "Project Manager" "Manages projects" '{"projects":{"create":true}}'
  `);
}

/**
 * Reset the database by dropping and recreating it
 * This is useful for development and testing
 */
export const resetDatabase = async (): Promise<void> => {
  console.log("Starting database reset process...");

  // Create a client to connect to PostgreSQL
  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: "postgres", // Connect to default postgres database
  });

  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Drop the database if it exists
    const dbName = config.database.database;
    console.log(`Attempting to drop database: ${dbName}`);

    // First terminate all connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid();
    `);

    // Drop the database
    await client.query(`DROP DATABASE IF EXISTS "${dbName}";`);
    console.log(`Database ${dbName} dropped successfully`);

    // Create the database again
    await client.query(`CREATE DATABASE "${dbName}";`);
    console.log(`Database ${dbName} created successfully`);

    // Close the client connection
    await client.end();
    console.log("PostgreSQL client disconnected");

    console.log("Database reset completed successfully");
    return;
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
};

/**
 * Consolidated migration process that handles all database initialization and setup
 */
export const runConsolidatedMigration = async (closeConnection = true): Promise<void> => {
  try {
    logger.info("Starting consolidated migration process...");

    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connected successfully");
    }

    // Step 1: Run pending migrations
    try {
      await runMigrations(false);
    } catch (migrationError: any) {
      logger.error(`Error running migrations: ${migrationError.message}`);
      // Continue with other steps
    }

    // Step 2: Ensure database tables are properly set up
    try {
      await ensureDatabaseStructure();
    } catch (structureError: any) {
      logger.error(`Error ensuring database structure: ${structureError.message}`);
      // Continue with other steps
    }

    // Step 3: Fix any data issues
    try {
      await fixDataIssues();
    } catch (dataIssueError: any) {
      logger.error(`Error fixing data issues: ${dataIssueError.message}`);
      // Continue with other steps
    }

    // Step 4: Initialize system data
    try {
      await initializeSystemData();
    } catch (systemDataError: any) {
      logger.error(`Error initializing system data: ${systemDataError.message}`);
      // Continue with other steps
    }

    // Step 5: Create default data
    try {
      await createDefaultData();
    } catch (defaultDataError: any) {
      logger.error(`Error creating default data: ${defaultDataError.message}`);
      // Continue with other steps
    }

    logger.info("Consolidated migration process completed");
  } catch (error: any) {
    logger.error(`Error in consolidated migration process: ${error.message}`);
    // Don't throw the error, just log it
  } finally {
    // Close the connection if requested
    if (closeConnection && AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
        logger.info("Database connection closed");
      } catch (closeError: any) {
        logger.error(`Error closing database connection: ${closeError.message}`);
      }
    }
  }
};

/**
 * Run pending migrations with improved error handling and ordering
 */
const runMigrations = async (closeConnection = false): Promise<void> => {
  try {
    // Check for pending migrations
    const pendingMigrations = await AppDataSource.showMigrations();
    
    if (pendingMigrations) {
      logger.info("Running pending migrations...");
      
      try {
        // Run all pending migrations in the correct order with transaction for each migration
        await AppDataSource.runMigrations({ transaction: "each" });
        logger.info("Migrations completed successfully");
      } catch (migrationError: any) {
        logger.error(`Error running migrations: ${migrationError.message}`);
        
        // Check if the error is related to role timestamps
        if (migrationError.message && migrationError.message.includes("null value in column \"createdAt\" of relation \"roles\"")) {
          logger.info("Detected role timestamp issue, attempting to fix...");
          
          try {
            // Fix role timestamps
            await AppDataSource.query(`
              UPDATE roles 
              SET "createdAt" = COALESCE("createdAt", now()), 
                  "updatedAt" = COALESCE("updatedAt", now()) 
              WHERE "createdAt" IS NULL OR "updatedAt" IS NULL
            `);
            
            logger.info("Role timestamps fixed, retrying migrations...");
            
            // Try running migrations again
            await AppDataSource.runMigrations({ transaction: "each" });
            logger.info("Migrations completed successfully after fixing role timestamps");
          } catch (fixError: any) {
            logger.error(`Error fixing role timestamps: ${fixError.message}`);
            await runMigrationsIndividually();
          }
        } else {
          // If there's an error with a specific migration, try to run them one by one
          await runMigrationsIndividually();
        }
      }
    } else {
      logger.info("No pending migrations to run");
    }
  } catch (error: any) {
    logger.error(`Error in migration process: ${error.message}`);
    throw error;
  }
};

/**
 * Run migrations individually in case of errors
 */
const runMigrationsIndividually = async (): Promise<void> => {
  try {
    const migrations = await AppDataSource.migrations;
    
    // Sort migrations by timestamp to ensure correct order
    const sortedMigrations = migrations.sort((a, b) => {
      try {
        const aTimestamp = parseInt(a.name.split('-')[0]);
        const bTimestamp = parseInt(b.name.split('-')[0]);
        return aTimestamp - bTimestamp;
      } catch (error) {
        logger.error(`Error parsing migration name: ${a.name} or ${b.name}`);
        return 0; // Keep original order if parsing fails
      }
    });
    
    logger.info(`Attempting to run ${sortedMigrations.length} migrations individually...`);
    
    for (const migration of sortedMigrations) {
      try {
        // Check if migration has already been applied
        const migrationName = migration.name;
        const migrationTimestamp = migrationName.split('-')[0];
        
        const migrationExists = await AppDataSource.query(
          `SELECT * FROM migrations WHERE name = $1`,
          [migrationName]
        );
        
        if (migrationExists && migrationExists.length > 0) {
          logger.info(`Migration ${migrationName} already applied, skipping`);
          continue;
        }
        
        logger.info(`Running migration: ${migrationName}`);
        
        // Create a separate query runner for this migration
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
          // Run the migration
          await migration.up(queryRunner);
          
          // Mark the migration as complete
          await queryRunner.query(
            `INSERT INTO migrations(timestamp, name) VALUES ($1, $2)`,
            [migrationTimestamp, migrationName]
          );
          
          // Commit the transaction
          await queryRunner.commitTransaction();
          logger.info(`Migration ${migrationName} completed successfully`);
        } catch (transactionError: any) {
          // Rollback the transaction if there's an error
          await queryRunner.rollbackTransaction();
          logger.error(`Error in migration ${migrationName}: ${transactionError.message}`);
        } finally {
          // Release the query runner
          await queryRunner.release();
        }
      } catch (individualError: any) {
        logger.error(`Error processing migration ${migration.name}: ${individualError.message}`);
        // Continue with the next migration
      }
    }
  } catch (error: any) {
    logger.error(`Error running migrations individually: ${error.message}`);
  }
};

/**
 * Ensure database tables have the correct structure
 */
const ensureDatabaseStructure = async (): Promise<void> => {
  try {
    logger.info("Checking database structure...");

    // Check if the positions table exists and has the level column
    await ensurePositionsTableHasLevelColumn();

    // Check if approval workflows table has the correct column types
    await ensureApprovalWorkflowsColumnTypes();

    logger.info("Database structure check completed");
  } catch (error: any) {
    logger.error(`Error ensuring database structure: ${error.message}`);
    throw error;
  }
};

/**
 * Ensure the positions table has the level column
 */
const ensurePositionsTableHasLevelColumn = async (): Promise<void> => {
  try {
    // Check if the positions table exists
    const positionsTableExists = await checkTableExists("positions");
    
    if (!positionsTableExists) {
      logger.info("Positions table does not exist yet. It will be created by migrations.");
      return;
    }

    // Check if the level column exists
    const levelColumnExists = await checkColumnExists("positions", "level");

    if (!levelColumnExists) {
      logger.info("Level column does not exist in positions table. Adding it...");
      
      // Add the level column with default value 1
      await AppDataSource.query(`
        ALTER TABLE "positions" ADD COLUMN "level" integer NOT NULL DEFAULT 1
      `);
      
      logger.info("Level column added successfully to positions table");
    } else {
      logger.info("Level column already exists in positions table");
    }
  } catch (error: any) {
    logger.error(`Error ensuring positions table has level column: ${error.message}`);
    throw error;
  }
};

/**
 * Ensure approval workflows table has the correct column types
 */
const ensureApprovalWorkflowsColumnTypes = async (): Promise<void> => {
  try {
    // Check if the approval_workflows table exists
    const workflowsTableExists = await checkTableExists("approval_workflows");
    
    if (!workflowsTableExists) {
      logger.info("Approval workflows table does not exist yet. It will be created by migrations.");
      return;
    }

    // Check if the minDays and maxDays columns are float type
    const columnTypes = await AppDataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'approval_workflows' 
      AND column_name IN ('minDays', 'maxDays')
    `);

    const needsConversion = columnTypes.some((col: any) => 
      col.data_type !== 'double precision' && col.data_type !== 'real'
    );

    if (needsConversion) {
      logger.info("Converting approval workflows days columns to float type...");
      
      try {
        // First, delete any existing workflows to avoid conversion issues
        await AppDataSource.query(`DELETE FROM "approval_workflows"`);
        
        // Alter the column types from integer to float
        await AppDataSource.query(`
          ALTER TABLE "approval_workflows" ALTER COLUMN "minDays" TYPE float;
          ALTER TABLE "approval_workflows" ALTER COLUMN "maxDays" TYPE float;
        `);
        
        logger.info("Successfully converted approval workflows column types");
      } catch (conversionError: any) {
        logger.error(`Error converting approval workflows column types: ${conversionError.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`Error ensuring approval workflows column types: ${error.message}`);
    throw error;
  }
};

/**
 * Check if a table exists in the database
 */
const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const result = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    return result[0].exists;
  } catch (error: any) {
    logger.error(`Error checking if table ${tableName} exists: ${error.message}`);
    return false;
  }
};

/**
 * Check if a column exists in a table
 */
const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    const result = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      )
    `, [tableName, columnName]);
    
    return result[0].exists;
  } catch (error: any) {
    logger.error(`Error checking if column ${columnName} exists in table ${tableName}: ${error.message}`);
    return false;
  }
};

/**
 * Fix data issues in the database
 */
const fixDataIssues = async (): Promise<void> => {
  try {
    logger.info("Checking for data issues...");

    // Fix role timestamps
    await fixRoleTimestamps();

    // Fix user relationships
    await fixUserRelationships();

    logger.info("Data issue check completed");
  } catch (error: any) {
    logger.error(`Error fixing data issues: ${error.message}`);
    throw error;
  }
};

/**
 * Fix role timestamps
 */
const fixRoleTimestamps = async (): Promise<void> => {
  try {
    // Check if the roles table exists
    const rolesTableExists = await checkTableExists("roles");
    
    if (!rolesTableExists) {
      logger.info("Roles table does not exist yet. It will be created by migrations.");
      return;
    }

    // Check if there are roles with missing timestamps
    const result = await AppDataSource.query(`
      SELECT COUNT(*) as count
      FROM roles
      WHERE "createdAt" IS NULL OR "updatedAt" IS NULL
    `);
    
    const count = parseInt(result[0].count);
    
    if (count > 0) {
      logger.info(`Found ${count} roles with missing timestamps. Fixing...`);
      
      // Update roles with missing timestamps
      await AppDataSource.query(`
        UPDATE roles 
        SET "createdAt" = COALESCE("createdAt", now()), 
            "updatedAt" = COALESCE("updatedAt", now()) 
        WHERE "createdAt" IS NULL OR "updatedAt" IS NULL
      `);
      
      logger.info("Role timestamps fixed successfully");
    } else {
      logger.info("No roles with missing timestamps found");
    }
  } catch (error: any) {
    logger.error(`Error fixing role timestamps: ${error.message}`);
    throw error;
  }
};

/**
 * Fix user relationships
 */
const fixUserRelationships = async (): Promise<void> => {
  try {
    // Check if the users table exists
    const usersTableExists = await checkTableExists("users");
    
    if (!usersTableExists) {
      logger.info("Users table does not exist yet. It will be created by migrations.");
      return;
    }

    // Check if the hrId and teamLeadId columns exist
    const hrIdExists = await checkColumnExists("users", "hrId");
    const teamLeadIdExists = await checkColumnExists("users", "teamLeadId");
    
    if (!hrIdExists || !teamLeadIdExists) {
      logger.info("User relationship columns don't exist yet. They will be created by migrations.");
      return;
    }

    // Check for users with invalid relationships
    const result = await AppDataSource.query(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN users hr ON u."hrId" = hr.id
      LEFT JOIN users tl ON u."teamLeadId" = tl.id
      WHERE 
        (u."hrId" IS NOT NULL AND hr.id IS NULL) OR
        (u."teamLeadId" IS NOT NULL AND tl.id IS NULL)
    `);
    
    const count = parseInt(result[0].count);
    
    if (count > 0) {
      logger.info(`Found ${count} users with invalid relationships. Fixing...`);
      
      // Fix invalid relationships by setting them to NULL
      await AppDataSource.query(`
        UPDATE users
        SET "hrId" = NULL
        WHERE "hrId" IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM users hr WHERE hr.id = users."hrId"
        )
      `);
      
      await AppDataSource.query(`
        UPDATE users
        SET "teamLeadId" = NULL
        WHERE "teamLeadId" IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM users tl WHERE tl.id = users."teamLeadId"
        )
      `);
      
      logger.info("User relationships fixed successfully");
    } else {
      logger.info("No users with invalid relationships found");
    }
  } catch (error: any) {
    logger.error(`Error fixing user relationships: ${error.message}`);
    throw error;
  }
};

/**
 * Fix database schema and migration issues
 */
export const fixDatabaseAndMigrations = async (): Promise<void> => {
  try {
    logger.info("Starting database and migration fix process...");
    
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connected successfully");
    }
    
    // Step 1: Ensure database structure
    await ensureDatabaseStructure();
    
    // Step 2: Fix data issues
    await fixDataIssues();
    
    // Step 3: Run pending migrations
    await runMigrations(true);
    
    logger.info("Database and migration fix process completed");
  } catch (error: any) {
    logger.error(`Error fixing database and migrations: ${error.message}`);
    throw error;
  }
};

/**
 * Initialize system data
 */
export const initializeSystemData = async (): Promise<void> => {
  try {
    logger.info("Initializing system data...");
    
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connected successfully");
    }
    
    // Step 1: Initialize system roles
    try {
      await initializeSystemRoles();
      logger.info("System roles initialized successfully");
    } catch (rolesError: any) {
      logger.error(`Error initializing system roles: ${rolesError.message}`);
    }
    
    // Step 2: Initialize system pages
    try {
      await initializeSystemPages();
      logger.info("System pages initialized successfully");
    } catch (pagesError: any) {
      logger.error(`Error initializing system pages: ${pagesError.message}`);
    }
    
    // Step 3: Create super admin if it doesn't exist
    try {
      await createSuperAdmin();
      logger.info("Super admin user checked/created successfully");
    } catch (adminError: any) {
      logger.error(`Error creating super admin: ${adminError.message}`);
    }
    
    logger.info("System data initialization completed");
  } catch (error: any) {
    logger.error(`Error initializing system data: ${error.message}`);
    throw error;
  }
};

/**
 * Create default data
 */
export const createDefaultData = async (): Promise<void> => {
  try {
    logger.info("Creating default data...");
    
    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connected successfully");
    }
    
    // Step 1: Ensure system roles are initialized
    try {
      await initializeSystemRoles();
      logger.info("System roles initialized successfully");
    } catch (rolesError: any) {
      logger.error(`Error initializing system roles: ${rolesError.message}`);
    }
    
    // Step 2: Create default leave types
    try {
      await createDefaultLeaveTypes();
      logger.info("Default leave types created successfully");
    } catch (leaveTypesError: any) {
      logger.error(`Error creating default leave types: ${leaveTypesError.message}`);
    }
    
    // Step 3: Create default departments and positions
    try {
      await createDefaultDepartmentsAndPositions();
      logger.info("Default departments and positions created successfully");
    } catch (deptError: any) {
      logger.error(`Error creating default departments and positions: ${deptError.message}`);
    }
    
    // Step 4: Initialize approval workflows
    try {
      await initializeWorkflows();
      logger.info("Approval workflows initialized successfully");
    } catch (workflowError: any) {
      logger.error(`Error initializing approval workflows: ${workflowError.message}`);
    }
    
    // Step 5: Create test users if in development environment
    if (process.env.NODE_ENV !== 'production') {
      try {
        await createTestUsers();
        logger.info("Test users created successfully");
      } catch (testUsersError: any) {
        logger.error(`Error creating test users: ${testUsersError.message}`);
      }
    }
    
    logger.info("Default data creation completed");
  } catch (error: any) {
    logger.error(`Error creating default data: ${error.message}`);
    throw error;
  }
};

/**
 * Create super admin user if it doesn't exist
 */
const createSuperAdmin = async (): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if super admin exists
    const superAdmin = await userRepository.findOne({
      where: { email: "admin@example.com" }
    });
    
    if (!superAdmin) {
      logger.info("Super admin user does not exist. Creating...");
      
      // Create super admin user
      const user = new User();
      user.firstName = "Super";
      user.lastName = "Admin";
      user.email = "admin@example.com";
      user.password = await hashPassword("Admin@123");
      user.role = UserRole.SUPER_ADMIN;
      user.isActive = true;
      user.level = UserLevel.LEVEL_4;
      user.gender = Gender.OTHER;
      
      await userRepository.save(user);
      logger.info("Super admin user created successfully");
    } else {
      logger.info("Super admin user already exists");
    }
  } catch (error: any) {
    logger.error(`Error creating super admin user: ${error.message}`);
    throw error;
  }
};

/**
 * Reset the super admin user
 */
export const resetSuperAdmin = async (closeConnection = true): Promise<void> => {
  try {
    // Initialize the connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connected successfully");
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if super admin exists
    const superAdmin = await userRepository.findOne({
      where: { email: "admin@example.com" }
    });
    
    if (superAdmin) {
      logger.info("Super admin user exists. Resetting password...");
      
      // Reset super admin password
      superAdmin.password = await hashPassword("Admin@123");
      await userRepository.save(superAdmin);
      
      logger.info("Super admin password reset successfully");
      console.log(`
Super Admin Details:
Email: admin@example.com
Password: Admin@123
      `);
    } else {
      logger.info("Super admin user does not exist. Creating...");
      
      // Create super admin user
      const user = new User();
      user.firstName = "Super";
      user.lastName = "Admin";
      user.email = "admin@example.com";
      user.password = await hashPassword("Admin@123");
      user.role = UserRole.SUPER_ADMIN;
      user.isActive = true;
      user.level = UserLevel.LEVEL_4;
      user.gender = Gender.OTHER;
      
      await userRepository.save(user);
      
      logger.info("Super admin user created successfully");
      console.log(`
Super Admin Details:
Email: admin@example.com
Password: Admin@123
      `);
    }
  } catch (error) {
    logger.error("Error resetting super admin:", error);
    throw error;
  } finally {
    if (closeConnection && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("Database connection closed");
    }
  }
};

/**
 * Create default leave types
 */
const createDefaultLeaveTypes = async (): Promise<void> => {
  try {
    const leaveTypeRepository = AppDataSource.getRepository(LeaveType);
    
    // Default leave types
    const defaultLeaveTypes = [
      { 
        name: "Annual Leave", 
        description: "Regular annual leave", 
        defaultDays: 20, 
        daysAllowed: 20, 
        isActive: true, 
        color: "#4CAF50", 
        isPaidLeave: true,
        isPaid: true,
        isHalfDayAllowed: true,
        requiresApproval: true
      },
      { 
        name: "Sick Leave", 
        description: "Leave for illness or medical appointments", 
        defaultDays: 10, 
        daysAllowed: 10, 
        isActive: true, 
        color: "#F44336", 
        isPaidLeave: true,
        isPaid: true,
        isHalfDayAllowed: true,
        requiresApproval: true
      },
      { 
        name: "Personal Leave", 
        description: "Leave for personal matters", 
        defaultDays: 5, 
        daysAllowed: 5, 
        isActive: true, 
        color: "#2196F3", 
        isPaidLeave: true,
        isPaid: true,
        isHalfDayAllowed: true,
        requiresApproval: true
      },
      { 
        name: "Maternity Leave", 
        description: "Leave for childbirth and recovery", 
        defaultDays: 90, 
        daysAllowed: 90, 
        isActive: true, 
        color: "#9C27B0", 
        applicableGender: "female",
        isPaidLeave: true,
        isPaid: true,
        isHalfDayAllowed: false,
        requiresApproval: true
      },
      { 
        name: "Paternity Leave", 
        description: "Leave for new fathers", 
        defaultDays: 10, 
        daysAllowed: 10, 
        isActive: true, 
        color: "#673AB7", 
        applicableGender: "male",
        isPaidLeave: true,
        isPaid: true,
        isHalfDayAllowed: false,
        requiresApproval: true
      },
      { 
        name: "Bereavement Leave", 
        description: "Leave for family death or funeral", 
        defaultDays: 5, 
        daysAllowed: 5, 
        isActive: true, 
        color: "#607D8B", 
        isPaidLeave: true,
        isPaid: true,
        isHalfDayAllowed: false,
        requiresApproval: true
      },
      { 
        name: "Unpaid Leave", 
        description: "Leave without pay", 
        defaultDays: 0, 
        daysAllowed: 30, 
        isActive: true, 
        color: "#FF9800", 
        isPaidLeave: false,
        isPaid: false,
        isHalfDayAllowed: true,
        requiresApproval: true
      },
    ];
    
    for (const leaveTypeData of defaultLeaveTypes) {
      // Check if leave type already exists
      const existingLeaveType = await leaveTypeRepository.findOne({
        where: { name: leaveTypeData.name }
      });
      
      if (!existingLeaveType) {
        // Create new leave type
        const leaveType = new LeaveType();
        Object.assign(leaveType, leaveTypeData);
        
        await leaveTypeRepository.save(leaveType);
        logger.info(`Leave type '${leaveTypeData.name}' created successfully`);
      } else {
        logger.info(`Leave type '${leaveTypeData.name}' already exists`);
      }
    }
  } catch (error: any) {
    logger.error(`Error creating default leave types: ${error.message}`);
    throw error;
  }
};

/**
 * Create default departments and positions
 */
const createDefaultDepartmentsAndPositions = async (): Promise<void> => {
  try {
    const departmentRepository = AppDataSource.getRepository(Department);
    const positionRepository = AppDataSource.getRepository(Position);
    
    // Default departments
    const defaultDepartments = [
      { name: "Human Resources", description: "HR department" },
      { name: "Engineering", description: "Engineering department" },
      { name: "Finance", description: "Finance department" },
      { name: "Marketing", description: "Marketing department" },
      { name: "Operations", description: "Operations department" },
    ];
    
    // Create departments
    for (const departmentData of defaultDepartments) {
      // Check if department already exists
      const existingDepartment = await departmentRepository.findOne({
        where: { name: departmentData.name }
      });
      
      if (!existingDepartment) {
        // Create new department
        const department = new Department();
        Object.assign(department, departmentData);
        
        const savedDepartment = await departmentRepository.save(department);
        logger.info(`Department '${departmentData.name}' created successfully`);
        
        // Create positions for this department
        await createPositionsForDepartment(savedDepartment);
      } else {
        logger.info(`Department '${departmentData.name}' already exists`);
        
        // Check if positions exist for this department
        const positions = await positionRepository.find({
          where: { department: { id: existingDepartment.id } }
        });
        
        if (positions.length === 0) {
          // Create positions for this department
          await createPositionsForDepartment(existingDepartment);
        }
      }
    }
  } catch (error: any) {
    logger.error(`Error creating default departments and positions: ${error.message}`);
    throw error;
  }
};

/**
 * Create positions for a department
 */
const createPositionsForDepartment = async (department: Department): Promise<void> => {
  try {
    const positionRepository = AppDataSource.getRepository(Position);
    
    // Default positions based on department
    let positions: { name: string; description: string; level: number }[] = [];
    
    switch (department.name) {
      case "Human Resources":
        positions = [
          { name: "HR Director", description: "Head of HR department", level: 4 },
          { name: "HR Manager", description: "HR department manager", level: 3 },
          { name: "HR Specialist", description: "HR specialist", level: 2 },
          { name: "HR Assistant", description: "HR assistant", level: 1 },
        ];
        break;
      case "Engineering":
        positions = [
          { name: "CTO", description: "Chief Technology Officer", level: 4 },
          { name: "Engineering Manager", description: "Engineering department manager", level: 3 },
          { name: "Senior Developer", description: "Senior software developer", level: 2 },
          { name: "Junior Developer", description: "Junior software developer", level: 1 },
        ];
        break;
      case "Finance":
        positions = [
          { name: "CFO", description: "Chief Financial Officer", level: 4 },
          { name: "Finance Manager", description: "Finance department manager", level: 3 },
          { name: "Accountant", description: "Accountant", level: 2 },
          { name: "Finance Assistant", description: "Finance assistant", level: 1 },
        ];
        break;
      case "Marketing":
        positions = [
          { name: "Marketing Director", description: "Head of Marketing department", level: 4 },
          { name: "Marketing Manager", description: "Marketing department manager", level: 3 },
          { name: "Marketing Specialist", description: "Marketing specialist", level: 2 },
          { name: "Marketing Assistant", description: "Marketing assistant", level: 1 },
        ];
        break;
      case "Operations":
        positions = [
          { name: "Operations Director", description: "Head of Operations department", level: 4 },
          { name: "Operations Manager", description: "Operations department manager", level: 3 },
          { name: "Operations Specialist", description: "Operations specialist", level: 2 },
          { name: "Operations Assistant", description: "Operations assistant", level: 1 },
        ];
        break;
      default:
        positions = [
          { name: "Director", description: "Department director", level: 4 },
          { name: "Manager", description: "Department manager", level: 3 },
          { name: "Specialist", description: "Department specialist", level: 2 },
          { name: "Assistant", description: "Department assistant", level: 1 },
        ];
    }
    
    // Create positions
    for (const positionData of positions) {
      // Check if position already exists
      const existingPosition = await positionRepository.findOne({
        where: {
          name: positionData.name,
          department: { id: department.id }
        }
      });
      
      if (!existingPosition) {
        // Create new position
        const position = new Position();
        position.name = positionData.name;
        position.description = positionData.description;
        position.level = positionData.level;
        position.department = department;
        position.isActive = true;
        
        await positionRepository.save(position);
        logger.info(`Position '${positionData.name}' created successfully for department '${department.name}'`);
      } else {
        logger.info(`Position '${positionData.name}' already exists for department '${department.name}'`);
      }
    }
  } catch (error: any) {
    logger.error(`Error creating positions for department '${department.name}': ${error.message}`);
    throw error;
  }
};

/**
 * Create test users
 */
const createTestUsers = async (): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const departmentRepository = AppDataSource.getRepository(Department);
    const positionRepository = AppDataSource.getRepository(Position);
    const roleRepository = AppDataSource.getRepository(Role);
    
    // Get HR department
    const hrDepartment = await departmentRepository.findOne({
      where: { name: "Human Resources" }
    });
    
    // Get Engineering department
    const engineeringDepartment = await departmentRepository.findOne({
      where: { name: "Engineering" }
    });
    
    if (!hrDepartment || !engineeringDepartment) {
      logger.error("Required departments not found. Cannot create test users.");
      return;
    }
    
    // Get HR Manager position
    const hrManagerPosition = await positionRepository.findOne({
      where: {
        name: "HR Manager",
        department: { id: hrDepartment.id }
      }
    });
    
    // Get HR Specialist position
    const hrSpecialistPosition = await positionRepository.findOne({
      where: {
        name: "HR Specialist",
        department: { id: hrDepartment.id }
      }
    });
    
    // Get Engineering Manager position
    const engineeringManagerPosition = await positionRepository.findOne({
      where: {
        name: "Engineering Manager",
        department: { id: engineeringDepartment.id }
      }
    });
    
    // Get Senior Developer position
    const seniorDeveloperPosition = await positionRepository.findOne({
      where: {
        name: "Senior Developer",
        department: { id: engineeringDepartment.id }
      }
    });
    
    // Get Junior Developer position
    const juniorDeveloperPosition = await positionRepository.findOne({
      where: {
        name: "Junior Developer",
        department: { id: engineeringDepartment.id }
      }
    });
    
    if (!hrManagerPosition || !hrSpecialistPosition || !engineeringManagerPosition || !seniorDeveloperPosition || !juniorDeveloperPosition) {
      logger.error("Required positions not found. Cannot create test users.");
      return;
    }
    
    // Get HR role
    const hrRole = await roleRepository.findOne({
      where: { name: UserRole.HR }
    });
    
    // Get Manager role
    const managerRole = await roleRepository.findOne({
      where: { name: UserRole.MANAGER }
    });
    
    // Get Team Lead role
    const teamLeadRole = await roleRepository.findOne({
      where: { name: UserRole.TEAM_LEAD }
    });
    
    // Get Employee role
    const employeeRole = await roleRepository.findOne({
      where: { name: UserRole.EMPLOYEE }
    });
    
    // If roles are not found, we'll create them
    if (!hrRole || !managerRole || !teamLeadRole || !employeeRole) {
      logger.info("Some required roles not found. Initializing system roles first...");
      
      // Initialize system roles
      try {
        await initializeSystemRoles();
        
        // Try to get the roles again
        const hrRole = await roleRepository.findOne({
          where: { name: UserRole.HR }
        });
        
        const managerRole = await roleRepository.findOne({
          where: { name: UserRole.MANAGER }
        });
        
        const teamLeadRole = await roleRepository.findOne({
          where: { name: UserRole.TEAM_LEAD }
        });
        
        const employeeRole = await roleRepository.findOne({
          where: { name: UserRole.EMPLOYEE }
        });
        
        if (!hrRole || !managerRole || !teamLeadRole || !employeeRole) {
          logger.error("Required roles still not found after initialization. Cannot create test users.");
          return;
        }
      } catch (error) {
        logger.error("Error initializing system roles:", error);
        return;
      }
    }
    
    // Test users data
    const testUsers = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "hr@example.com",
        password: "password123",
        role: UserRole.HR,
        roleId: hrRole?.id,
        departmentId: hrDepartment?.id,
        departmentName: "Human Resources",
        positionId: hrManagerPosition?.id,
        positionName: "HR Manager",
        level: UserLevel.LEVEL_3,
        gender: Gender.MALE,
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "manager@example.com",
        password: "password123",
        role: UserRole.MANAGER,
        roleId: managerRole?.id,
        departmentId: engineeringDepartment?.id,
        departmentName: "Engineering",
        positionId: engineeringManagerPosition?.id,
        positionName: "Engineering Manager",
        level: UserLevel.LEVEL_3,
        gender: Gender.FEMALE,
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "teamlead@example.com",
        password: "password123",
        role: UserRole.TEAM_LEAD,
        roleId: teamLeadRole?.id,
        departmentId: engineeringDepartment?.id,
        departmentName: "Engineering",
        positionId: seniorDeveloperPosition?.id,
        positionName: "Senior Developer",
        level: UserLevel.LEVEL_2,
        gender: Gender.MALE,
      },
      {
        firstName: "Alice",
        lastName: "Williams",
        email: "employee@example.com",
        password: "password123",
        role: UserRole.EMPLOYEE,
        roleId: employeeRole?.id,
        departmentId: engineeringDepartment?.id,
        departmentName: "Engineering",
        positionId: juniorDeveloperPosition?.id,
        positionName: "Junior Developer",
        level: UserLevel.LEVEL_1,
        gender: Gender.FEMALE,
      },
      {
        firstName: "Sarah",
        lastName: "Brown",
        email: "hr2@example.com",
        password: "password123",
        role: UserRole.HR,
        roleId: hrRole?.id,
        departmentId: hrDepartment?.id,
        departmentName: "Human Resources",
        positionId: hrSpecialistPosition?.id,
        positionName: "HR Specialist",
        level: UserLevel.LEVEL_2,
        gender: Gender.FEMALE,
      },
    ];
    
    // Create test users
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userData.email }
      });
      
      if (!existingUser) {
        // Create new user
        const user = new User();
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;
        user.email = userData.email;
        user.password = await hashPassword(userData.password);
        user.role = userData.role;
        user.roleId = userData.roleId;
        user.department = userData.departmentName;
        user.departmentId = userData.departmentId;
        user.position = userData.positionName;
        user.positionId = userData.positionId;
        user.level = userData.level;
        user.gender = userData.gender;
        user.isActive = true;
        
        await userRepository.save(user);
        logger.info(`Test user '${userData.email}' created successfully`);
      } else {
        logger.info(`Test user '${userData.email}' already exists`);
      }
    }
    
    // Set up relationships between users
    const hr = await userRepository.findOne({ where: { email: "hr@example.com" } });
    const manager = await userRepository.findOne({ where: { email: "manager@example.com" } });
    const teamLead = await userRepository.findOne({ where: { email: "teamlead@example.com" } });
    const employee = await userRepository.findOne({ where: { email: "employee@example.com" } });
    
    if (hr && manager && teamLead && employee) {
      // Set HR for all users
      manager.hrId = hr.id;
      teamLead.hrId = hr.id;
      employee.hrId = hr.id;
      
      // Set team lead for employee
      employee.teamLeadId = teamLead.id;
      
      // Save changes
      await userRepository.save([manager, teamLead, employee]);
      logger.info("User relationships set up successfully");
    }
  } catch (error: any) {
    logger.error(`Error creating test users: ${error.message}`);
    throw error;
  }
};

/**
 * List all users in the database
 */
export const listUsers = async (closeConnection = true): Promise<void> => {
  try {
    // Initialize the connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Connected to database");
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Get all users with their relationships
    const users = await userRepository.find({
      relations: ["departmentObj", "positionObj", "roleObj"],
      order: { firstName: "ASC", lastName: "ASC" }
    });
    
    if (users.length === 0) {
      console.log("No users found in the database");
      return;
    }
    
    console.log(`\nFound ${users.length} users in the database:\n`);
    
    // Display users in a table format
    console.log("ID | Name | Email | Role | Department | Position");
    console.log("-".repeat(100));
    
    users.forEach(user => {
      console.log(
        `${user.id.substring(0, 8)}... | ` +
        `${user.firstName} ${user.lastName} | ` +
        `${user.email} | ` +
        `${user.role} | ` +
        `${user.department || (user.departmentObj ? user.departmentObj.name : 'N/A')} | ` +
        `${user.position || (user.positionObj ? user.positionObj.name : 'N/A')}`
      );
    });
    
    console.log("\n");
    
    // Get HR and Team Lead relationships
    console.log("HR and Team Lead Relationships:");
    console.log("-".repeat(100));
    
    for (const user of users) {
      if (user.hrId || user.teamLeadId) {
        let hrName = "N/A";
        let teamLeadName = "N/A";
        
        if (user.hrId) {
          const hr = await userRepository.findOne({ where: { id: user.hrId } });
          if (hr) {
            hrName = `${hr.firstName} ${hr.lastName}`;
          }
        }
        
        if (user.teamLeadId) {
          const teamLead = await userRepository.findOne({ where: { id: user.teamLeadId } });
          if (teamLead) {
            teamLeadName = `${teamLead.firstName} ${teamLead.lastName}`;
          }
        }
        
        console.log(
          `${user.firstName} ${user.lastName} | ` +
          `HR: ${hrName} | ` +
          `Team Lead: ${teamLeadName}`
        );
      }
    }
    
    console.log("\n");
  } catch (error) {
    logger.error("Error listing users:", error);
    throw error;
  } finally {
    if (closeConnection && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("Database connection closed");
    }
  }
};

/**
 * Show all roles in the database
 */
export const showRoles = async (closeConnection = true): Promise<any[]> => {
  try {
    // Initialize database if not already connected
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
      logger.info("Database connected successfully");
    }
    
    const roleRepository = AppDataSource.getRepository(Role);
    
    // Get all roles
    const roles = await roleRepository.find({
      order: { name: "ASC" }
    });
    
    if (roles.length === 0) {
      console.log("No roles found in the database");
      return [];
    }
    
    console.log(`\nFound ${roles.length} roles in the database:\n`);
    
    // Display roles in a table format
    console.log("ID | Name | Description | System Role | Active");
    console.log("-".repeat(80));
    
    roles.forEach(role => {
      console.log(
        `${role.id.substring(0, 8)}... | ` +
        `${role.name} | ` +
        `${role.description || 'N/A'} | ` +
        `${role.isSystem ? 'Yes' : 'No'} | ` +
        `${role.isActive ? 'Yes' : 'No'}`
      );
    });
    
    console.log("\n");
    
    return roles;
  } catch (error) {
    logger.error("Error showing roles:", error);
    throw error;
  } finally {
    if (closeConnection && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("Database connection closed");
    }
  }
};

/**
 * Create a custom role
 */
export const createCustomRole = async (args: string[], closeConnection = true): Promise<void> => {
  try {
    // Initialize database if not already connected
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
      logger.info("Database connected successfully");
    }
    
    // Check arguments
    if (args.length < 2) {
      console.log("Usage: create-role <name> <description> [permissions]");
      console.log("Example: create-role \"Project Manager\" \"Manages projects\" '{\"projects\":{\"create\":true}}'");
      return;
    }
    
    const roleName = args[0];
    const roleDescription = args[1];
    let permissionsStr = "{}";
    
    // Parse permissions if provided
    if (args.length >= 3) {
      try {
        // Validate JSON by parsing it
        JSON.parse(args[2]);
        permissionsStr = args[2];
      } catch (parseError) {
        console.error("Error parsing permissions JSON:", parseError);
        console.log("Using empty permissions object");
      }
    }
    
    const roleRepository = AppDataSource.getRepository(Role);
    
    // Check if role already exists
    const existingRole = await roleRepository.findOne({ where: { name: roleName } });
    if (existingRole) {
      console.log(`Role '${roleName}' already exists.`);
      
      // Show all roles
      await showRoles(closeConnection);
      return;
    }
    
    // Create new role
    const role = new Role();
    role.name = roleName;
    role.description = roleDescription;
    role.permissions = permissionsStr; // Store as string
    role.isActive = true;
    role.isSystem = false;
    
    // Save role to database
    const savedRole = await roleRepository.save(role);
    console.log(`Role '${roleName}' created successfully.`);
    
    // Show all roles
    await showRoles(closeConnection);
  } catch (error) {
    logger.error("Error creating custom role:", error);
    if (closeConnection && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    throw error;
  }
};

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("Error in main function:", error);
    process.exit(1);
  });
}

// Export functions for use in other scripts
export {
  runMigrations,
  ensureDatabaseStructure,
  fixDataIssues,
  createSuperAdmin,
  createDefaultLeaveTypes,
  createDefaultDepartmentsAndPositions,
  createTestUsers
};