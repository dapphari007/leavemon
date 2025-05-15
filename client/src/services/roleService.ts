import api from "./api";
import config from "../config";
import axios from "axios";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: any;
}

/**
 * Fetch all roles from the server
 */
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const response = await axios.get(`${config.apiUrl}/roles`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    // Check if the response has a roles property (API might return { roles: [...] })
    const roles = response.data.roles || response.data;
    
    // Ensure we return an array
    return Array.isArray(roles) ? roles : [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
};

/**
 * Get a role by ID
 */
export const getRoleById = async (id: string): Promise<Role | null> => {
  try {
    const response = await axios.get(`${config.apiUrl}/roles/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data.role || response.data;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
};

/**
 * Create a new role
 */
export const createRole = async (roleData: Omit<Role, "id">): Promise<Role> => {
  const response = await axios.post(`${config.apiUrl}/roles`, roleData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data.role || response.data;
};

/**
 * Update an existing role
 */
export const updateRole = async (id: string, roleData: Partial<Omit<Role, "id">>): Promise<Role> => {
  const response = await axios.put(`${config.apiUrl}/roles/${id}`, roleData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data.role || response.data;
};

/**
 * Delete a role
 */
export const deleteRole = async (id: string): Promise<void> => {
  await axios.delete(`${config.apiUrl}/roles/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};