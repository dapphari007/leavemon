import { AppDataSource, ensureDatabaseConnection } from "../config/database";
import { User, Position, Department, UserRole } from "../models";
import logger from "../utils/logger";

/**
 * Fixes user-position-department relationships
 * This script ensures all users have proper position and department assignments
 */
export const fixUserPositions = async () => {
  try {
    // Ensure database connection is established
    await ensureDatabaseConnection();
    logger.info("Starting user position and department fix");

    const userRepository = AppDataSource.getRepository(User);
    const positionRepository = AppDataSource.getRepository(Position);
    const departmentRepository = AppDataSource.getRepository(Department);

    // Get all users
    const users = await userRepository.find();
    logger.info(`Found ${users.length} users to process`);

    // Get all positions and departments for reference
    const allPositions = await positionRepository.find();
    const allDepartments = await departmentRepository.find();

    logger.info(`Found ${allPositions.length} positions and ${allDepartments.length} departments`);

    // Create default department if none exists
    let defaultDepartment = allDepartments.find(d => d.name === "General");
    if (!defaultDepartment && allDepartments.length === 0) {
      defaultDepartment = new Department();
      defaultDepartment.name = "General";
      defaultDepartment.description = "General department for users without specific department";
      defaultDepartment.isActive = true;
      await departmentRepository.save(defaultDepartment);
      logger.info("Created default 'General' department");
    } else if (!defaultDepartment && allDepartments.length > 0) {
      defaultDepartment = allDepartments[0];
    }

    // Process each user
    for (const user of users) {
      let needsUpdate = false;
      const updates: any = {};

      // 1. Check if user has a department string but no departmentId
      if (user.department && !user.departmentId) {
        // Try to find matching department by name
        const matchingDepartment = allDepartments.find(
          d => d.name.toLowerCase() === user.department.toLowerCase()
        );

        if (matchingDepartment) {
          updates.departmentId = matchingDepartment.id;
          updates.departmentObj = matchingDepartment;
          logger.info(`Assigning department ${matchingDepartment.name} to user ${user.firstName} ${user.lastName}`);
          needsUpdate = true;
        } else if (defaultDepartment) {
          // Assign default department if no match found
          updates.departmentId = defaultDepartment.id;
          updates.departmentObj = defaultDepartment;
          logger.info(`Assigning default department to user ${user.firstName} ${user.lastName}`);
          needsUpdate = true;
        }
      } else if (!user.department && !user.departmentId && defaultDepartment) {
        // User has no department at all, assign default
        updates.departmentId = defaultDepartment.id;
        updates.departmentObj = defaultDepartment;
        updates.department = defaultDepartment.name;
        logger.info(`Assigning default department to user ${user.firstName} ${user.lastName} who had no department`);
        needsUpdate = true;
      }

      // 2. Check if user has a position string but no positionId
      if (user.position && !user.positionId) {
        // First try to find position in the user's department
        let matchingPosition = null;
        
        if (updates.departmentId || user.departmentId) {
          const departmentId = updates.departmentId || user.departmentId;
          matchingPosition = allPositions.find(
            p => p.name.toLowerCase() === user.position.toLowerCase() && 
                 p.departmentId === departmentId
          );
        }
        
        // If not found in department, try to find any position with matching name
        if (!matchingPosition) {
          matchingPosition = allPositions.find(
            p => p.name.toLowerCase() === user.position.toLowerCase()
          );
        }

        if (matchingPosition) {
          updates.positionId = matchingPosition.id;
          updates.positionObj = matchingPosition;
          logger.info(`Assigning position ${matchingPosition.name} to user ${user.firstName} ${user.lastName}`);
          needsUpdate = true;
        } else {
          // Try to infer position based on role
          let positionName = "Employee";
          
          switch (user.role) {
            case UserRole.SUPER_ADMIN:
              positionName = "CEO";
              break;
            case UserRole.MANAGER:
              positionName = "Manager";
              break;
            case UserRole.HR:
              positionName = "HR Specialist";
              break;
            case UserRole.TEAM_LEAD:
              positionName = "Team Lead";
              break;
            default:
              positionName = "Employee";
          }
          
          // Find position by inferred name
          const inferredPosition = allPositions.find(p => p.name === positionName);
          
          if (inferredPosition) {
            updates.positionId = inferredPosition.id;
            updates.positionObj = inferredPosition;
            updates.position = inferredPosition.name;
            logger.info(`Inferring position ${inferredPosition.name} for user ${user.firstName} ${user.lastName} based on role ${user.role}`);
            needsUpdate = true;
          }
        }
      } else if (!user.position && !user.positionId) {
        // User has no position at all, assign based on role
        let positionName = "Employee";
        
        switch (user.role) {
          case UserRole.SUPER_ADMIN:
            positionName = "CEO";
            break;
          case UserRole.MANAGER:
            positionName = "Manager";
            break;
          case UserRole.HR:
            positionName = "HR Specialist";
            break;
          case UserRole.TEAM_LEAD:
            positionName = "Team Lead";
            break;
          default:
            positionName = "Employee";
        }
        
        // Find position by inferred name
        const inferredPosition = allPositions.find(p => p.name === positionName);
        
        if (inferredPosition) {
          updates.positionId = inferredPosition.id;
          updates.positionObj = inferredPosition;
          updates.position = inferredPosition.name;
          logger.info(`Assigning position ${inferredPosition.name} to user ${user.firstName} ${user.lastName} who had no position`);
          needsUpdate = true;
        }
      }

      // Update user if needed
      if (needsUpdate) {
        Object.assign(user, updates);
        await userRepository.save(user);
        logger.info(`Updated user ${user.firstName} ${user.lastName}`);
      }
    }

    logger.info("User position and department fix completed successfully");
    return { success: true, message: "User positions and departments fixed successfully" };
  } catch (error) {
    logger.error("Error fixing user positions and departments:", error);
    return { success: false, message: "Error fixing user positions and departments", error };
  }
};

// Allow running this script directly
if (require.main === module) {
  fixUserPositions()
    .then(() => {
      logger.info("User position fix script completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("User position fix script failed:", error);
      process.exit(1);
    });
}