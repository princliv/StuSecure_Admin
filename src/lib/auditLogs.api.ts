import { apiClient } from './api';

export interface AuditLogActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: AuditLogActor | null;
}

export interface ListAuditLogsResponse {
  auditLogs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export const auditLogsApi = {
  list: (organizationId: string, params?: { page?: number; limit?: number; entityType?: string }) =>
    apiClient.get<ListAuditLogsResponse>(`/orgs/${organizationId}/audit-logs`, { params }),
};
