import { MigrationInterface, QueryRunner } from "typeorm";
import logger from "../utils/logger";

export class ConsolidatedMigration1800000000000 implements MigrationInterface {
  name = "ConsolidatedMigration1800000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add UUID extension for PostgreSQL
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Create enum types if they don't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('super_admin', 'hr', 'manager', 'team_lead', 'employee');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_level_enum') THEN
          CREATE TYPE "user_level_enum" AS ENUM ('1', '2', '3', '4');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
          CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'other');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_status_enum') THEN
          CREATE TYPE "leave_request_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'partially_approved');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_type_enum') THEN
          CREATE TYPE "leave_request_type_enum" AS ENUM ('full_day', 'first_half', 'second_half');
        END IF;
      END
      $$;
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "permissions" text,
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create departments table
    await queryRunner.query(`
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
    await queryRunner.query(`
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

    // Create pages table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "slug" character varying(100) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "isSystem" boolean NOT NULL DEFAULT false,
        "configuration" text,
        "accessRoles" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_pages_name" UNIQUE ("name"),
        CONSTRAINT "UQ_pages_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_pages" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
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
        "department" character varying(100),
        "position" character varying(100),
        "roleId" uuid,
        "departmentId" uuid,
        "positionId" uuid,
        "hrId" uuid,
        "teamLeadId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create leave_types table with all columns
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        "defaultDays" integer NOT NULL,
        "isCarryForward" boolean NOT NULL DEFAULT false,
        "maxCarryForwardDays" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "applicableGender" character varying,
        "isHalfDayAllowed" boolean NOT NULL DEFAULT false,
        "isPaidLeave" boolean NOT NULL DEFAULT true,
        "daysAllowed" integer DEFAULT 0 NOT NULL,
        "isPaid" boolean DEFAULT false NOT NULL,
        "requiresApproval" boolean DEFAULT true NOT NULL,
        "color" varchar NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leave_types_name" UNIQUE ("name")
      )
    `);

    // Create leave_balances table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_balances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "leaveTypeId" uuid NOT NULL,
        "balance" numeric(5,1) NOT NULL,
        "used" numeric(5,1) NOT NULL DEFAULT 0,
        "carryForward" numeric(5,1) NOT NULL DEFAULT 0,
        "year" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_balances" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leave_balances_user_type_year" UNIQUE ("userId", "leaveTypeId", "year")
      )
    `);

    // Create leave_requests table with metadata column
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "leaveTypeId" uuid NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "requestType" "leave_request_type_enum" NOT NULL DEFAULT 'full_day',
        "numberOfDays" numeric(5,1) NOT NULL,
        "reason" character varying NOT NULL,
        "status" "leave_request_status_enum" NOT NULL DEFAULT 'pending',
        "approverId" uuid,
        "approverComments" character varying,
        "approvedAt" TIMESTAMP,
        "metadata" JSONB NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id")
      )
    `);

    // Create holidays table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "holidays" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "description" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_holidays" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_holidays_date" UNIQUE ("date")
      )
    `);

    // Create approval_workflows table with float type for minDays and maxDays
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "approval_workflows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "minDays" float NOT NULL,
        "maxDays" float NOT NULL,
        "approvalLevels" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_approval_workflows" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_approval_workflows_name" UNIQUE ("name")
      )
    `);

    // Add foreign key constraints
    // Users self-reference (manager)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_manager' 
          AND table_name = 'users'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_manager" 
          FOREIGN KEY ("managerId") 
          REFERENCES "users"("id") 
          ON DELETE SET NULL 
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Users self-reference (HR)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_hr' 
          AND table_name = 'users'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_hr" 
          FOREIGN KEY ("hrId") 
          REFERENCES "users"("id") 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);

    // Users self-reference (Team Lead)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_teamLead' 
          AND table_name = 'users'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_teamLead" 
          FOREIGN KEY ("teamLeadId") 
          REFERENCES "users"("id") 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        END IF;
      END
      $$;
    `);

    // Users to roles
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_roles' 
          AND table_name = 'users'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_roles" 
          FOREIGN KEY ("roleId") 
          REFERENCES "roles"("id") 
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Users to departments
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_departments' 
          AND table_name = 'users'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_departments" 
          FOREIGN KEY ("departmentId") 
          REFERENCES "departments"("id") 
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Users to positions
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_users_positions' 
          AND table_name = 'users'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "FK_users_positions" 
          FOREIGN KEY ("positionId") 
          REFERENCES "positions"("id") 
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Departments to users (manager)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_departments_users' 
          AND table_name = 'departments'
        ) THEN
          ALTER TABLE "departments" 
          ADD CONSTRAINT "FK_departments_users" 
          FOREIGN KEY ("managerId") 
          REFERENCES "users"("id") 
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Positions to departments
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_positions_departments' 
          AND table_name = 'positions'
        ) THEN
          ALTER TABLE "positions" 
          ADD CONSTRAINT "FK_positions_departments" 
          FOREIGN KEY ("departmentId") 
          REFERENCES "departments"("id") 
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Leave balances to users
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_leave_balances_user' 
          AND table_name = 'leave_balances'
        ) THEN
          ALTER TABLE "leave_balances" 
          ADD CONSTRAINT "FK_leave_balances_user" 
          FOREIGN KEY ("userId") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Leave balances to leave types
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_leave_balances_leave_type' 
          AND table_name = 'leave_balances'
        ) THEN
          ALTER TABLE "leave_balances" 
          ADD CONSTRAINT "FK_leave_balances_leave_type" 
          FOREIGN KEY ("leaveTypeId") 
          REFERENCES "leave_types"("id") 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Leave requests to users
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_leave_requests_user' 
          AND table_name = 'leave_requests'
        ) THEN
          ALTER TABLE "leave_requests" 
          ADD CONSTRAINT "FK_leave_requests_user" 
          FOREIGN KEY ("userId") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Leave requests to leave types
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_leave_requests_leave_type' 
          AND table_name = 'leave_requests'
        ) THEN
          ALTER TABLE "leave_requests" 
          ADD CONSTRAINT "FK_leave_requests_leave_type" 
          FOREIGN KEY ("leaveTypeId") 
          REFERENCES "leave_types"("id") 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Leave requests to approver (users)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_leave_requests_approver' 
          AND table_name = 'leave_requests'
        ) THEN
          ALTER TABLE "leave_requests" 
          ADD CONSTRAINT "FK_leave_requests_approver" 
          FOREIGN KEY ("approverId") 
          REFERENCES "users"("id") 
          ON DELETE SET NULL 
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_users_role'
        ) THEN
          CREATE INDEX "IDX_users_role" ON "users" ("role");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_users_manager'
        ) THEN
          CREATE INDEX "IDX_users_manager" ON "users" ("managerId");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_types_active'
        ) THEN
          CREATE INDEX "IDX_leave_types_active" ON "leave_types" ("isActive");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_balances_user'
        ) THEN
          CREATE INDEX "IDX_leave_balances_user" ON "leave_balances" ("userId");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_balances_leave_type'
        ) THEN
          CREATE INDEX "IDX_leave_balances_leave_type" ON "leave_balances" ("leaveTypeId");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_balances_year'
        ) THEN
          CREATE INDEX "IDX_leave_balances_year" ON "leave_balances" ("year");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_requests_user'
        ) THEN
          CREATE INDEX "IDX_leave_requests_user" ON "leave_requests" ("userId");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_requests_leave_type'
        ) THEN
          CREATE INDEX "IDX_leave_requests_leave_type" ON "leave_requests" ("leaveTypeId");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_requests_status'
        ) THEN
          CREATE INDEX "IDX_leave_requests_status" ON "leave_requests" ("status");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_leave_requests_dates'
        ) THEN
          CREATE INDEX "IDX_leave_requests_dates" ON "leave_requests" ("startDate", "endDate");
        END IF;
      END
      $$;
    `);

    // Create Department-Based Approval Workflow
    try {
      // Check if the workflow already exists
      const existingWorkflow = await queryRunner.query(`
        SELECT id FROM approval_workflows
        WHERE name = 'Department-Based Approval Workflow'
      `);

      if (existingWorkflow.length === 0) {
        // Create a new department-specific approval workflow
        await queryRunner.query(`
          INSERT INTO approval_workflows (
            id, 
            name, 
            "minDays", 
            "maxDays", 
            "approvalLevels", 
            "isActive", 
            "createdAt", 
            "updatedAt"
          ) 
          VALUES (
            uuid_generate_v4(), 
            'Department-Based Approval Workflow', 
            1, 
            30, 
            '[
              {
                "level": 1,
                "approverType": "teamLead",
                "fallbackRoles": ["team_lead"]
              },
              {
                "level": 2,
                "approverType": "departmentHead",
                "fallbackRoles": ["manager"]
              },
              {
                "level": 3,
                "approverType": "hr",
                "fallbackRoles": ["hr"]
              }
            ]'::jsonb, 
            true, 
            NOW(), 
            NOW()
          )
        `);
        logger.info("Department-Based Approval Workflow created successfully.");
      }
    } catch (error) {
      logger.error("Error creating Department-Based Approval Workflow:", error);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to avoid foreign key constraint issues
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_balances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "holidays"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "approval_workflows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "positions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_types"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "leave_request_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "leave_request_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);

    // Drop UUID extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}