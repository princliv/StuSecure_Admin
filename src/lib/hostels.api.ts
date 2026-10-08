import { apiClient } from './api';

export interface Hostel {
  id: string;
  name: string;
  createdAt: string;
  roomCount: number;
  guardCount: number;
}

export interface HostelRoomSummary {
  id: string;
  number: string;
  capacity: number | null;
  occupantCount: number;
}

export interface HostelDetail extends Hostel {
  rooms: HostelRoomSummary[];
}

export interface HostelListResponse {
  hostels: Hostel[];
  total: number;
  page: number;
  limit: number;
}

export interface HostelListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateHostelBody {
  name: string;
}

export interface UpdateHostelBody {
  name?: string;
}

export const hostelsApi = {
  list: async (params: HostelListParams = {}): Promise<HostelListResponse> => {
    const { data } = await apiClient.get<HostelListResponse>('/hostels', { params });
    return data;
  },
  get: async (id: string): Promise<HostelDetail> => {
    const { data } = await apiClient.get<HostelDetail>(`/hostels/${id}`);
    return data;
  },
  create: async (body: CreateHostelBody): Promise<Hostel> => {
    const { data } = await apiClient.post<Hostel>('/hostels', body);
    return data;
  },
  update: async (id: string, body: UpdateHostelBody): Promise<Hostel> => {
    const { data } = await apiClient.patch<Hostel>(`/hostels/${id}`, body);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/hostels/${id}`);
  },
};
