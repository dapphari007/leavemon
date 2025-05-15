import { AppDataSource, ensureDatabaseConnection } from "../config/database";
import { Position, Department } from "../models";
import logger from "../utils/logger";

/**
 * Synchronizes positions with departments and creates default positions if needed
 */
export const syncPositions = async () => {
  try {
    // Ensure database connection is established
    await ensureDatabaseConnection();
    logger.info("Starting position synchronization");

    const positionRepository = AppDataSource.getRepository(Position);
    const departmentRepository = AppDataSource.getRepository(Department);

    // Get all departments
    const departments = await departmentRepository.find();
    logger.info(`Found ${departments.length} departments`);

    // Default positions to create for each department
    const defaultPositions = [
      { name: "Department Head", level: 4, description: "Head of the department" },
      { name: "Manager", level: 3, description: "Manager position" },
      { name: "Team Lead", level: 2, description: "Team leader position" },
      { name: "Senior Employee", level: 2, description: "Senior employee position" },
      { name: "Employee", level: 1, description: "Regular employee position" },
      { name: "Junior Employee", level: 1, description: "Junior employee position" },
      { name: "Intern", level: 1, description: "Intern position" }
    ];

    // Create default positions for each department
    for (const department of departments) {
      logger.info(`Processing department: ${department.name}`);
      
      for (const positionData of defaultPositions) {
        // Check if position already exists for this department
        const existingPosition = await positionRepository.findOne({
          where: {
            name: positionData.name,
            departmentId: department.id
          }
        });

        if (!existingPosition) {
          // Create new position
          const position = new Position();
          position.name = positionData.name;
          position.description = positionData.description;
          position.level = positionData.level;
          position.departmentId = department.id;
          position.isActive = true;

          await positionRepository.save(position);
          logger.info(`Created position '${position.name}' for department '${department.name}'`);
        } else {
          logger.info(`Position '${positionData.name}' already exists for department '${department.name}'`);
        }
      }
    }

    // Create department-independent positions
    const generalPositions = [
      { name: "CEO", level: 5, description: "Chief Executive Officer" },
      { name: "CTO", level: 5, description: "Chief Technology Officer" },
      { name: "CFO", level: 5, description: "Chief Financial Officer" },
      { name: "COO", level: 5, description: "Chief Operations Officer" },
      { name: "HR Director", level: 4, description: "Human Resources Director" },
      { name: "HR Manager", level: 3, description: "Human Resources Manager" },
      { name: "HR Specialist", level: 2, description: "Human Resources Specialist" }
    ];

    for (const positionData of generalPositions) {
      // Check if position already exists
      const existingPosition = await positionRepository.findOne({
        where: {
          name: positionData.name,
          departmentId: null
        }
      });

      if (!existingPosition) {
        // Create new position
        const position = new Position();
        position.name = positionData.name;
        position.description = positionData.description;
        position.level = positionData.level;
        position.departmentId = null;
        position.isActive = true;

        await positionRepository.save(position);
        logger.info(`Created general position '${position.name}'`);
      } else {
        logger.info(`General position '${positionData.name}' already exists`);
      }
    }

    logger.info("Position synchronization completed successfully");
    return { success: true, message: "Positions synchronized successfully" };
  } catch (error) {
    logger.error("Error synchronizing positions:", error);
    return { success: false, message: "Error synchronizing positions", error };
  }
};

// Allow running this script directly
if (require.main === module) {
  syncPositions()
    .then(() => {
      logger.info("Position synchronization script completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Position synchronization script failed:", error);
      process.exit(1);
    });
}