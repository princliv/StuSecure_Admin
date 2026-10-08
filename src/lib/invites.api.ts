import { apiClient } from './api';
import type { Role } from './auth.api';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface Invite {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  token: string;
  status: InviteStatus;
  invitedByUserId: string;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string;
}

export interface ListInvitesResponse {
  invites: Invite[];
  total: number;
  page: number;
  limit: number;
}

export interface ImportInvitesResult {
  created: number;
  skipped: { row: number; reason: string }[];
  truncated: boolean;
}

export const invitesApi = {
  create: (orgId: string, body: { email: string; role: Role }) =>
    apiClient.post<Invite>(`/orgs/${orgId}/invites`, body),

  list: (orgId: string, params?: { status?: InviteStatus; page?: number; limit?: number }) =>
    apiClient.get<ListInvitesResponse>(`/orgs/${orgId}/invites`, { params }),

  revoke: (orgId: string, inviteId: string) =>
    apiClient.delete<void>(`/orgs/${orgId}/invites/${inviteId}`),

  importCsv: (orgId: string, csv: string) =>
    apiClient.post<ImportInvitesResult>(`/orgs/${orgId}/invites/import`, { csv }),
};
