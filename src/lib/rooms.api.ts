import { apiClient } from './api';

export interface Room {
  id: string;
  number: string;
  capacity: number | null;
  hostelId: string;
  hostelName: string;
  occupantCount: number;
}

export interface RoomListResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
}

export interface RoomListParams {
  page?: number;
  limit?: number;
  search?: string;
  hostelId?: string;
}

export interface CreateRoomBody {
  hostelId: string;
  number: string;
  capacity?: number;
}

export interface UpdateRoomBody {
  number?: string;
  capacity?: number;
}

export const roomsApi = {
  list: async (params: RoomListParams = {}): Promise<RoomListResponse> => {
    const { data } = await apiClient.get<RoomListResponse>('/rooms', { params });
    return data;
  },
  create: async (body: CreateRoomBody): Promise<Room> => {
    const { data } = await apiClient.post<Room>('/rooms', body);
    return data;
  },
  update: async (id: string, body: UpdateRoomBody): Promise<Room> => {
    const { data } = await apiClient.patch<Room>(`/rooms/${id}`, body);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
