import api from "./api";

export const getAllTopLevelPositions = async (params?: any) => {
  const response = await api.get("/top-level-positions", { params });
  return response.data.topLevelPositions;
};

export const getTopLevelPositionById = async (id: string) => {
  const response = await api.get(`/top-level-positions/${id}`);
  return response.data.topLevelPosition;
};

export const createTopLevelPosition = async (data: any) => {
  const response = await api.post("/top-level-positions", data);
  return response.data;
};

export const updateTopLevelPosition = async (id: string, data: any) => {
  const response = await api.put(`/top-level-positions/${id}`, data);
  return response.data;
};

export const deleteTopLevelPosition = async (id: string) => {
  const response = await api.delete(`/top-level-positions/${id}`);
  return response.data;
};