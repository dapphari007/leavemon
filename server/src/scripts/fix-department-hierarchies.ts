import { AppDataSource, ensureDatabaseConnection } from "../config/database";
import { Department, User, UserRole } from "../models";
import logger from "../utils/logger";

/**
 * Validates and fixes department hierarchies
 * This script ensures all departments have proper manager assignments
 */
export const fixDepartmentHierarchies = async () => {
  try {
    // Ensure database connection is established
    await ensureDatabaseConnection();
    logger.info("Starting department hierarchy validation and fix");

    const departmentRepository = AppDataSource.getRepository(Department);
    const userRepository = AppDataSource.getRepository(User);

    // Get all departments
    const departments = await departmentRepository.find({
      relations: ["users"]
    });
    logger.info(`Found ${departments.length} departments to process`);

    // Process each department
    for (const department of departments) {
      logger.info(`Processing department: ${department.name}`);
      
      // Check if department has a manager assigned
      if (!department.managerId) {
        logger.info(`Department ${department.name} has no manager assigned`);
        
        // Find users in this department with manager role
        const departmentUsers = await userRepository.find({
          where: {
            departmentId: department.id
          }
        });
        
        // First try to find a user with MANAGER role in this department
        let potentialManager = departmentUsers.find(user => user.role === UserRole.MANAGER);
        
        // If no manager found, try to find a team lead
        if (!potentialManager) {
          potentialManager = departmentUsers.find(user => user.role === UserRole.TEAM_LEAD);
        }
        
        // If still no suitable user found, try to find any manager in the system
        if (!potentialManager) {
          potentialManager = await userRepository.findOne({
            where: {
              role: UserRole.MANAGER
            }
          });
        }
        
        // If a potential manager is found, assign them
        if (potentialManager) {
          department.managerId = potentialManager.id;
          department.manager = potentialManager;
          
          await departmentRepository.save(department);
          logger.info(`Assigned ${potentialManager.firstName} ${potentialManager.lastName} as manager for department ${department.name}`);
        } else {
          logger.warn(`Could not find a suitable manager for department ${department.name}`);
        }
      } else {
        // Verify that the assigned manager exists
        const manager = await userRepository.findOne({
          where: {
            id: department.managerId
          }
        });
        
        if (!manager) {
          logger.warn(`Department ${department.name} has an invalid manager ID: ${department.managerId}`);
          
          // Find a new manager
          const newManager = await userRepository.findOne({
            where: {
              role: UserRole.MANAGER
            }
          });
          
          if (newManager) {
            department.managerId = newManager.id;
            department.manager = newManager;
            
            await departmentRepository.save(department);
            logger.info(`Assigned new manager ${newManager.firstName} ${newManager.lastName} for department ${department.name}`);
          } else {
            logger.warn(`Could not find a replacement manager for department ${department.name}`);
          }
        } else {
          logger.info(`Department ${department.name} has valid manager: ${manager.firstName} ${manager.lastName}`);
        }
      }
    }

    logger.info("Department hierarchy validation and fix completed successfully");
    return { success: true, message: "Department hierarchies fixed successfully" };
  } catch (error) {
    logger.error("Error fixing department hierarchies:", error);
    return { success: false, message: "Error fixing department hierarchies", error };
  }
};

// Allow running this script directly
if (require.main === module) {
  fixDepartmentHierarchies()
    .then(() => {
      logger.info("Department hierarchy fix script completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Department hierarchy fix script failed:", error);
      process.exit(1);
    });
}