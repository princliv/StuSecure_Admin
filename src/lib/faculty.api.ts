import { apiClient } from './api';

export interface Faculty {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  department: string | null;
}

export interface FacultyListResponse {
  faculty: Faculty[];
  total: number;
  page: number;
  limit: number;
}

export interface FacultyListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateFacultyBody {
  name: string;
  email: string;
  employeeId: string;
  department?: string;
}

export interface UpdateFacultyBody {
  name?: string;
  email?: string;
  department?: string;
}

export const facultyApi = {
  list: async (params: FacultyListParams = {}): Promise<FacultyListResponse> => {
    const { data } = await apiClient.get<FacultyListResponse>('/faculty', { params });
    return data;
  },
  create: async (body: CreateFacultyBody): Promise<Faculty> => {
    const { data } = await apiClient.post<Faculty>('/faculty', body);
    return data;
  },
  update: async (id: string, body: UpdateFacultyBody): Promise<Faculty> => {
    const { data } = await apiClient.patch<Faculty>(`/faculty/${id}`, body);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/faculty/${id}`);
  },
};
