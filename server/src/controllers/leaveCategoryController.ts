import { Request, ResponseToolkit } from "@hapi/hapi";
import { leaveCategoryService } from "../services";
import logger from "../utils/logger";

/**
 * Create a new leave category
 */
export const createLeaveCategory = async (request: Request, h: ResponseToolkit) => {
  try {
    const categoryData = request.payload as any;
    const leaveCategory = await leaveCategoryService.createLeaveCategory(categoryData);
    
    return h.response({
      success: true,
      leaveCategory,
    }).code(201);
  } catch (error: any) {
    logger.error(`Error in createLeaveCategory controller: ${error.message}`);
    return h.response({
      success: false,
      message: error.message,
    }).code(400);
  }
};

/**
 * Get all leave categories
 */
export const getAllLeaveCategories = async (request: Request, h: ResponseToolkit) => {
  try {
    const filters: any = {};
    const query = request.query as any;
    
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === "true";
    }
    
    const leaveCategories = await leaveCategoryService.getAllLeaveCategories(filters);
    
    return h.response({
      success: true,
      leaveCategories,
    }).code(200);
  } catch (error: any) {
    logger.error(`Error in getAllLeaveCategories controller: ${error.message}`);
    return h.response({
      success: false,
      message: error.message,
    }).code(400);
  }
};

/**
 * Get leave category by ID
 */
export const getLeaveCategoryById = async (request: Request, h: ResponseToolkit) => {
  try {
    const params = request.params as any;
    const leaveCategory = await leaveCategoryService.getLeaveCategoryById(params.id);
    
    return h.response({
      success: true,
      leaveCategory,
    }).code(200);
  } catch (error: any) {
    logger.error(`Error in getLeaveCategoryById controller: ${error.message}`);
    return h.response({
      success: false,
      message: error.message,
    }).code(404);
  }
};

/**
 * Update leave category
 */
export const updateLeaveCategory = async (request: Request, h: ResponseToolkit) => {
  try {
    const params = request.params as any;
    const categoryData = request.payload as any;
    const leaveCategory = await leaveCategoryService.updateLeaveCategory(params.id, categoryData);
    
    return h.response({
      success: true,
      leaveCategory,
    }).code(200);
  } catch (error: any) {
    logger.error(`Error in updateLeaveCategory controller: ${error.message}`);
    return h.response({
      success: false,
      message: error.message,
    }).code(400);
  }
};

/**
 * Delete leave category
 */
export const deleteLeaveCategory = async (request: Request, h: ResponseToolkit) => {
  try {
    const params = request.params as any;
    await leaveCategoryService.deleteLeaveCategory(params.id);
    
    return h.response({
      success: true,
      message: "Leave category deleted successfully",
    }).code(200);
  } catch (error: any) {
    logger.error(`Error in deleteLeaveCategory controller: ${error.message}`);
    return h.response({
      success: false,
      message: error.message,
    }).code(400);
  }
};

/**
 * Initialize default leave categories
 */
export const initializeDefaultLeaveCategories = async (request: Request, h: ResponseToolkit) => {
  try {
    await leaveCategoryService.initializeDefaultLeaveCategories();
    
    return h.response({
      success: true,
      message: "Default leave categories initialized successfully",
    }).code(200);
  } catch (error: any) {
    logger.error(`Error in initializeDefaultLeaveCategories controller: ${error.message}`);
    return h.response({
      success: false,
      message: error.message,
    }).code(400);
  }
};