import { Request, ResponseToolkit } from "@hapi/hapi";
import { AppDataSource } from "../config/database";
import { CustomApprovalWorkflow, ApprovalCategory, Department, Position, TopLevelPosition } from "../models";
import logger from "../utils/logger";
import { LessThanOrEqual, MoreThanOrEqual, Not, IsNull } from "typeorm";

// Default approval categories configuration
export const DEFAULT_APPROVAL_CATEGORIES = [
  {
    name: "Short Leave",
    category: ApprovalCategory.SHORT_LEAVE,
    minDays: 0.5,
    maxDays: 2,
    approvalLevels: [
      {
        level: 1,
        isRequired: true,
      }
    ],
    isDefault: true,
  },
  {
    name: "Medium Leave",
    category: ApprovalCategory.MEDIUM_LEAVE,
    minDays: 3,
    maxDays: 6,
    approvalLevels: [
      {
        level: 1,
        isRequired: true,
      },
      {
        level: 2,
        isRequired: true,
      }
    ],
    isDefault: true,
  },
  {
    name: "Long Leave",
    category: ApprovalCategory.LONG_LEAVE,
    minDays: 7,
    maxDays: 30,
    approvalLevels: [
      {
        level: 1,
        isRequired: true,
      },
      {
        level: 2,
        isRequired: true,
      },
      {
        level: 3,
        isRequired: true,
      }
    ],
    isDefault: true,
  }
];

export const createCustomApprovalWorkflow = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { 
      name, 
      description, 
      category, 
      leaveCategoryId,
      minDays, 
      maxDays, 
      departmentId, 
      positionId, 
      approvalLevels, 
      isActive,
      isDefault 
    } = request.payload as any;

    // Validate input
    if (
      !name ||
      (!category && !leaveCategoryId) ||
      minDays === undefined ||
      maxDays === undefined ||
      !approvalLevels
    ) {
      return h
        .response({
          message: "Name, category or leaveCategoryId, minDays, maxDays, and approvalLevels are required",
        })
        .code(400);
    }

    if (minDays < 0 || maxDays < 0) {
      return h
        .response({ message: "minDays and maxDays must be non-negative" })
        .code(400);
    }
    
    // Validate that minDays is either a whole number or 0.5 (half day)
    if (minDays !== Math.floor(minDays) && minDays !== 0.5) {
      return h
        .response({ message: "minDays must be either a whole number or 0.5 for half-day" })
        .code(400);
    }

    if (minDays > maxDays) {
      return h
        .response({ message: "minDays cannot be greater than maxDays" })
        .code(400);
    }

    if (!Array.isArray(approvalLevels) || approvalLevels.length === 0) {
      return h
        .response({ message: "approvalLevels must be a non-empty array" })
        .code(400);
    }

    // Validate approval levels
    for (const level of approvalLevels) {
      if (!level.level) {
        return h
          .response({
            message: "Each approval level must have a level number",
          })
          .code(400);
      }
    }

    // Check if department exists if departmentId is provided
    if (departmentId) {
      const departmentRepository = AppDataSource.getRepository(Department);
      const department = await departmentRepository.findOne({
        where: { id: departmentId },
      });

      if (!department) {
        return h.response({ message: "Department not found" }).code(404);
      }
    }

    // Check if position exists if positionId is provided
    if (positionId) {
      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({
        where: { id: positionId },
      });

      if (!position) {
        return h.response({ message: "Position not found" }).code(404);
      }
    }

    // Check for overlapping workflows with the same category, department, and position
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);
    
    let overlappingQuery: any = {
      category,
      minDays: LessThanOrEqual(maxDays),
      maxDays: MoreThanOrEqual(minDays),
    };

    // Add department and position filters if provided
    if (departmentId) {
      overlappingQuery.departmentId = departmentId;
    } else {
      overlappingQuery.departmentId = IsNull();
    }

    if (positionId) {
      overlappingQuery.positionId = positionId;
    } else {
      overlappingQuery.positionId = IsNull();
    }

    const overlappingWorkflows = await customApprovalWorkflowRepository.find({
      where: overlappingQuery,
    });

    if (overlappingWorkflows.length > 0) {
      return h
        .response({
          message: "This workflow overlaps with an existing workflow for the same category, department, and position",
        })
        .code(409);
    }

    // Create new custom approval workflow
    const customApprovalWorkflow = new CustomApprovalWorkflow();
    customApprovalWorkflow.name = name;
    customApprovalWorkflow.description = description || null;
    customApprovalWorkflow.category = category; // Keep for backward compatibility
    customApprovalWorkflow.leaveCategoryId = leaveCategoryId || null;
    customApprovalWorkflow.minDays = minDays;
    customApprovalWorkflow.maxDays = maxDays;
    customApprovalWorkflow.departmentId = departmentId || null;
    customApprovalWorkflow.positionId = positionId || null;
    customApprovalWorkflow.approvalLevels = approvalLevels;
    customApprovalWorkflow.isActive = isActive !== undefined ? isActive : true;
    customApprovalWorkflow.isDefault = isDefault !== undefined ? isDefault : false;

    // Save custom approval workflow to database
    const savedCustomApprovalWorkflow = await customApprovalWorkflowRepository.save(
      customApprovalWorkflow
    );

    return h
      .response({
        message: "Custom approval workflow created successfully",
        customApprovalWorkflow: savedCustomApprovalWorkflow,
      })
      .code(201);
  } catch (error) {
    logger.error(`Error in createCustomApprovalWorkflow: ${error}`);
    return h
      .response({
        message: "An error occurred while creating the custom approval workflow",
        error: error.message,
      })
      .code(500);
  }
};

