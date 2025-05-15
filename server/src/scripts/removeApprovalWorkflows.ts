/**
 * Script to remove all approval workflows from the database
 * 
 * This script will find and delete all approval workflows in the system.
 * It can be run manually to ensure all workflows are removed.
 * 
 * Usage:
 *   ts-node src/scripts/removeApprovalWorkflows.ts
 */

import { AppDataSource } from "../config/database";
import { Client } from "pg";
import config from "../config/config";

const removeAllWorkflows = async (): Promise<void> => {
  // Create a direct database client
  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.database,
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Database connected successfully");
    
    // Check if the approval_workflows table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'approval_workflows'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (tableExists) {
      // Count the workflows
      const countResult = await client.query('SELECT COUNT(*) FROM approval_workflows');
      const workflowCount = parseInt(countResult.rows[0].count);
      
      if (workflowCount > 0) {
        // Get workflow names for logging
        const workflowsResult = await client.query('SELECT id, name FROM approval_workflows');
        console.log(`Found ${workflowCount} approval workflows to remove:`);
        
        workflowsResult.rows.forEach(workflow => {
          console.log(`- ${workflow.name} (ID: ${workflow.id})`);
        });
        
        // Delete all workflows
        await client.query('DELETE FROM approval_workflows');
        console.log(`Successfully removed ${workflowCount} approval workflows from the system.`);
      } else {
        console.log("No approval workflows found in the system.");
      }
    } else {
      console.log("The approval_workflows table does not exist in the database.");
    }
    
    console.log("Workflow removal process completed successfully.");
  } catch (error) {
    console.error("Error removing approval workflows:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    try {
      await client.end();
      console.log("Database connection closed");
    } catch (closeError) {
      console.error("Error closing database connection:", closeError);
    }
  }
};

// Run the script if it's called directly
if (require.main === module) {
  removeAllWorkflows()
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export default removeAllWorkflows;