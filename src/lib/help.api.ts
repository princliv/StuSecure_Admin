import { apiClient } from './api';

export type HelpRequestType = 'TRANSPORTATION' | 'MEDICAL' | 'HOSTEL' | 'SECURITY' | 'OTHER';
export type HelpRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
export type HelpRequestPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface HelpRequest {
  id: string;
  type: HelpRequestType;
  description: string;
  priority: HelpRequestPriority;
  status: HelpRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  student: {
    studentId: string;
    name: string;
    enrollmentNo: string;
    hostelName: string | null;
    roomNumber: string | null;
  };
  assignedTo: { facultyId: string; name: string } | null;
}

export interface HelpRequestListResponse {
  requests: HelpRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface HelpRequestListParams {
  page?: number;
  limit?: number;
  status?: HelpRequestStatus;
  type?: HelpRequestType;
}

export const helpApi = {
  list: async (params: HelpRequestListParams = {}): Promise<HelpRequestListResponse> => {
    const { data } = await apiClient.get<HelpRequestListResponse>('/help', { params });
    return data;
  },
  assign: async (id: string, facultyId?: string): Promise<HelpRequest> => {
    const { data } = await apiClient.patch<HelpRequest>(`/help/${id}/assign`, facultyId ? { facultyId } : {});
    return data;
  },
  resolve: async (id: string): Promise<HelpRequest> => {
    const { data } = await apiClient.patch<HelpRequest>(`/help/${id}/resolve`);
    return data;
  },
  cancel: async (id: string): Promise<HelpRequest> => {
    const { data } = await apiClient.patch<HelpRequest>(`/help/${id}/cancel`);
    return data;
  },
};
