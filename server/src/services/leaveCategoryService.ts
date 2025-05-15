import { AppDataSource } from "../config/database";
import { LeaveCategory, CustomApprovalWorkflow, ApprovalCategory } from "../models";
import logger from "../utils/logger";

/**
 * Create a new leave category
 */
export const createLeaveCategory = async (
  categoryData: Partial<LeaveCategory>
): Promise<LeaveCategory> => {
  try {
    const leaveCategoryRepository = AppDataSource.getRepository(LeaveCategory);

    // Check if category with name already exists
    const existingCategory = await leaveCategoryRepository.findOne({
      where: { name: categoryData.name },
    });

    if (existingCategory) {
      throw new Error("Leave category with this name already exists");
    }

    // Create new leave category
    const leaveCategory = leaveCategoryRepository.create(categoryData);
    return await leaveCategoryRepository.save(leaveCategory);
  } catch (error) {
    logger.error(`Error in createLeaveCategory service: ${error}`);
    throw error;
  }
};

/**
 * Get all leave categories
 */
export const getAllLeaveCategories = async (
  filters: { isActive?: boolean } = {}
): Promise<LeaveCategory[]> => {
  try {
    const leaveCategoryRepository = AppDataSource.getRepository(LeaveCategory);

    // Build query
    const query: any = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // Get leave categories
    return await leaveCategoryRepository.find({
      where: query,
      order: {
        name: "ASC",
      },
    });
  } catch (error) {
    logger.error(`Error in getAllLeaveCategories service: ${error}`);
    throw error;
  }
};

/**
 * Get leave category by ID
 */
export const getLeaveCategoryById = async (
  categoryId: string
): Promise<LeaveCategory> => {
  try {
    const leaveCategoryRepository = AppDataSource.getRepository(LeaveCategory);

    // Find leave category by ID
    const leaveCategory = await leaveCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!leaveCategory) {
      throw new Error("Leave category not found");
    }

    return leaveCategory;
  } catch (error) {
    logger.error(`Error in getLeaveCategoryById service: ${error}`);
    throw error;
  }
};

/**
 * Update leave category
 */
export const updateLeaveCategory = async (
  categoryId: string,
  categoryData: Partial<LeaveCategory>
): Promise<LeaveCategory> => {
  try {
    const leaveCategoryRepository = AppDataSource.getRepository(LeaveCategory);

    // Find leave category by ID
    const leaveCategory = await leaveCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!leaveCategory) {
      throw new Error("Leave category not found");
    }

    // If name is being updated, check if it's already in use
    if (categoryData.name && categoryData.name !== leaveCategory.name) {
      const existingCategory = await leaveCategoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (existingCategory) {
        throw new Error("Leave category name is already in use");
      }
    }

    // Update leave category data
    leaveCategoryRepository.merge(leaveCategory, categoryData);

    // Save updated leave category
    return await leaveCategoryRepository.save(leaveCategory);
  } catch (error) {
    logger.error(`Error in updateLeaveCategory service: ${error}`);
    throw error;
  }
};

/**
 * Delete leave category
 */
export const deleteLeaveCategory = async (
  categoryId: string
): Promise<void> => {
  try {
    const leaveCategoryRepository = AppDataSource.getRepository(LeaveCategory);
    const customWorkflowRepository = AppDataSource.getRepository(CustomApprovalWorkflow);

    // Find leave category by ID
    const leaveCategory = await leaveCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!leaveCategory) {
      throw new Error("Leave category not found");
    }

    // Check if category is used in any workflows
    const workflowsUsingCategory = await customWorkflowRepository.count({
      where: { leaveCategoryId: categoryId },
    });

    if (workflowsUsingCategory > 0) {
      throw new Error("Cannot delete category that is used in approval workflows");
    }

    // Delete leave category
    await leaveCategoryRepository.remove(leaveCategory);
  } catch (error) {
    logger.error(`Error in deleteLeaveCategory service: ${error}`);
    throw error;
  }
};

/**
 * Initialize default leave categories
 */
export const initializeDefaultLeaveCategories = async (): Promise<void> => {
  try {
    const leaveCategoryRepository = AppDataSource.getRepository(LeaveCategory);

    // Check if default categories already exist
    const existingCategories = await leaveCategoryRepository.find();
    
    if (existingCategories.length === 0) {
      // Create default categories
      const defaultCategories = [
        {
          name: "Short Leave",
          description: "Leave requests for 0.5 to 2 days",
          defaultMinDays: 0.5,
          defaultMaxDays: 2,
          maxApprovalLevels: 2,
          isActive: true,
          isDefault: true
        },
        {
          name: "Medium Leave",
          description: "Leave requests for 3 to 6 days",
          defaultMinDays: 3,
          defaultMaxDays: 6,
          maxApprovalLevels: 3,
          isActive: true,
          isDefault: false
        },
        {
          name: "Long Leave",
          description: "Leave requests for 7 or more days",
          defaultMinDays: 7,
          defaultMaxDays: 30,
          maxApprovalLevels: 4,
          isActive: true,
          isDefault: false
        }
      ];

      for (const category of defaultCategories) {
        const newCategory = leaveCategoryRepository.create(category);
        await leaveCategoryRepository.save(newCategory);
      }
    }
  } catch (error) {
    logger.error(`Error in initializeDefaultLeaveCategories service: ${error}`);
    throw error;
  }
};