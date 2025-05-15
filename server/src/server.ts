import Hapi from "@hapi/hapi";
import Joi from "joi";
import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";
import {
  initializeDatabase,
  ensureDatabaseConnection,
  AppDataSource,
} from "./config/database";
import config from "./config/config";
import logger from "./utils/logger";
import { runConsolidatedMigration } from "./scripts/consolidatedMigration";

const init = async () => {
  try {
    // Initialize database connection with retry mechanism
    let retries = 5;
    while (retries > 0) {
      try {
        await initializeDatabase();
        logger.info("Database connected successfully");
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        logger.warn(
          `Database connection failed, retrying... (${retries} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
      }
    }

    // Default data will be set up by the consolidated migration process

    // Create Hapi server
    const server = Hapi.server({
      port: config.server.port,
      host: config.server.host,
      routes: {
        cors: {
          origin: ["http://localhost:5173"], // Allow the Vite dev server
          credentials: true,
          additionalHeaders: ["Authorization", "Content-Type"],
          additionalExposedHeaders: ["Authorization"],
          maxAge: 86400, // 24 hours
        },
        validate: {
          failAction: async (request, h, err) => {
            const error = err as Error;
            if (process.env.NODE_ENV === "production") {
              // In production, log the error but return a generic message
              logger.error(
                `Validation error: ${error?.message || "Unknown error"}`
              );
              throw new Error(`Invalid request payload input`);
            } else {
              // During development, log and respond with the full error
              logger.error(
                `Validation error: ${error?.message || "Unknown error"}`
              );
              throw error;
            }
          },
        },
      },
    });

    // Register plugins
    await registerPlugins(server);

    // Register routes
    registerRoutes(server);

    // Run consolidated migration process
    try {
      logger.info("Starting consolidated migration process...");
      await runConsolidatedMigration(false); // Don't close the connection
      logger.info("Consolidated migration process completed");
      
      // Add a small delay to ensure database is in a consistent state
      logger.info("Waiting for database to stabilize...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      logger.error("Error in consolidated migration process:", error);
      // Continue server startup even if migration fails
      logger.warn("Server will continue to start despite migration issues");
    }

    // Set up database connection health check
    const dbHealthCheck = setInterval(async () => {
      try {
        if (!AppDataSource.isInitialized) {
          logger.warn("Database connection lost, attempting to reconnect...");
          await ensureDatabaseConnection();
        } else {
          // Test the connection with a simple query
          try {
            await AppDataSource.query("SELECT 1");
          } catch (error) {
            logger.warn("Database connection test failed, reconnecting...");
            await ensureDatabaseConnection();
          }
        }
      } catch (error) {
        logger.error("Database health check failed:", error);
      }
    }, 30000); // Check every 30 seconds

    // Start server
    await server.start();
    logger.info(`Server running on ${server.info.uri}`);
    
    // System is already initialized by the consolidated migration process

    // Handle unhandled rejections
    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled rejection:", err);
      clearInterval(dbHealthCheck);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down server...");
      await server.stop();
      clearInterval(dbHealthCheck);
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exit(0);
    });

    return server;
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  init();
}

export default init;

// Export consolidated migration function for easy access
export { runConsolidatedMigration };
