import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomApprovalWorkflowAndTopLevelPosition1720000000000 implements MigrationInterface {
    name = 'AddCustomApprovalWorkflowAndTopLevelPosition1720000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create approval_category_enum type if it doesn't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_category_enum') THEN
                    CREATE TYPE "approval_category_enum" AS ENUM('short_leave', 'medium_leave', 'long_leave');
                END IF;
            END
            $$;
        `);

        // Create top_level_positions table
        await queryRunner.query(`
            CREATE TABLE "top_level_positions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" character varying(255),
                "level" integer NOT NULL DEFAULT 1,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_top_level_positions" PRIMARY KEY ("id")
            )
        `);

        // Create custom_approval_workflows table
        await queryRunner.query(`
            CREATE TABLE "custom_approval_workflows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "category" "approval_category_enum" NOT NULL,
                "minDays" double precision NOT NULL,
                "maxDays" double precision NOT NULL,
                "departmentId" uuid,
                "positionId" uuid,
                "approvalLevels" jsonb NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "isDefault" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_custom_approval_workflows" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "custom_approval_workflows" 
            ADD CONSTRAINT "FK_custom_approval_workflows_departments" 
            FOREIGN KEY ("departmentId") REFERENCES "departments"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "custom_approval_workflows" 
            ADD CONSTRAINT "FK_custom_approval_workflows_positions" 
            FOREIGN KEY ("positionId") REFERENCES "positions"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "custom_approval_workflows" DROP CONSTRAINT IF EXISTS "FK_custom_approval_workflows_positions"`);
        await queryRunner.query(`ALTER TABLE "custom_approval_workflows" DROP CONSTRAINT IF EXISTS "FK_custom_approval_workflows_departments"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "custom_approval_workflows"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "top_level_positions"`);
        
        // We'll leave the enum type in place as it might be used by other tables
        // If we need to drop it in the future, we can do it in a separate migration
    }
}