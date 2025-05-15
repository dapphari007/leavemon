import api from "./api";

export const getAllCustomApprovalWorkflows = async (params?: any) => {
  const response = await api.get("/custom-approval-workflows", { params });
  return response.data.customApprovalWorkflows;
};

export const getCustomApprovalWorkflowById = async (id: string) => {
  const response = await api.get(`/custom-approval-workflows/${id}`);
  return response.data.customApprovalWorkflow;
};

export const createCustomApprovalWorkflow = async (data: any) => {
  const response = await api.post("/custom-approval-workflows", data);
  return response.data;
};

export const updateCustomApprovalWorkflow = async (id: string, data: any) => {
  const response = await api.put(`/custom-approval-workflows/${id}`, data);
  return response.data;
};

export const deleteCustomApprovalWorkflow = async (id: string) => {
  const response = await api.delete(`/custom-approval-workflows/${id}`);
  return response.data;
};

export const initializeDefaultCustomApprovalWorkflows = async () => {
  const response = await api.post("/custom-approval-workflows/initialize-defaults");
  return response.data;
};