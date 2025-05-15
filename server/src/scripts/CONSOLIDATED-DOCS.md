# Database Management and Migration Documentation

## Database Management Tools

This directory contains a consolidated set of database management tools for the leave management system. All database-related functionality has been consolidated into a single file (`consolidatedMigration.ts`) to simplify maintenance and usage.

### Main Features

- Database migration and initialization
- Database structure verification and fixes
- System data initialization (roles, pages, super admin)
- Default data creation (users, leave types, departments, positions)
- User and role management utilities

### Usage

#### Command Line Interface

The database tools can be used directly from the command line:

```bash
# Show available commands
npm run db

# Run the consolidated migration
npm run db:migrate

# Reset the database
npm run db:reset

# Initialize the database with migrations and default data
npm run db:init

# Reset the database, run migrations, and start the server
npm run db:fresh

# Reset or create the super admin user
npm run db:superadmin

# List all users in the database
npm run db:list-users

# Show all roles in the database
npm run db:show-roles

# Create a custom role
npm run db:manage-roles "Role Name" "Role Description" '{"permissions":{"read":true}}'
```

#### Programmatic Usage

You can also import and use the database tools in your code:

```typescript
import { 
  runConsolidatedMigration, 
  resetDatabase, 
  resetSuperAdmin,
  listUsers,
  showRoles,
  createCustomRole
} from './scripts/consolidatedMigration';

// Run the consolidated migration
await runConsolidatedMigration(false); // Pass false to keep the connection open

// Reset the database
await resetDatabase();

// Reset or create the super admin
await resetSuperAdmin();

// List all users
await listUsers();

// Show all roles
await showRoles();

// Create a custom role
await createCustomRole('Custom Role', 'Description', { permissions: { read: true } });
```

### Default User Credentials

#### Super Admin
- Email: `admin@example.com`
- Password: `Admin@123`

#### Test User
- Email: `test@example.com`
- Password: `Test@123`

#### Other Default Users
- HR Manager: `hr@example.com` / `Hr@123456`
- Department Head: `head@example.com` / `Head@123`
- Team Lead: `lead@example.com` / `Lead@123`
- Regular Employee: `employee@example.com` / `Employee@123`

## Migration Scripts Consolidation

### Overview

This document explains the consolidation of multiple migration scripts into a single, comprehensive migration process. The goal is to simplify the database initialization and setup process, making it more reliable and easier to maintain.

### Changes Made

1. Created a new consolidated migration script: `consolidatedMigration.ts`
2. Updated the server initialization process to use the consolidated script
3. Updated npm scripts to use the consolidated script
4. Maintained backward compatibility with existing functionality

### Consolidated Migration Process

The consolidated migration process handles the following tasks in a structured, sequential manner:

1. **Run Pending Migrations**
   - Executes all pending TypeORM migrations
   - Handles errors and retries individual migrations if needed

2. **Ensure Database Structure**
   - Checks and fixes table structures
   - Ensures columns have the correct data types

3. **Fix Data Issues**
   - Fixes role timestamps
   - Handles other data consistency issues

4. **Initialize System Data**
   - Sets up system roles
   - Sets up system pages
   - Creates the super admin user

5. **Create Default Data**
   - Creates default users
   - Sets up leave types
   - Creates departments and positions
   - Initializes approval workflows
   - Creates test users for development

### Available Commands

- `npm run db:migrate` - Run all pending migrations
- `npm run db:reset` - Reset the database (drop and recreate)
- `npm run db:superadmin` - Reset or create the super admin user
- `npm run db:list-users` - List all users in the database
- `npm run db:show-roles` - Show all roles in the database
- `npm run db:manage-roles` - Create a new role
- `npm run db:fix` - Fix database schema and data issues
- `npm run db:fresh` - Reset the database, run migrations, and start the server

### Consolidated Scripts

The following scripts have been consolidated into the `consolidatedMigration.ts` file:

- `migrate.ts` - Migration runner
- `reset-db.ts` - Database reset script
- `reset-superadmin-runner.ts` - Super admin reset script
- `list-users-runner.ts` - List users script
- `show-roles-runner.ts` - Show roles script
- `databaseTools.ts` - Database tools script

All the functionality from these scripts has been incorporated into the consolidated migration process, making the database setup more streamlined and reliable.

### Benefits

- **Simplified Process**: One script handles all database initialization tasks
- **Improved Reliability**: Sequential execution with proper error handling
- **Better Maintainability**: Centralized logic makes future changes easier
- **Consistent State**: Ensures the database is in a consistent state after initialization

### Server Integration

The server automatically runs the consolidated migration process during startup, ensuring the database is properly initialized before accepting requests.