export const getAllCustomApprovalWorkflows = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { isActive, category, departmentId, positionId } = request.query as any;

    // Build query
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);
    let query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (category) {
      query.category = category;
    }

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (positionId) {
      query.positionId = positionId;
    }

    // Get custom approval workflows
    const customApprovalWorkflows = await customApprovalWorkflowRepository.find({
      where: query,
      relations: ["department", "position", "leaveCategory"],
      order: {
        category: "ASC",
        minDays: "ASC",
      },
    });

    return h
      .response({
        customApprovalWorkflows,
        count: customApprovalWorkflows.length,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in getAllCustomApprovalWorkflows: ${error}`);
    return h
      .response({
        message: "An error occurred while fetching custom approval workflows",
        error: error.message,
      })
      .code(500);
  }
};

export const getCustomApprovalWorkflowById = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { id } = request.params;

    // Get custom approval workflow
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);
    const customApprovalWorkflow = await customApprovalWorkflowRepository.findOne({
      where: { id },
      relations: ["department", "position", "leaveCategory"],
    });

    if (!customApprovalWorkflow) {
      return h.response({ message: "Custom approval workflow not found" }).code(404);
    }

    return h
      .response({
        customApprovalWorkflow,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in getCustomApprovalWorkflowById: ${error}`);
    return h
      .response({
        message: "An error occurred while fetching the custom approval workflow",
        error: error.message,
      })
      .code(500);
  }
};

