import { apiClient } from './api';

export interface Guard {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  shift: string | null;
  hostelId: string | null;
  hostelName: string | null;
}

export interface GuardListResponse {
  guards: Guard[];
  total: number;
  page: number;
  limit: number;
}

export interface GuardListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateGuardBody {
  name: string;
  email: string;
  employeeId: string;
  hostelId?: string;
  shift?: string;
}

export interface UpdateGuardBody {
  name?: string;
  email?: string;
  hostelId?: string;
  shift?: string;
}

export const guardsApi = {
  list: async (params: GuardListParams = {}): Promise<GuardListResponse> => {
    const { data } = await apiClient.get<GuardListResponse>('/guards', { params });
    return data;
  },
  create: async (body: CreateGuardBody): Promise<Guard> => {
    const { data } = await apiClient.post<Guard>('/guards', body);
    return data;
  },
  update: async (id: string, body: UpdateGuardBody): Promise<Guard> => {
    const { data } = await apiClient.patch<Guard>(`/guards/${id}`, body);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/guards/${id}`);
  },
};
