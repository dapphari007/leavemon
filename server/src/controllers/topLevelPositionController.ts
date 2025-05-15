import { Request, ResponseToolkit } from "@hapi/hapi";
import { AppDataSource } from "../config/database";
import { TopLevelPosition } from "../models";
import logger from "../utils/logger";

export const createTopLevelPosition = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { name, description, level, isActive } = request.payload as any;

    // Validate input
    if (!name) {
      return h
        .response({
          message: "Name is required",
        })
        .code(400);
    }

    if (level !== undefined && level < 1) {
      return h
        .response({ message: "Level must be a positive integer" })
        .code(400);
    }

    // Create new top level position
    const topLevelPosition = new TopLevelPosition();
    topLevelPosition.name = name;
    topLevelPosition.description = description || null;
    topLevelPosition.level = level || 1;
    topLevelPosition.isActive = isActive !== undefined ? isActive : true;

    // Save top level position to database
    const topLevelPositionRepository = AppDataSource.getRepository(TopLevelPosition);
    const savedTopLevelPosition = await topLevelPositionRepository.save(
      topLevelPosition
    );

    return h
      .response({
        message: "Top level position created successfully",
        topLevelPosition: savedTopLevelPosition,
      })
      .code(201);
  } catch (error) {
    logger.error(`Error in createTopLevelPosition: ${error}`);
    return h
      .response({
        message: "An error occurred while creating the top level position",
        error: error.message,
      })
      .code(500);
  }
};

export const getAllTopLevelPositions = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { isActive } = request.query as any;

    // Build query
    const topLevelPositionRepository = AppDataSource.getRepository(TopLevelPosition);
    let query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Get top level positions
    const topLevelPositions = await topLevelPositionRepository.find({
      where: query,
      order: {
        level: "ASC",
        name: "ASC",
      },
    });

    return h
      .response({
        topLevelPositions,
        count: topLevelPositions.length,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in getAllTopLevelPositions: ${error}`);
    return h
      .response({
        message: "An error occurred while fetching top level positions",
        error: error.message,
      })
      .code(500);
  }
};

export const getTopLevelPositionById = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { id } = request.params;

    // Get top level position
    const topLevelPositionRepository = AppDataSource.getRepository(TopLevelPosition);
    const topLevelPosition = await topLevelPositionRepository.findOne({
      where: { id },
    });

    if (!topLevelPosition) {
      return h.response({ message: "Top level position not found" }).code(404);
    }

    return h
      .response({
        topLevelPosition,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in getTopLevelPositionById: ${error}`);
    return h
      .response({
        message: "An error occurred while fetching the top level position",
        error: error.message,
      })
      .code(500);
  }
};

export const updateTopLevelPosition = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { id } = request.params;
    const { name, description, level, isActive } = request.payload as any;

    // Get top level position
    const topLevelPositionRepository = AppDataSource.getRepository(TopLevelPosition);
    const topLevelPosition = await topLevelPositionRepository.findOne({
      where: { id },
    });

    if (!topLevelPosition) {
      return h.response({ message: "Top level position not found" }).code(404);
    }

    // Validate level if provided
    if (level !== undefined && level < 1) {
      return h
        .response({ message: "Level must be a positive integer" })
        .code(400);
    }

    // Update top level position fields
    if (name) topLevelPosition.name = name;
    if (description !== undefined) topLevelPosition.description = description;
    if (level !== undefined) topLevelPosition.level = level;
    if (isActive !== undefined) topLevelPosition.isActive = isActive;

    // Save updated top level position
    const updatedTopLevelPosition = await topLevelPositionRepository.save(
      topLevelPosition
    );

    return h
      .response({
        message: "Top level position updated successfully",
        topLevelPosition: updatedTopLevelPosition,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in updateTopLevelPosition: ${error}`);
    return h
      .response({
        message: "An error occurred while updating the top level position",
        error: error.message,
      })
      .code(500);
  }
};

export const deleteTopLevelPosition = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { id } = request.params;

    // Get top level position
    const topLevelPositionRepository = AppDataSource.getRepository(TopLevelPosition);
    const topLevelPosition = await topLevelPositionRepository.findOne({
      where: { id },
    });

    if (!topLevelPosition) {
      return h.response({ message: "Top level position not found" }).code(404);
    }

    // Delete top level position
    await topLevelPositionRepository.remove(topLevelPosition);

    return h
      .response({
        message: "Top level position deleted successfully",
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in deleteTopLevelPosition: ${error}`);
    return h
      .response({
        message: "An error occurred while deleting the top level position",
        error: error.message,
      })
      .code(500);
  }
};