export const updateCustomApprovalWorkflow = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { id } = request.params;
    const { 
      name, 
      description, 
      category, 
      leaveCategoryId,
      minDays, 
      maxDays, 
      departmentId, 
      positionId, 
      approvalLevels, 
      isActive,
      isDefault 
    } = request.payload as any;

    // Get custom approval workflow
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);
    const customApprovalWorkflow = await customApprovalWorkflowRepository.findOne({
      where: { id },
    });

    if (!customApprovalWorkflow) {
      return h.response({ message: "Custom approval workflow not found" }).code(404);
    }

    // Validate approval levels if provided
    if (approvalLevels) {
      if (!Array.isArray(approvalLevels) || approvalLevels.length === 0) {
        return h
          .response({ message: "approvalLevels must be a non-empty array" })
          .code(400);
      }

      for (const level of approvalLevels) {
        if (!level.level) {
          return h
            .response({
              message: "Each approval level must have a level number",
            })
            .code(400);
        }
      }
    }

    // Check if department exists if departmentId is provided
    if (departmentId) {
      const departmentRepository = AppDataSource.getRepository(Department);
      const department = await departmentRepository.findOne({
        where: { id: departmentId },
      });

      if (!department) {
        return h.response({ message: "Department not found" }).code(404);
      }
    }

    // Check if position exists if positionId is provided
    if (positionId) {
      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({
        where: { id: positionId },
      });

      if (!position) {
        return h.response({ message: "Position not found" }).code(404);
      }
    }

    // Check for overlapping workflows if changing category, leaveCategoryId, min/max days, department, or position
    if (
      (category !== undefined && category !== customApprovalWorkflow.category) ||
      (leaveCategoryId !== undefined && leaveCategoryId !== customApprovalWorkflow.leaveCategoryId) ||
      (minDays !== undefined && minDays !== customApprovalWorkflow.minDays) ||
      (maxDays !== undefined && maxDays !== customApprovalWorkflow.maxDays) ||
      (departmentId !== undefined && departmentId !== customApprovalWorkflow.departmentId) ||
      (positionId !== undefined && positionId !== customApprovalWorkflow.positionId)
    ) {
      const newCategory = category !== undefined ? category : customApprovalWorkflow.category;
      const newMinDays = minDays !== undefined ? minDays : customApprovalWorkflow.minDays;
      const newMaxDays = maxDays !== undefined ? maxDays : customApprovalWorkflow.maxDays;
      const newDepartmentId = departmentId !== undefined ? departmentId : customApprovalWorkflow.departmentId;
      const newPositionId = positionId !== undefined ? positionId : customApprovalWorkflow.positionId;

      if (newMinDays < 0 || newMaxDays < 0) {
        return h
          .response({ message: "minDays and maxDays must be non-negative" })
          .code(400);
      }
      
      // Validate that minDays is either a whole number or 0.5 (half day)
      if (newMinDays !== Math.floor(newMinDays) && newMinDays !== 0.5) {
        return h
          .response({ message: "minDays must be either a whole number or 0.5 for half-day" })
          .code(400);
      }

      if (newMinDays > newMaxDays) {
        return h
          .response({ message: "minDays cannot be greater than maxDays" })
          .code(400);
      }

      let overlappingQuery: any = {
        id: Not(id),
        category: newCategory,
        minDays: LessThanOrEqual(newMaxDays),
        maxDays: MoreThanOrEqual(newMinDays),
      };

      // Add department and position filters if provided
      if (newDepartmentId) {
        overlappingQuery.departmentId = newDepartmentId;
      } else {
        overlappingQuery.departmentId = IsNull();
      }

      if (newPositionId) {
        overlappingQuery.positionId = newPositionId;
      } else {
        overlappingQuery.positionId = IsNull();
      }

      const overlappingWorkflows = await customApprovalWorkflowRepository.find({
        where: overlappingQuery,
      });

      if (overlappingWorkflows.length > 0) {
        return h
          .response({
            message: "This workflow would overlap with an existing workflow for the same category, department, and position",
          })
          .code(409);
      }
    }

    // Update custom approval workflow fields
    if (name) customApprovalWorkflow.name = name;
    if (description !== undefined) customApprovalWorkflow.description = description;
    if (category) customApprovalWorkflow.category = category;
    if (leaveCategoryId !== undefined) customApprovalWorkflow.leaveCategoryId = leaveCategoryId;
    if (minDays !== undefined) customApprovalWorkflow.minDays = minDays;
    if (maxDays !== undefined) customApprovalWorkflow.maxDays = maxDays;
    if (departmentId !== undefined) customApprovalWorkflow.departmentId = departmentId;
    if (positionId !== undefined) customApprovalWorkflow.positionId = positionId;
    if (approvalLevels) customApprovalWorkflow.approvalLevels = approvalLevels;
    if (isActive !== undefined) customApprovalWorkflow.isActive = isActive;
    if (isDefault !== undefined) customApprovalWorkflow.isDefault = isDefault;

    // Save updated custom approval workflow
    const updatedCustomApprovalWorkflow = await customApprovalWorkflowRepository.save(
      customApprovalWorkflow
    );

    return h
      .response({
        message: "Custom approval workflow updated successfully",
        customApprovalWorkflow: updatedCustomApprovalWorkflow,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in updateCustomApprovalWorkflow: ${error}`);
    return h
      .response({
        message: "An error occurred while updating the custom approval workflow",
        error: error.message,
      })
      .code(500);
  }
};

export const deleteCustomApprovalWorkflow = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { id } = request.params;

    // Get custom approval workflow
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);
    const customApprovalWorkflow = await customApprovalWorkflowRepository.findOne({
      where: { id },
    });

    if (!customApprovalWorkflow) {
      return h.response({ message: "Custom approval workflow not found" }).code(404);
    }

    // Delete custom approval workflow
    await customApprovalWorkflowRepository.remove(customApprovalWorkflow);

    return h
      .response({
        message: "Custom approval workflow deleted successfully",
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in deleteCustomApprovalWorkflow: ${error}`);
    return h
      .response({
        message: "An error occurred while deleting the custom approval workflow",
        error: error.message,
      })
      .code(500);
  }
};

/**
 * Initialize default custom approval workflows based on leave categories
 */
export const initializeDefaultCustomApprovalWorkflows = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const customApprovalWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);

    // Check if there are existing default workflows
    const existingDefaultWorkflows = await customApprovalWorkflowRepository.find({
      where: { isDefault: true }
    });

    // If there are existing default workflows, delete them first
    if (existingDefaultWorkflows.length > 0) {
      await customApprovalWorkflowRepository.remove(existingDefaultWorkflows);
    }

    // Create default custom approval workflows
    const createdWorkflows = [];

    for (const workflowConfig of DEFAULT_APPROVAL_CATEGORIES) {
      const workflow = new CustomApprovalWorkflow();
      workflow.name = workflowConfig.name;
      workflow.category = workflowConfig.category;
      workflow.minDays = workflowConfig.minDays;
      workflow.maxDays = workflowConfig.maxDays;
      workflow.approvalLevels = workflowConfig.approvalLevels;
      workflow.isActive = true;
      workflow.isDefault = true;

      const savedWorkflow = await customApprovalWorkflowRepository.save(workflow);
      createdWorkflows.push(savedWorkflow);
    }

    return h
      .response({
        message: "Default custom approval workflows initialized successfully",
        workflows: createdWorkflows,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in initializeDefaultCustomApprovalWorkflows: ${error}`);
    return h
      .response({
        message:
          "An error occurred while initializing default custom approval workflows",
        error: error.message,
      })
      .code(500);
  }
};