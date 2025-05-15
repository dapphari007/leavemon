import { Request, ResponseToolkit } from "@hapi/hapi";
import { AppDataSource } from "../config/database";
import { Client, UserRole, UserLevel } from "../models";
import {
  hashPassword,
  comparePassword,
  validateEmail,
  validatePassword,
} from "../utils/auth";
import logger from "../utils/logger";

// Generate JWT token for client
const generateClientToken = (client: Client): string => {
  const { id, email } = client;

  const token = require("@hapi/jwt").token.generate(
    {
      aud: "leave-management-app",
      iss: "leave-management-api",
      id,
      email,
      role: UserRole.CLIENT, // Add a CLIENT role to UserRole enum
      level: UserLevel.LEVEL_1, // Use a default level
    },
    {
      key: process.env.JWT_SECRET || "your_jwt_secret_key",
      algorithm: "HS256",
    },
    {
      ttlSec: 14 * 24 * 60 * 60, // 14 days
    }
  );

  return token;
};

export const registerClient = async (request: Request, h: ResponseToolkit) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connection initialized in registerClient");
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address,
      gender,
    } = request.payload as any;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return h
        .response({
          message: "First name, last name, email, and password are required",
        })
        .code(400);
    }

    if (!validateEmail(email)) {
      return h.response({ message: "Invalid email format" }).code(400);
    }

    if (!validatePassword(password)) {
      return h
        .response({
          message:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
        })
        .code(400);
    }

    // Check if client already exists
    const clientRepository = AppDataSource.getRepository(Client);
    const existingClient = await clientRepository.findOne({ where: { email } });

    if (existingClient) {
      return h
        .response({ message: "Client with this email already exists" })
        .code(409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new client
    const client = new Client();
    client.firstName = firstName;
    client.lastName = lastName;
    client.email = email;
    client.password = hashedPassword;
    client.phoneNumber = phoneNumber;
    client.address = address;
    client.gender = gender;

    // Save client to database
    const savedClient = await clientRepository.save(client);

    // Remove password from response
    const { password: _, ...clientWithoutPassword } = savedClient;

    return h
      .response({
        message: "Client registered successfully",
        client: clientWithoutPassword,
      })
      .code(201);
  } catch (error) {
    logger.error(`Error in registerClient: ${error}`);
    return h
      .response({ message: "An error occurred while registering the client" })
      .code(500);
  }
};

export const loginClient = async (request: Request, h: ResponseToolkit) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connection initialized in loginClient");
    }

    const { email, password } = request.payload as any;

    // Validate input
    if (!email || !password) {
      return h
        .response({ message: "Email and password are required" })
        .code(400);
    }

    // Find client by email
    const clientRepository = AppDataSource.getRepository(Client);
    const client = await clientRepository.findOne({ where: { email } });

    if (!client) {
      return h.response({ message: "Invalid email or password" }).code(401);
    }

    // Check if client is active
    if (!client.isActive) {
      return h
        .response({
          message:
            "Your account has been deactivated. Please contact an administrator.",
        })
        .code(403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, client.password);

    if (!isPasswordValid) {
      return h.response({ message: "Invalid email or password" }).code(401);
    }

    // Generate JWT token
    const token = generateClientToken(client);

    // Remove password from response
    const { password: _, ...clientWithoutPassword } = client;

    return h
      .response({
        message: "Login successful",
        token,
        client: clientWithoutPassword,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in loginClient: ${error}`);
    return h
      .response({ message: "An error occurred while logging in" })
      .code(500);
  }
};

export const getClientProfile = async (request: Request, h: ResponseToolkit) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connection initialized in getClientProfile");
    }

    const clientId = request.auth.credentials.id;

    // Find client by ID
    const clientRepository = AppDataSource.getRepository(Client);
    const client = await clientRepository.findOne({
      where: { id: clientId as string },
    });

    if (!client) {
      return h.response({ message: "Client not found" }).code(404);
    }

    // Remove password from response
    const { password, ...clientWithoutPassword } = client;

    return h
      .response({
        client: clientWithoutPassword,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in getClientProfile: ${error}`);
    return h
      .response({
        message: "An error occurred while fetching the client profile",
      })
      .code(500);
  }
};

export const updateClientProfile = async (request: Request, h: ResponseToolkit) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Database connection initialized in updateClientProfile");
    }

    const clientId = request.auth.credentials.id;
    const { firstName, lastName, phoneNumber, address } =
      request.payload as any;

    // Find client by ID
    const clientRepository = AppDataSource.getRepository(Client);
    const client = await clientRepository.findOne({
      where: { id: clientId as string },
    });

    if (!client) {
      return h.response({ message: "Client not found" }).code(404);
    }

    // Update client fields
    if (firstName) client.firstName = firstName;
    if (lastName) client.lastName = lastName;
    if (phoneNumber) client.phoneNumber = phoneNumber;
    if (address) client.address = address;

    // Save updated client
    const updatedClient = await clientRepository.save(client);

    // Remove password from response
    const { password, ...clientWithoutPassword } = updatedClient;

    return h
      .response({
        message: "Profile updated successfully",
        client: clientWithoutPassword,
      })
      .code(200);
  } catch (error) {
    logger.error(`Error in updateClientProfile: ${error}`);
    return h
      .response({
        message: "An error occurred while updating the client profile",
      })
      .code(500);
  }
};