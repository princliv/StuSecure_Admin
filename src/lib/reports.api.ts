import { apiClient } from './api';

export interface RecentMovement {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  studentName: string;
  hostelName: string | null;
}

export interface OverviewResponse {
  totalStudents: number;
  totalGuards: number;
  totalHostels: number;
  insideCount: number;
  outsideCount: number;
  openEmergencyCount: number;
  pendingHelpCount: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  recentMovements: RecentMovement[];
}

export interface ReportDay {
  date: string;
  checkIns: number;
  checkOuts: number;
}

export interface SummaryResponse {
  from: string;
  to: string;
  checkIns: number;
  checkOuts: number;
  uniqueStudents: number;
  totalStudents: number;
  insideCount: number;
  outsideCount: number;
  byDay: ReportDay[];
}

export const reportsApi = {
  overview: async (): Promise<OverviewResponse> => {
    const { data } = await apiClient.get<OverviewResponse>('/reports/overview');
    return data;
  },
  summary: async (from: string, to: string): Promise<SummaryResponse> => {
    const { data } = await apiClient.get<SummaryResponse>('/reports/summary', {
      params: { from, to },
    });
    return data;
  },
  downloadMovementsCsv: async (from: string, to: string): Promise<void> => {
    const response = await apiClient.get('/reports/movements.csv', {
      params: { from, to },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `movements-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
