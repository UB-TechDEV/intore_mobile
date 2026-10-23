import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { clearTokens, currentRefreshToken, hydrateTokens, setSessionLostHandler, setTokens } from '../api/client';
import { getFaces, getMyPost } from '../api/event';
import { ApiError, isApiError } from '../api/problem';
import { initialsOf } from '../api/format';
import { getMember } from '../api/member';
import type { CurrentUserView, FacesPhoneResponse, MemberView, MyPostResponse, RoleAssignmentView } from '../api/types';

export type PhoneRole = 'protocol' | 'member';

function isMemberRole(role?: string) {
  return role === 'MEMBER' || role === 'CELL_LEADER';
}

export function phoneRolesOf(me: CurrentUserView | null): PhoneRole[] {
  const roles = new Set<PhoneRole>();
  for (const row of me?.roleAssignments ?? []) {
    if (row.role === 'PROTOCOL') roles.add('protocol');
    if (isMemberRole(row.role)) roles.add('member');
  }
  return [...roles];
}

export function assignmentFor(me: CurrentUserView | null, role: PhoneRole): RoleAssignmentView | undefined {
  const rows = me?.roleAssignments ?? [];
  if (role === 'protocol') return rows.find((row) => row.role === 'PROTOCOL');
  return rows.find((row) => row.role === 'MEMBER') ?? rows.find((row) => isMemberRole(row.role));
}

type SessionValue = {
  ready: boolean;
  signedIn: boolean;
  me: CurrentUserView | null;
  member: MemberView | null;
  post: MyPostResponse | null;
  faces: FacesPhoneResponse | null;
  role: PhoneRole;
  phoneRoles: PhoneRole[];
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  faceUnlock: boolean;
  setFaceUnlock: (value: boolean) => void;
  keepAwake: boolean;
  setKeepAwake: (value: boolean) => void;
  fullName: string;
  email: string;
  phone: string;
  initials: string;
  signIn: (identifier: string, password: string) => Promise<CurrentUserView>;
  enterRole: (role: PhoneRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<CurrentUserView>;
  saveProfile: (next: { displayName: string; email: string; phoneNumber: string }) => Promise<void>;
  loadPost: () => Promise<MyPostResponse | null>;
  loadFaces: (eventId?: string) => Promise<FacesPhoneResponse>;
  loadMember: () => Promise<MemberView | null>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<CurrentUserView | null>(null);
  const [member, setMember] = useState<MemberView | null>(null);
  const [post, setPost] = useState<MyPostResponse | null>(null);
  const [faces, setFaces] = useState<FacesPhoneResponse | null>(null);
  const [role, setRole] = useState<PhoneRole>('protocol');
  const [notifications, setNotifications] = useState(true);
  const [faceUnlock, setFaceUnlock] = useState(true);
  const [keepAwake, setKeepAwake] = useState(true);
  const meRef = useRef<CurrentUserView | null>(null);

  const applyMe = (next: CurrentUserView, enter = false) => {
    meRef.current = next;
    setMe(next);
    const active = next.activeRole?.role;
    if (active === 'PROTOCOL') setRole('protocol');
    else if (isMemberRole(active) || phoneRolesOf(next).includes('member')) setRole('member');
    if (enter) setSignedIn(true);
    return next;
  };

  const loadMemberRecord = async (user: CurrentUserView) => {
    if (!user.memberId) {
      setMember(null);
      return null;
    }
    try {
      const record = await getMember(user.memberId);
      setMember(record);
      return record;
    } catch {
      return null;
    }
  };

  const loadPost = async () => {
    try {
      const next = await getMyPost();
      setPost(next);
      return next;
    } catch {
      setPost(null);
      return null;
    }
  };

  const loadFaces = async (eventId?: string) => {
    const next = await getFaces(eventId);
    setFaces(next);
    return next;
  };

  const enterRole = async (nextRole: PhoneRole) => {
    const current = meRef.current;
    const assignment = assignmentFor(current, nextRole);
    if (assignment && current?.activeRole?.roleAssignmentId !== assignment.id) {
      await authApi.switchRole(assignment.id);
      const next = await authApi.getMe();
      applyMe(next, true);
      await loadMemberRecord(next);
    } else {
      setRole(nextRole);
      setSignedIn(true);
    }
    if (nextRole === 'protocol') await loadPost();
  };

  const signOut = async () => {
    try {
      await authApi.logout(currentRefreshToken());
    } catch {
      /* local sign-out still happens */
    }
    await clearTokens();
    meRef.current = null;
    setSignedIn(false);
    setMe(null);
    setMember(null);
    setPost(null);
    setFaces(null);
  };

  useEffect(() => {
    setSessionLostHandler(() => {
      meRef.current = null;
      setSignedIn(false);
      setMe(null);
      setMember(null);
      setPost(null);
      setFaces(null);
    });
    return () => setSessionLostHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const hasTokens = await hydrateTokens();
      if (hasTokens) {
        try {
          const next = await authApi.getMe();
          if (cancelled) return;
          applyMe(next, true);
          await loadMemberRecord(next);
          if (next.activeRole?.role === 'PROTOCOL') await loadPost();
        } catch {
          await clearTokens();
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      signedIn,
      me,
      member,
      post,
      faces,
      role,
      phoneRoles: phoneRolesOf(me),
      notifications,
      setNotifications,
      faceUnlock,
      setFaceUnlock,
      keepAwake,
      setKeepAwake,
      fullName: me?.displayName ?? '',
      email: me?.email ?? '',
      phone: me?.phoneNumber ?? '',
      initials: me?.initials || initialsOf(me?.displayName, '·'),
      signIn: async (identifier, password) => {
        const result = await authApi.login(identifier.trim(), password);
        if (result.mfaRequired) {
          throw new ApiError({
            status: 401,
            code: 'mfa_required',
            detail: 'This account needs a second code. Ask an administrator to turn MFA off for the phone app.',
          });
        }
        if (!result.accessToken || !result.refreshToken) {
          throw new ApiError({ status: 401, code: 'unauthorized', detail: 'Sign-in did not return a session.' });
        }
        await setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        try {
          const next = await authApi.getMe();
          applyMe(next, false);
          await loadMemberRecord(next);
          return next;
        } catch (caught) {
          await clearTokens();
          throw caught;
        }
      },
      enterRole,
      signOut,
      refreshMe: async () => {
        const next = await authApi.getMe();
        applyMe(next, signedIn);
        await loadMemberRecord(next);
        return next;
      },
      saveProfile: async (next) => {
        const updated = await authApi.updateMe({
          displayName: next.displayName,
          email: next.email,
          phoneNumber: next.phoneNumber,
        });
        applyMe(updated, true);
      },
      loadPost,
      loadFaces,
      loadMember: async () => (meRef.current ? loadMemberRecord(meRef.current) : null),
    }),
    [ready, signedIn, me, member, post, faces, role, notifications, faceUnlock, keepAwake],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.code === 'rate_limited' && error.retryAfter) {
      return `${error.detail} Try again in ${error.retryAfter}s.`;
    }
    return error.detail || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
