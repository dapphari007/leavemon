import { AppDataSource, ensureDatabaseConnection } from "../config/database";
import { ApprovalWorkflow, CustomApprovalWorkflow, UserRole } from "../models";
import logger from "../utils/logger";

/**
 * Validates and fixes approval workflows
 * This script ensures all approval workflows are properly configured
 */
export const fixApprovalWorkflows = async () => {
  try {
    // Ensure database connection is established
    await ensureDatabaseConnection();
    logger.info("Starting approval workflow validation and fix");

    const approvalWorkflowRepository = AppDataSource.getRepository(ApprovalWorkflow);
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);

    // Get all approval workflows
    const approvalWorkflows = await approvalWorkflowRepository.find();
    logger.info(`Found ${approvalWorkflows.length} standard approval workflows`);

    // Check for default workflow
    const defaultWorkflow = approvalWorkflows.find(wf => wf.name === "Default Approval Workflow");
    
    if (!defaultWorkflow) {
      logger.info("Default approval workflow not found, creating it");
      
      // Create default workflow
      const newDefaultWorkflow = new ApprovalWorkflow();
      newDefaultWorkflow.name = "Default Approval Workflow";
      newDefaultWorkflow.minDays = 1;
      newDefaultWorkflow.maxDays = 30;
      newDefaultWorkflow.isActive = true;
      newDefaultWorkflow.approvalLevels = [
        {
          level: 1,
          approverType: "teamLead",
          roles: [UserRole.TEAM_LEAD]
        },
        {
          level: 2,
          approverType: "manager",
          roles: [UserRole.MANAGER]
        },
        {
          level: 3,
          approverType: "hr",
          roles: [UserRole.HR]
        }
      ];
      
      await approvalWorkflowRepository.save(newDefaultWorkflow);
      logger.info("Default approval workflow created successfully");
    } else {
      // Validate default workflow configuration
      if (!defaultWorkflow.approvalLevels || defaultWorkflow.approvalLevels.length === 0) {
        logger.info("Default workflow has invalid configuration, fixing it");
        
        defaultWorkflow.approvalLevels = [
          {
            level: 1,
            approverType: "teamLead",
            roles: [UserRole.TEAM_LEAD]
          },
          {
            level: 2,
            approverType: "manager",
            roles: [UserRole.MANAGER]
          },
          {
            level: 3,
            approverType: "hr",
            roles: [UserRole.HR]
          }
        ];
        
        await approvalWorkflowRepository.save(defaultWorkflow);
        logger.info("Default workflow configuration fixed");
      }
    }

    // Check for department-based workflow
    const departmentWorkflow = approvalWorkflows.find(wf => wf.name === "Department-Based Approval Workflow");
    
    if (!departmentWorkflow) {
      logger.info("Department-based approval workflow not found, creating it");
      
      // Create department-based workflow
      const newDepartmentWorkflow = new ApprovalWorkflow();
      newDepartmentWorkflow.name = "Department-Based Approval Workflow";
      newDepartmentWorkflow.minDays = 1;
      newDepartmentWorkflow.maxDays = 30;
      newDepartmentWorkflow.isActive = true;
      newDepartmentWorkflow.approvalLevels = [
        {
          level: 1,
          approverType: "teamLead",
          roles: [UserRole.TEAM_LEAD],
          departmentSpecific: true
        },
        {
          level: 2,
          approverType: "manager",
          roles: [UserRole.MANAGER],
          departmentSpecific: true
        },
        {
          level: 3,
          approverType: "hr",
          roles: [UserRole.HR]
        }
      ];
      
      await approvalWorkflowRepository.save(newDepartmentWorkflow);
      logger.info("Department-based approval workflow created successfully");
    } else {
      // Validate department workflow configuration
      if (!departmentWorkflow.approvalLevels || departmentWorkflow.approvalLevels.length === 0) {
        logger.info("Department-based workflow has invalid configuration, fixing it");
        
        departmentWorkflow.approvalLevels = [
          {
            level: 1,
            approverType: "teamLead",
            roles: [UserRole.TEAM_LEAD],
            departmentSpecific: true
          },
          {
            level: 2,
            approverType: "manager",
            roles: [UserRole.MANAGER],
            departmentSpecific: true
          },
          {
            level: 3,
            approverType: "hr",
            roles: [UserRole.HR]
          }
        ];
        
        await approvalWorkflowRepository.save(departmentWorkflow);
        logger.info("Department-based workflow configuration fixed");
      }
    }

    // Get all custom approval workflows
    const customWorkflows = await customApprovalWorkflowRepository.find();
    logger.info(`Found ${customWorkflows.length} custom approval workflows`);

    // Validate each custom workflow
    for (const workflow of customWorkflows) {
      if (!workflow.approvalLevels || workflow.approvalLevels.length === 0) {
        logger.info(`Custom workflow ${workflow.name} has invalid configuration, fixing it`);
        
        // Create default approval levels for custom workflow
        workflow.approvalLevels = [
          {
            level: 1,
            isRequired: true
          },
          {
            level: 2,
            isRequired: true
          }
        ];
        
        await customApprovalWorkflowRepository.save(workflow);
        logger.info(`Custom workflow ${workflow.name} configuration fixed`);
      }
    }

    logger.info("Approval workflow validation and fix completed successfully");
    return { success: true, message: "Approval workflows fixed successfully" };
  } catch (error) {
    logger.error("Error fixing approval workflows:", error);
    return { success: false, message: "Error fixing approval workflows", error };
  }
};

// Allow running this script directly
if (require.main === module) {
  fixApprovalWorkflows()
    .then(() => {
      logger.info("Approval workflow fix script completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Approval workflow fix script failed:", error);
      process.exit(1);
    });
}