import { ServerRoute } from "@hapi/hapi";
import { exec } from "child_process";
import path from "path";
import logger from "../utils/logger";
import { fixAllRelationships } from "../scripts/fix-all-relationships";
import { syncPositions } from "../scripts/sync-positions";
import { fixUserPositions } from "../scripts/fix-user-positions";
import { fixDepartmentHierarchies } from "../scripts/fix-department-hierarchies";
import { fixApprovalWorkflows } from "../scripts/fix-approval-workflows";

const scriptRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/api/scripts/run-role-script",
    handler: async (request, h) => {
      try {
        const { command } = request.payload as any;
        
        if (!command || typeof command !== "string") {
          return h.response({ message: "Invalid command" }).code(400);
        }
        
        // Validate command to prevent command injection
        const allowedCommands = ["show", "create"];
        const commandParts = command.split(" ");
        
        if (!allowedCommands.includes(commandParts[0])) {
          return h.response({ message: "Invalid command" }).code(400);
        }
        
        // Build the full command
        const scriptPath = path.resolve(__dirname, "../../../direct-manage-roles.js");
        const fullCommand = `node ${scriptPath} ${command}`;
        
        // Execute the command
        const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
          exec(fullCommand, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
              logger.error(`Error executing script: ${error.message}`);
              reject(error);
              return;
            }
            resolve({ stdout, stderr });
          });
        });
        
        return h.response({
          message: "Script executed successfully",
          output: result.stdout,
          error: result.stderr,
        }).code(200);
      } catch (error) {
        logger.error(`Error in run-role-script: ${error}`);
        return h.response({ 
          message: "An error occurred while executing the script",
          error: error.message
        }).code(500);
      }
    },
    options: {
      auth: "super_admin",
      description: "Run role management script",
      tags: ["api", "scripts"],
    },
  },
  
  // Fix all relationships route
  {
    method: "POST",
    path: "/api/scripts/fix-all-relationships",
    handler: async (request, h) => {
      try {
        logger.info("Starting fix-all-relationships script");
        
        const result = await fixAllRelationships();
        
        return h.response({
          message: result.success ? "Relationships fixed successfully" : "Failed to fix relationships",
          success: result.success,
          details: result
        }).code(result.success ? 200 : 500);
      } catch (error) {
        logger.error(`Error in fix-all-relationships: ${error}`);
        return h.response({ 
          message: "An error occurred while fixing relationships",
          error: error.message
        }).code(500);
      }
    },
    options: {
      auth: "super_admin",
      description: "Fix all database relationships",
      tags: ["api", "scripts"],
    },
  },
  
  // Sync positions route
  {
    method: "POST",
    path: "/api/scripts/sync-positions",
    handler: async (request, h) => {
      try {
        logger.info("Starting sync-positions script");
        
        const result = await syncPositions();
        
        return h.response({
          message: result.success ? "Positions synchronized successfully" : "Failed to synchronize positions",
          success: result.success,
          details: result
        }).code(result.success ? 200 : 500);
      } catch (error) {
        logger.error(`Error in sync-positions: ${error}`);
        return h.response({ 
          message: "An error occurred while synchronizing positions",
          error: error.message
        }).code(500);
      }
    },
    options: {
      auth: "super_admin",
      description: "Synchronize positions",
      tags: ["api", "scripts"],
    },
  },
  
  // Fix user positions route
  {
    method: "POST",
    path: "/api/scripts/fix-user-positions",
    handler: async (request, h) => {
      try {
        logger.info("Starting fix-user-positions script");
        
        const result = await fixUserPositions();
        
        return h.response({
          message: result.success ? "User positions fixed successfully" : "Failed to fix user positions",
          success: result.success,
          details: result
        }).code(result.success ? 200 : 500);
      } catch (error) {
        logger.error(`Error in fix-user-positions: ${error}`);
        return h.response({ 
          message: "An error occurred while fixing user positions",
          error: error.message
        }).code(500);
      }
    },
    options: {
      auth: "super_admin",
      description: "Fix user positions",
      tags: ["api", "scripts"],
    },
  },
  
  // Fix department hierarchies route
  {
    method: "POST",
    path: "/api/scripts/fix-department-hierarchies",
    handler: async (request, h) => {
      try {
        logger.info("Starting fix-department-hierarchies script");
        
        const result = await fixDepartmentHierarchies();
        
        return h.response({
          message: result.success ? "Department hierarchies fixed successfully" : "Failed to fix department hierarchies",
          success: result.success,
          details: result
        }).code(result.success ? 200 : 500);
      } catch (error) {
        logger.error(`Error in fix-department-hierarchies: ${error}`);
        return h.response({ 
          message: "An error occurred while fixing department hierarchies",
          error: error.message
        }).code(500);
      }
    },
    options: {
      auth: "super_admin",
      description: "Fix department hierarchies",
      tags: ["api", "scripts"],
    },
  },
  
  // Fix approval workflows route
  {
    method: "POST",
    path: "/api/scripts/fix-approval-workflows",
    handler: async (request, h) => {
      try {
        logger.info("Starting fix-approval-workflows script");
        
        const result = await fixApprovalWorkflows();
        
        return h.response({
          message: result.success ? "Approval workflows fixed successfully" : "Failed to fix approval workflows",
          success: result.success,
          details: result
        }).code(result.success ? 200 : 500);
      } catch (error) {
        logger.error(`Error in fix-approval-workflows: ${error}`);
        return h.response({ 
          message: "An error occurred while fixing approval workflows",
          error: error.message
        }).code(500);
      }
    },
    options: {
      auth: "super_admin",
      description: "Fix approval workflows",
      tags: ["api", "scripts"],
    },
  },
];

export default scriptRoutes;