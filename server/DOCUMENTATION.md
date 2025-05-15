# Leave Management System Documentation

This document consolidates all documentation for the Leave Management System.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Database Management Tools](#database-management-tools)
3. [Database Migration Fixes](#database-migration-fixes)
4. [Database Fix Instructions](#database-fix-instructions)
5. [API Documentation](#api-documentation)

---

# Project Structure

This document provides an overview of the project structure for the Leave Management System.

## Project Overview

This is a comprehensive leave management system built with:
- **Backend**: Hapi.js, TypeORM, and PostgreSQL
- **Frontend**: React, TypeScript, Vite, and Tailwind CSS

The project follows a client-server architecture with separate frontend and backend codebases.

## Root Directory Structure

```
/
├── .gitignore
├── .vscode/                      # VS Code configuration
├── client/                       # Frontend React application
├── server/                       # Backend Hapi.js application
├── README.md                     # Project documentation
├── DATABASE-FIX-INSTRUCTIONS.md  # Instructions for database fixes
├── SUMMARY-OF-FIXES.md           # Summary of applied fixes
├── DATABASE-TOOLS-README.md      # Documentation for database tools
├── database-tools.js             # Comprehensive database management tool
├── db-quick.js                   # Simplified database management interface
├── check-data.js                 # Utility scripts for database operations
├── check-essential-data.js
├── direct-manage-roles.js
├── manage-roles.js
└── sync-data.js
```

## Server (Backend) Structure

```
server/
├── .dockerignore                 # Docker ignore file
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore file
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Docker configuration
├── init-db.sh                    # Database initialization script
├── leave_management_postman_collection.json  # Postman API collection
├── nodemon.json                  # Nodemon configuration
├── ormconfig.js                  # TypeORM configuration
├── package.json                  # Node.js dependencies and scripts
├── README.md                     # Backend documentation
├── tsconfig.json                 # TypeScript configuration
├── check-*.js                    # Various utility scripts
└── src/                          # Source code
    ├── config/                   # Configuration files
    ├── controllers/              # API controllers
    ├── docs/                     # Documentation
    ├── middlewares/              # Middleware functions
    ├── migrations/               # Database migrations
    ├── models/                   # Data models
    │   ├── ApprovalWorkflow.ts
    │   ├── Department.ts
    │   ├── Holiday.ts
    │   ├── index.ts
    │   ├── LeaveBalance.ts
    │   ├── LeaveRequest.ts
    │   ├── LeaveType.ts
    │   ├── Page.ts
    │   ├── Position.ts
    │   ├── Role.ts
    │   └── User.ts
    ├── plugins/                  # Hapi plugins
    ├── routes/                   # API routes
    ├── scripts/                  # Utility scripts
    │   └── createDefaultRoles.ts # Script to create default roles
    ├── server.ts                 # Main server entry point
    ├── services/                 # Business logic services
    └── utils/                    # Utility functions
```

## Client (Frontend) Structure

```
client/
├── .gitignore                    # Git ignore file
├── build_output.txt              # Build output log
├── eslint.config.js              # ESLint configuration
├── index.html                    # HTML entry point
├── package.json                  # Node.js dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── public/                       # Public assets
├── README.md                     # Frontend documentation
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.app.json             # TypeScript app configuration
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.node.json            # TypeScript Node configuration
├── vite.config.ts                # Vite configuration
└── src/                          # Source code
    ├── App.tsx                   # Main React component
    ├── assets/                   # Static assets
    ├── components/               # Reusable UI components
    ├── config.ts                 # Application configuration
    ├── context/                  # React context providers
    ├── hooks/                    # Custom React hooks
    ├── index.css                 # Global CSS
    ├── main.tsx                  # Application entry point
    ├── pages/                    # Application pages
    │   ├── admin/                # Admin pages
    │   │   ├── ApprovalWorkflowsPage.tsx
    │   │   ├── CreateApprovalWorkflowPage.tsx
    │   │   ├── CreateDepartmentPage.tsx
    │   │   ├── CreateHolidayPage.tsx
    │   │   ├── CreateLeaveTypePage.tsx
    │   │   ├── CreatePositionPage.tsx
    │   │   ├── CreateRolePage.tsx
    │   │   ├── CreateUserPage.tsx
    │   │   ├── DepartmentsPage.tsx
    │   │   ├── EditApprovalWorkflowPage.tsx
    │   │   ├── EditDepartmentPage.tsx
    │   │   ├── EditHolidayPage.tsx
    │   │   ├── EditLeaveTypePage.tsx
    │   │   ├── EditPositionPage.tsx
    │   │   ├── EditRolePage.tsx
    │   │   ├── EditUserPage.tsx
    │   │   ├── HolidaysPage.tsx
    │   │   ├── LeaveBalancesPage.tsx
    │   │   ├── LeaveTypeConfigPage.tsx
    │   │   ├── LeaveTypesPage.tsx
    │   │   ├── PositionsPage.tsx
    │   │   ├── RolesPage.tsx
    │   │   ├── SuperAdminDashboardPage.tsx
    │   │   ├── UsersPage.tsx
    │   │   └── WorkflowsPage.tsx
    │   ├── auth/                 # Authentication pages
    │   │   ├── CreateSuperAdmin.tsx
    │   │   ├── LoginDebugger.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── SimpleLoginForm.tsx
    │   │   ├── SuperAdminLoginInfo.tsx
    │   │   └── SuperAdminLoginPage.tsx
    │   ├── dashboard/            # Dashboard pages
    │   │   ├── DashboardPage.tsx
    │   │   └── HRDashboardPage.tsx
    │   ├── leaves/               # Leave management pages
    │   │   ├── ApplyLeavePage.tsx
    │   │   ├── LeaveCalendarPage.tsx
    │   │   ├── MyLeavesPage.tsx
    │   │   ├── TeamLeavesPage.tsx
    │   │   └── ViewLeaveRequestPage.tsx
    │   ├── profile/              # User profile pages
    │   │   └── ProfilePage.tsx
    │   ├── Departments.tsx
    │   ├── Positions.tsx
    │   └── Roles.tsx
    ├── services/                 # API service functions
    ├── types/                    # TypeScript type definitions
    ├── utils/                    # Utility functions
    └── vite-env.d.ts             # Vite environment types
```

## Technology Stack

### Backend
- **Framework**: Hapi.js
- **Database ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: JWT (@hapi/jwt)
- **Language**: TypeScript
- **Email**: Nodemailer
- **Logging**: Winston

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: React Context API
- **API Client**: Axios
- **Data Fetching**: TanStack React Query
- **UI Components**: 
  - Material UI (@mui/material)
  - Headless UI (@headlessui/react)
  - Heroicons (@heroicons/react)
- **Form Handling**: React Hook Form
- **Styling**: 
  - Tailwind CSS
  - Emotion (@emotion/react, @emotion/styled)
- **Date Handling**: date-fns
- **Routing**: React Router DOM

## Key Features

Based on the project structure, this Leave Management System appears to include:

1. **User Management**
   - User registration and authentication
   - Role-based access control
   - User profiles

2. **Organization Structure**
   - Departments management
   - Positions management
   - Roles and permissions

3. **Leave Management**
   - Leave types configuration
   - Leave requests and approvals
   - Leave balances tracking
   - Team leave calendar
   - Holiday management

4. **Approval Workflows**
   - Configurable approval processes
   - Multi-level approvals

5. **Dashboards**
   - Employee dashboard
   - HR dashboard
   - Admin dashboard

6. **System Administration**
   - System settings
   - Default data initialization
   - Database management tools

---

# Database Management Tools

This section describes the consolidated database management tools for the Leave Management System. The original scripts have been combined into two main files for easier maintenance and use.

## Available Tools

### 1. `database-tools.js` - Comprehensive Database Management

This script combines all database management functionality into a single file with a command-line interface.

```
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
```

#### Examples:

```bash
# Check database status
node database-tools.js check

# Test database connection
node database-tools.js test-connection

# Fix database issues
node database-tools.js fix

# Show all roles
node database-tools.js roles show

# Create a new role
node database-tools.js roles create "Project Manager" "Manages projects" '{"projects":{"create":true}}'

# Reset the database (caution: this will delete all data)
node database-tools.js reset
```

### 2. `db-quick.js` - Simplified Interface

This script provides a simplified interface for the most common database operations.

```
Usage:
  node db-quick.js <command>

Commands:
  check     - Check database status and fixes
  connect   - Test database connection
  fix       - Fix database issues
  reset     - Reset database (drop and recreate)
  roles     - Show all roles
  help      - Show this help message
```

## Original Scripts

The following original scripts have been consolidated:

1. `check-database-fixes.js` - Verify database fixes
2. `check-typeorm-connection.js` - Test database connection
3. `fix-database-and-migrations.js` - Fix database schema and migration issues
4. `fix-migrations.js` - Fix migration issues
5. `manage-roles-cli.js` - Manage roles from command line
6. `reset-database.js` - Reset the database
7. `sync-essential-data.js` - Sync essential data
8. `test-initialization.js` - Test system initialization

## Common Tasks

### Checking Database Status

To check if all database fixes are working properly:

```bash
node db-quick.js check
```

### Testing Database Connection

To test the database connection and view sample tables:

```bash
node database-tools.js test-connection
```

### Fixing Database Issues

To fix database schema and migration issues:

```bash
node db-quick.js fix
```

### Managing Roles

To view all roles in the database:

```bash
node db-quick.js roles
```

To create a new role with custom permissions:

```bash
node database-tools.js roles create "Role Name" "Role Description" '{"feature":{"create":true,"read":true}}'
```

### Resetting the Database

To completely reset the database (drop and recreate):

```bash
node db-quick.js reset
```

This will prompt for confirmation before proceeding.

## Advanced Usage

For more advanced operations, use the comprehensive `database-tools.js` script directly:

```bash
# Fix migration issues
node database-tools.js fix-migrations

# Synchronize essential data
node database-tools.js sync

# Test system initialization
node database-tools.js test-init
```

---

# Database Migration Fixes

## Issues Fixed

1. **Missing Timestamps in Roles Table**
   - Fixed the `null value in column "createdAt" of relation "roles" violates not-null constraint` error
   - Implemented automatic timestamp setting in all role-related operations

2. **Foreign Key Constraint Issues**
   - Resolved the `foreign key constraint "FK_users_roles" cannot be implemented` error
   - Fixed the order of table creation and constraint addition

3. **Missing Columns in Users Table**
   - Added `hrId` and `teamLeadId` columns to match the entity definition
   - Ensured all required columns exist with proper foreign key constraints

4. **Migration Order Problems**
   - Improved the migration process to handle errors better
   - Added proper error handling for migration name parsing

5. **UUID vs SERIAL Primary Key Inconsistency**
   - Updated the reset-database.js script to use UUID for roles table primary key
   - Ensured consistency between database schema and entity definitions

## Automatic Fixes Implemented

1. **Server Startup Fixes**
   - Added `fixRoleTimestamps.ts` script that runs during server startup
   - Enhanced `initializeSystemRoles` to ensure timestamps are set
   - Improved migration runner to detect and fix timestamp issues

2. **Consolidated Database Tools**
   - Created comprehensive `database-tools.js` script that combines all database management functionality
   - Created simplified `db-quick.js` interface for common operations
   - Scripts handle all database schema issues in one operation
   - Include verification of fixes with detailed logging

3. **Verification Commands**
   - Added `database-tools.js check` command to verify all fixes are working
   - Checks for proper timestamps, foreign keys, and columns
   - Provides clear output of what's working and what needs attention

## Verification Results

All fixes have been verified and are working correctly:

- ✅ Roles table exists with proper schema
- ✅ All roles have timestamps set correctly
- ✅ All required foreign key constraints are in place
- ✅ All required columns exist in the users table
- ✅ Key migrations are marked as completed

## Next Steps

1. Start the server normally with:
   ```
   cd server && npm run dev
   ```

2. The automatic fixes will run during server startup to ensure everything works correctly

3. If any issues persist, run the manual fix script:
   ```
   node fix-database-and-migrations.js
   ```

4. Use the verification script to check if all fixes are working:
   ```
   node check-database-fixes.js
   ```

---

# Database Fix Instructions

This document provides instructions for fixing the database migration issues in the leave management system.

## Issue Summary

The system is experiencing the following migration errors:

1. `foreign key constraint "FK_users_roles" cannot be implemented`
2. `column User.hrId does not exist`
3. Migration order issues causing tables to be referenced before they are created
4. Inconsistencies between the reset-database.js script and the migration files
5. `null value in column "createdAt" of relation "roles" violates not-null constraint`

## Fix Instructions

### Option 1: Automatic Fix (Recommended)

1. Run the new fix-database-and-migrations.js script:

```bash
node fix-database-and-migrations.js
```

This script will:
- Ensure the database exists
- Create all necessary tables with the correct schema
- Add required columns to the users table
- Mark problematic migrations as completed to prevent them from running again
- Set up default roles
- Fix missing timestamps in the roles table

2. Start your application normally after the fix is complete.

### Automatic Fixes on Server Startup

We've also implemented automatic fixes that run every time the server starts:

1. The server now checks for and fixes missing timestamps in the roles table before initializing system roles
2. The migration process has been improved to automatically detect and fix timestamp issues
3. All role creation and update functions now properly set timestamps

### Option 2: Manual Reset and Setup

If the automatic fix doesn't work, you can reset the database completely:

1. Run the reset-database.js script (which has been updated to use UUID for roles):

```bash
node reset-database.js
```

2. Run the fix-migrations.js script to handle any remaining issues:

```bash
node fix-migrations.js
```

3. Start your application normally.

## Explanation of Fixes

The following issues were addressed:

1. **UUID vs SERIAL Primary Key**: The reset-database.js script was creating the roles table with a SERIAL primary key, but the migrations expected a UUID. This has been fixed to use UUID consistently.

2. **Missing hrId and teamLeadId columns**: These columns were added to the users table schema to match the entity definition.

3. **Foreign Key Constraints**: The order of creating tables and adding foreign key constraints has been fixed to ensure tables exist before constraints are added.

4. **Migration Order**: The migration process has been improved to handle errors better and run migrations in the correct order.

5. **Missing Timestamps**: The roles table was missing required timestamps (createdAt and updatedAt), which caused not-null constraint violations. We've added automatic fixes to ensure these fields are always set.

## Automatic Fixes Implementation

We've implemented several automatic fixes that run during server startup:

1. **fixRoleTimestamps.ts**: A new script that checks for and fixes missing timestamps in the roles table.

2. **Enhanced initializeSystemRoles**: The system role initialization now ensures all roles have timestamps set before creating or updating roles.

3. **Improved Migration Process**: The migration runner now detects timestamp-related errors and automatically fixes them before retrying.

4. **Timestamp Setting in All Role Operations**: All functions that create or update roles now properly set the timestamp fields.

## Preventing Future Issues

To prevent similar issues in the future:

1. Always use the TypeORM migration system for schema changes instead of direct SQL scripts
2. Test migrations on a development database before applying to production
3. Keep entity definitions and database schema in sync
4. Use the provided reset and fix scripts when needed
5. When creating entities manually, ensure all required fields are set, including timestamps
6. Run the automatic fix script after major database changes

## Support

If you encounter any issues with these fixes, please contact the development team for assistance.

---

# API Documentation

The Leave Management System API provides endpoints for managing users, leave requests, departments, roles, and other system features. The API is documented using a Postman collection.

## API Collection

The full API collection is available in the `leave_management_postman_collection.json` file, which can be imported into Postman for testing and exploration.

## Main API Categories

1. **Health Check**
   - Check if the API is running

2. **Authentication**
   - Register new users
   - Login and get JWT token
   - Get and update user profile
   - Change password

3. **Users Management**
   - Create, read, update, and delete users
   - Filter users by role, active status, etc.

4. **Leave Management**
   - Apply for leave
   - Approve/reject leave requests
   - View leave history
   - Check leave balances

5. **Department Management**
   - Create and manage departments
   - Assign users to departments

6. **Role Management**
   - Create and manage roles
   - Assign permissions to roles

7. **Position Management**
   - Create and manage positions
   - Assign positions to users

8. **Holiday Management**
   - Create and manage holidays
   - View holiday calendar

9. **Approval Workflow Management**
   - Create and manage approval workflows
   - Assign workflows to leave types

## Using the API

1. Import the Postman collection
2. Set up environment variables:
   - `baseUrl`: The base URL of your API (e.g., `http://localhost:3000`)
   - `authToken`: Will be automatically set after successful login
   - `userId`: ID of a user for testing user-specific endpoints
   - `managerId`: ID of a manager for testing manager-specific endpoints

3. Start with the Health Check endpoint to ensure the API is running
4. Use the Register and Login endpoints to get an authentication token
5. Explore other endpoints as needed

## Authentication

Most endpoints require authentication using a JWT token. After logging in, the token will be automatically set in the Postman environment variables. For manual API calls, include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns standard HTTP status codes:
- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid or missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Server Error

Error responses include a message field with details about the error.