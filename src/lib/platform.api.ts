import { apiClient } from './api';

/** Matches `PLAN_LIMITS`' keys in `StuSecure_Backend/src/config/plans.ts`. */
export const PLAN_KEYS = ['FREE', 'PRO', 'ENTERPRISE'] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';

export interface MemberCounts {
  students: number;
  guards: number;
  faculty: number;
  admins: number;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: OrganizationStatus;
  createdAt: string;
  memberCounts: MemberCounts;
}

export interface PlatformOrganizationDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: OrganizationStatus;
  createdAt: string;
  usage: unknown;
}

export interface ListOrganizationsResponse {
  organizations: PlatformOrganization[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateOrganizationBody {
  plan?: string;
  status?: OrganizationStatus;
}

export interface PlatformStats {
  totalOrganizations: number;
  usersByRole: Record<string, number>;
  organizationsByStatus: Record<string, number>;
}

export const platformApi = {
  listOrgs: (params: { search?: string; page?: number; limit?: number }) =>
    apiClient.get<ListOrganizationsResponse>('/platform/organizations', { params }),

  getOrg: (id: string) => apiClient.get<PlatformOrganizationDetail>(`/platform/organizations/${id}`),

  updateOrg: (id: string, body: UpdateOrganizationBody) =>
    apiClient.patch<PlatformOrganizationDetail>(`/platform/organizations/${id}`, body),

  getStats: () => apiClient.get<PlatformStats>('/platform/stats'),
};
