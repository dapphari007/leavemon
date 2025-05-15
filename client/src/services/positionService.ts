import { get, post, put, del } from "./api";

export interface Position {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
  };
  departmentName?: string; // For display purposes
}

export interface GetPositionsParams {
  departmentId?: string;
  isActive?: boolean;
}

export interface CreatePositionData {
  name: string;
  description?: string;
  departmentId?: string;
  level?: number;
  isActive?: boolean;
}

export interface UpdatePositionData {
  name?: string;
  description?: string;
  departmentId?: string;
  level?: number;
  isActive?: boolean;
}

export const getAllPositions = async (
  params?: GetPositionsParams
): Promise<Position[]> => {
  const response = await get<{ positions: Position[]; count: number }>(
    "/positions",
    { params }
  );
  return response.positions || [];
};

export const getPositionById = async (id: string): Promise<Position> => {
  const response = await get<{ position: Position }>(`/positions/${id}`);
  return response.position;
};

export const createPosition = async (
  data: CreatePositionData
): Promise<Position> => {
  const response = await post<{ position: Position }>("/positions", data);
  return response.position;
};

export const updatePosition = async (
  id: string,
  data: UpdatePositionData
): Promise<Position> => {
  const response = await put<{ position: Position }>(
    `/positions/${id}`,
    data
  );
  return response.position;
};

export const deletePosition = async (id: string): Promise<void> => {
  await del(`/positions/${id}`);
};

// Get positions that are assigned to users in a specific department
export const getAssignedPositionsByDepartment = async (
  departmentId: string
): Promise<Position[]> => {
  // First get all users
  const usersResponse = await get<{ users: any[]; count: number }>("/users");
  const users = usersResponse.users || [];
  
  // Filter users by department and get unique position IDs
  const positionIds = [...new Set(
    users
      .filter(user => user.department === departmentId && user.position)
      .map(user => user.position)
  )];
  
  // If no positions found, return empty array
  if (positionIds.length === 0) {
    return [];
  }
  
  // Get all positions
  const allPositions = await getAllPositions();
  
  // Filter positions by the IDs we found
  return allPositions.filter(position => positionIds.includes(position.id));
};