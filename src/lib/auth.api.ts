import { apiClient } from './api';

export type Role = 'STUDENT' | 'GUARD' | 'FACULTY' | 'ADMIN';

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  isPlatformAdmin: boolean;
  createdAt: string;
}

export interface Membership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationLogoUrl?: string | null;
  organizationPrimaryColor?: string | null;
  role: Role;
}

export interface SyncResponse {
  user: UserProfile;
  memberships: Membership[];
}

export const authApi = {
  sync: () => apiClient.post<SyncResponse>('/auth/sync'),
  getMe: () => apiClient.get<SyncResponse>('/auth/me'),
};
