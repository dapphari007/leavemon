import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeaveCategories1715749800000 implements MigrationInterface {
    name = 'CreateLeaveCategories1715749800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create leave_categories table
        await queryRunner.query(`
            CREATE TABLE "leave_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "defaultMinDays" double precision NOT NULL,
                "defaultMaxDays" double precision NOT NULL,
                "maxApprovalLevels" integer NOT NULL DEFAULT 3,
                "isActive" boolean NOT NULL DEFAULT true,
                "isDefault" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_leave_categories_id" PRIMARY KEY ("id")
            )
        `);

        // Add leaveCategoryId column to custom_approval_workflows table
        await queryRunner.query(`
            ALTER TABLE "custom_approval_workflows" 
            ADD COLUMN "leaveCategoryId" uuid
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "custom_approval_workflows"
            ADD CONSTRAINT "FK_custom_approval_workflows_leave_categories"
            FOREIGN KEY ("leaveCategoryId") 
            REFERENCES "leave_categories"("id")
            ON DELETE SET NULL
        `);

        // Insert default leave categories
        await queryRunner.query(`
            INSERT INTO "leave_categories" 
            ("name", "description", "defaultMinDays", "defaultMaxDays", "maxApprovalLevels", "isActive", "isDefault")
            VALUES 
            ('Short Leave', 'Leave requests for 0.5 to 2 days', 0.5, 2, 2, true, true),
            ('Medium Leave', 'Leave requests for 3 to 6 days', 3, 6, 3, true, false),
            ('Long Leave', 'Leave requests for 7 or more days', 7, 30, 4, true, false)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "custom_approval_workflows" 
            DROP CONSTRAINT "FK_custom_approval_workflows_leave_categories"
        `);

        // Remove leaveCategoryId column from custom_approval_workflows
        await queryRunner.query(`
            ALTER TABLE "custom_approval_workflows" 
            DROP COLUMN "leaveCategoryId"
        `);

        // Drop leave_categories table
        await queryRunner.query(`DROP TABLE "leave_categories"`);
    }
}