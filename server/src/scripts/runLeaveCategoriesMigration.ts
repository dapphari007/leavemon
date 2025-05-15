import { AppDataSource, initializeDatabase } from "../config/database";
import logger from "../utils/logger";

/**
 * Run the leave categories migration
 */
async function runLeaveCategoriesMigration() {
  try {
    logger.info("Starting leave categories migration...");

    // Initialize the database connection if not already initialized
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
      logger.info("Database connected successfully");
    }

    // Run the migration
    logger.info("Running leave categories migration...");
    await AppDataSource.runMigrations();
    logger.info("Leave categories migration completed successfully");

  } catch (error) {
    logger.error("Error running leave categories migration:", error);
    process.exit(1);
  } finally {
    // Close the connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("Database connection closed");
    }
    process.exit(0);
  }
}

// Run the migration
runLeaveCategoriesMigration();