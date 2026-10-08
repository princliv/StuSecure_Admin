import { apiClient } from './api';

export interface StudentLastMovement {
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  location: string | null;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  enrollmentNo: string;
  name: string;
  email: string;
  phone: string | null;
  hostelId: string | null;
  hostelName: string | null;
  roomNumber: string | null;
  lastMovement: StudentLastMovement | null;
}

export interface StudentListResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
}

export interface StudentListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateStudentBody {
  name: string;
  email: string;
  enrollmentNo: string;
  phone?: string;
  roomId?: string;
}

export interface UpdateStudentBody {
  name?: string;
  email?: string;
  phone?: string;
  roomId?: string;
}

export const studentsApi = {
  list: async (params: StudentListParams = {}): Promise<StudentListResponse> => {
    const { data } = await apiClient.get<StudentListResponse>('/students', { params });
    return data;
  },
  create: async (body: CreateStudentBody): Promise<Student> => {
    const { data } = await apiClient.post<Student>('/students', body);
    return data;
  },
  update: async (id: string, body: UpdateStudentBody): Promise<Student> => {
    const { data } = await apiClient.patch<Student>(`/students/${id}`, body);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};
