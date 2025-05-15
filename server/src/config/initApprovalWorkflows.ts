import { AppDataSource } from "./database";
import { ApprovalWorkflow } from "../models";
import logger from "../utils/logger";

/**
 * Initialize department-specific approval workflows if they don't exist
 * 
 * Note: This function has been modified to not create any workflows
 * as per the new requirements to remove all approval workflows.
 */
export const initApprovalWorkflows = async (): Promise<void> => {
  try {
    // Ensure database connection is established
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    logger.info('Approval workflow initialization skipped - workflows have been removed from the system');
  } catch (error) {
    logger.error(`Error in approval workflows initialization: ${error}`);
  }
};