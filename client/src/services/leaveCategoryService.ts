import api from "./api";

export const getAllLeaveCategories = async (params?: any) => {
  const response = await api.get("/leave-categories", { params });
  return response.data.leaveCategories;
};

export const getLeaveCategoryById = async (id: string) => {
  const response = await api.get(`/leave-categories/${id}`);
  return response.data.leaveCategory;
};

export const createLeaveCategory = async (data: any) => {
  const response = await api.post("/leave-categories", data);
  return response.data;
};

export const updateLeaveCategory = async (id: string, data: any) => {
  const response = await api.put(`/leave-categories/${id}`, data);
  return response.data;
};

export const deleteLeaveCategory = async (id: string) => {
  const response = await api.delete(`/leave-categories/${id}`);
  return response.data;
};

export const initializeDefaultLeaveCategories = async () => {
  const response = await api.post("/leave-categories/initialize-defaults");
  return response.data;
};