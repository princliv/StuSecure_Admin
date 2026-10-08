import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { setActiveOrgId, setAuthToken } from './api';
import { authApi, type Membership, type SyncResponse, type UserProfile } from './auth.api';
import { orgsApi } from './orgs.api';

/** Per-viewer convenience only — not a security boundary. Remembers which
 * org this browser last had active, so a multi-org admin doesn't have to
 * re-pick on every reload. */
const ACTIVE_ORG_STORAGE_KEY = 'stusecure_admin_active_org';

export function persistActiveOrgId(organizationId: string | null) {
  if (organizationId) {
    localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, organizationId);
  } else {
    localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
  }
}

/** A user is allowed to view this dashboard if either they hold at least
 * one ADMIN membership, or they hold none yet (a fresh account that still
 * needs to create/join an organization). A user who has memberships but
 * none of them ADMIN (e.g. student/guard/faculty-only) is not admin-capable
 * and must be signed out of this app. */
export function isAdminCapable(memberships: Membership[]): boolean {
  return memberships.length === 0 || memberships.some((m) => m.role === 'ADMIN');
}

export function hasAdminMembership(memberships: Membership[]): boolean {
  return memberships.some((m) => m.role === 'ADMIN');
}

/** Picks the active org among the user's ADMIN memberships: prefers a
 * previously persisted choice (if still valid), else the first one. */
export function resolveActiveMembership(memberships: Membership[]): Membership | null {
  const adminMemberships = memberships.filter((m) => m.role === 'ADMIN');
  if (adminMemberships.length === 0) return null;

  const persisted = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  if (persisted) {
    const match = adminMemberships.find((m) => m.organizationId === persisted);
    if (match) return match;
  }
  return adminMemberships[0] ?? null;
}

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  error: string | null;
  signOutAdmin: () => Promise<void>;
  switchOrg: (organizationId: string) => Promise<void>;
  /** Applies a `{ user, memberships }` response (from `/auth/sync`,
   * `POST /orgs`, or any endpoint returning that shape) to context state.
   * Reused so every place that lands a fresh profile — initial sign-in,
   * "create organization" — shares one code path. */
  applySync: (data: SyncResponse) => void;
  /** Patches the name/logoUrl/primaryColor of the membership matching
   * `organizationId` in local state (memberships + activeMembership, if it's
   * the active one) — avoids a full re-sync round-trip after
   * `PATCH /orgs/:id`. See docs/StuSecure_SaaS_Plan.md Group G4. */
  patchOrgBranding: (
    organizationId: string,
    branding: { name?: string; logoUrl?: string | null; primaryColor?: string | null },
  ) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySync = (data: SyncResponse) => {
    setProfile(data.user);
    setMemberships(data.memberships);
    const active = resolveActiveMembership(data.memberships);
    setActiveMembership(active);
    setActiveOrgId(active?.organizationId ?? null);
    if (active) persistActiveOrgId(active.organizationId);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      setError(null);

      if (!user) {
        setAuthToken(null);
        setActiveOrgId(null);
        setProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const token = await user.getIdToken();
        setAuthToken(token);
        const { data } = await authApi.sync();
        if (!data.user.isPlatformAdmin && !isAdminCapable(data.memberships)) {
          await signOut(firebaseAuth);
          setError('This dashboard is for organization admins only.');
          return;
        }
        applySync(data);
      } catch {
        setAuthToken(null);
        setActiveOrgId(null);
        setProfile(null);
        setMemberships([]);
        setActiveMembership(null);
        setError('Could not load your StuSecure admin account.');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      memberships,
      activeMembership,
      isPlatformAdmin: profile?.isPlatformAdmin ?? false,
      loading,
      error,
      signOutAdmin: async () => {
        await signOut(firebaseAuth);
        setAuthToken(null);
        setActiveOrgId(null);
      },
      switchOrg: async (organizationId: string) => {
        const { data } = await orgsApi.switchOrg(organizationId);
        setMemberships(data.memberships);
        const active =
          data.memberships.find(
            (m) => m.organizationId === organizationId && m.role === 'ADMIN',
          ) ?? null;
        setActiveMembership(active);
        setActiveOrgId(active?.organizationId ?? null);
        persistActiveOrgId(active?.organizationId ?? null);
      },
      applySync,
      patchOrgBranding: (
        organizationId: string,
        branding: { name?: string; logoUrl?: string | null; primaryColor?: string | null },
      ) => {
        const patch = (m: Membership): Membership =>
          m.organizationId === organizationId
            ? {
                ...m,
                ...(branding.name !== undefined ? { organizationName: branding.name } : {}),
                ...(branding.logoUrl !== undefined ? { organizationLogoUrl: branding.logoUrl } : {}),
                ...(branding.primaryColor !== undefined
                  ? { organizationPrimaryColor: branding.primaryColor }
                  : {}),
              }
            : m;

        setMemberships((prev) => prev.map(patch));
        setActiveMembership((prev) => (prev ? patch(prev) : prev));
      },
    }),
    [firebaseUser, profile, memberships, activeMembership, loading, error],
    // isPlatformAdmin is derived from profile, no separate dependency needed
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
