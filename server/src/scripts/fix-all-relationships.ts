import { syncPositions } from "./sync-positions";
import { fixUserPositions } from "./fix-user-positions";
import { fixDepartmentHierarchies } from "./fix-department-hierarchies";
import { fixApprovalWorkflows } from "./fix-approval-workflows";
import logger from "../utils/logger";

/**
 * Runs all fix scripts in the correct order to repair database relationships
 */
export const fixAllRelationships = async () => {
  try {
    logger.info("Starting comprehensive relationship fix process");

    // Step 1: Sync positions to ensure all necessary positions exist
    logger.info("Step 1: Synchronizing positions");
    const positionsResult = await syncPositions();
    if (!positionsResult.success) {
      logger.error("Position synchronization failed:", positionsResult.error);
      return { success: false, message: "Position synchronization failed", error: positionsResult.error };
    }
    logger.info("Position synchronization completed successfully");

    // Step 2: Fix department hierarchies
    logger.info("Step 2: Fixing department hierarchies");
    const departmentResult = await fixDepartmentHierarchies();
    if (!departmentResult.success) {
      logger.error("Department hierarchy fix failed:", departmentResult.error);
      return { success: false, message: "Department hierarchy fix failed", error: departmentResult.error };
    }
    logger.info("Department hierarchy fix completed successfully");

    // Step 3: Fix user-position-department relationships
    logger.info("Step 3: Fixing user position and department relationships");
    const userPositionResult = await fixUserPositions();
    if (!userPositionResult.success) {
      logger.error("User position fix failed:", userPositionResult.error);
      return { success: false, message: "User position fix failed", error: userPositionResult.error };
    }
    logger.info("User position fix completed successfully");

    // Step 4: Fix approval workflows
    logger.info("Step 4: Fixing approval workflows");
    const workflowResult = await fixApprovalWorkflows();
    if (!workflowResult.success) {
      logger.error("Approval workflow fix failed:", workflowResult.error);
      return { success: false, message: "Approval workflow fix failed", error: workflowResult.error };
    }
    logger.info("Approval workflow fix completed successfully");

    logger.info("All relationship fixes completed successfully");
    return { 
      success: true, 
      message: "All relationship fixes completed successfully",
      results: {
        positions: positionsResult,
        departments: departmentResult,
        userPositions: userPositionResult,
        workflows: workflowResult
      }
    };
  } catch (error) {
    logger.error("Error in fix all relationships process:", error);
    return { success: false, message: "Error in fix all relationships process", error };
  }
};

// Allow running this script directly
if (require.main === module) {
  fixAllRelationships()
    .then((result) => {
      if (result.success) {
        logger.info("Fix all relationships script completed successfully");
      } else {
        logger.error("Fix all relationships script failed:", result.message);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      logger.error("Fix all relationships script encountered an error:", error);
      process.exit(1);
    });
}