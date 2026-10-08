import { apiClient } from './api';

export type EmergencyStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';

export interface Emergency {
  id: string;
  status: EmergencyStatus;
  description: string;
  location: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reportedBy: {
    studentId: string;
    name: string;
    enrollmentNo: string;
    hostelName: string | null;
    roomNumber: string | null;
  };
  resolvedBy: { id: string; name: string } | null;
}

export interface EmergencyListResponse {
  emergencies: Emergency[];
  total: number;
  page: number;
  limit: number;
}

export interface EmergencyListParams {
  page?: number;
  limit?: number;
  status?: EmergencyStatus;
}

export const emergencyApi = {
  list: async (params: EmergencyListParams = {}): Promise<EmergencyListResponse> => {
    const { data } = await apiClient.get<EmergencyListResponse>('/emergency', { params });
    return data;
  },
  acknowledge: async (id: string): Promise<Emergency> => {
    const { data } = await apiClient.patch<Emergency>(`/emergency/${id}/acknowledge`);
    return data;
  },
  resolve: async (id: string): Promise<Emergency> => {
    const { data } = await apiClient.patch<Emergency>(`/emergency/${id}/resolve`);
    return data;
  },
};
