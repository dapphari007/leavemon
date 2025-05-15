import api from "./api";

export const getAllCustomApprovalWorkflows = async (params?: any) => {
  try {
    console.log("Fetching all custom approval workflows with params:", params);
    const response = await api.get("/custom-approval-workflows", { params });
    console.log("Received all custom approval workflows:", response.data);
    return response.data.customApprovalWorkflows;
  } catch (error) {
    console.error("Error fetching all custom approval workflows:", error);
    throw error;
  }
};

export const getCustomApprovalWorkflowById = async (id: string) => {
  try {
    console.log(`Fetching custom approval workflow with id: ${id}`);
    const response = await api.get(`/custom-approval-workflows/${id}`);
    console.log("Received custom approval workflow:", response.data);
    return response.data.customApprovalWorkflow;
  } catch (error) {
    console.error(`Error fetching custom approval workflow with id ${id}:`, error);
    throw error;
  }
};

export const createCustomApprovalWorkflow = async (data: any) => {
  try {
    console.log("Creating custom approval workflow with data:", data);
    const response = await api.post("/custom-approval-workflows", data);
    console.log("Custom approval workflow created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating custom approval workflow:", error);
    throw error;
  }
};

export const updateCustomApprovalWorkflow = async (id: string, data: any) => {
  try {
    console.log(`Updating custom approval workflow with id ${id} and data:`, data);
    const response = await api.put(`/custom-approval-workflows/${id}`, data);
    console.log("Custom approval workflow updated:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating custom approval workflow with id ${id}:`, error);
    throw error;
  }
};

export const deleteCustomApprovalWorkflow = async (id: string) => {
  try {
    console.log(`Deleting custom approval workflow with id: ${id}`);
    const response = await api.delete(`/custom-approval-workflows/${id}`);
    console.log("Custom approval workflow deleted:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting custom approval workflow with id ${id}:`, error);
    throw error;
  }
};

export const initializeDefaultCustomApprovalWorkflows = async () => {
  try {
    console.log("Initializing default custom approval workflows");
    const response = await api.post("/custom-approval-workflows/initialize-defaults");
    console.log("Default custom approval workflows initialized:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error initializing default custom approval workflows:", error);
    throw error;
  }
};