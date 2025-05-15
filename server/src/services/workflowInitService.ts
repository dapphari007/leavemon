import { AppDataSource } from "../config/database";
import { ApprovalWorkflow } from "../models";
import logger from "../utils/logger";

/**
 * Initialize default approval workflows if they don't exist
 * 
 * Note: This function has been modified to remove all existing workflows
 * as per the new requirements to remove all approval workflows from the system.
 */
export const initializeWorkflows = async (): Promise<void> => {
  try {
    logger.info("Removing all approval workflows from the system...");
    
    const workflowRepository = AppDataSource.getRepository(ApprovalWorkflow);
    
    // Find all existing workflows
    let existingWorkflows: ApprovalWorkflow[] = [];
    try {
      existingWorkflows = await workflowRepository.find();
      
      if (existingWorkflows.length > 0) {
        // Remove all existing workflows
        await workflowRepository.remove(existingWorkflows);
        logger.info(`Successfully removed ${existingWorkflows.length} approval workflows from the system.`);
      } else {
        logger.info("No approval workflows found in the system.");
      }
    } catch (error) {
      logger.error(`Error removing approval workflows: ${error}`);
    }
    
    logger.info("Approval workflow removal completed.");
  } catch (error) {
    logger.error(`Error in workflow initialization: ${error}`);
    // Don't throw the error, just log it, so the server can continue starting up
  }
};