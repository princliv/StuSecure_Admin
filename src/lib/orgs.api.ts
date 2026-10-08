import { apiClient } from './api';
import type { Membership, SyncResponse } from './auth.api';

export const orgsApi = {
  /** Creates a new organization; caller becomes its first ADMIN membership.
   * Returns the same `{ user, memberships }` shape as `/auth/sync`. */
  create: (name: string) => apiClient.post<SyncResponse>('/orgs', { name }),

  listMine: () => apiClient.get<{ memberships: Membership[] }>('/orgs/mine'),

  switchOrg: (organizationId: string) =>
    apiClient.post<{ memberships: Membership[] }>(`/orgs/${organizationId}/switch`),

  /** Org self-service profile update (name/logoUrl/primaryColor). See
   * docs/StuSecure_SaaS_Plan.md Group G4. */
  updateProfile: (
    organizationId: string,
    body: { name?: string; logoUrl?: string; primaryColor?: string },
  ) =>
    apiClient.patch<{
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      primaryColor: string | null;
      plan: string;
      status: string;
    }>(`/orgs/${organizationId}`, body),
};
