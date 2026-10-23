import { api } from './client';
import type { CurrentUserView, LoginResult } from './types';

export function login(identifier: string, password: string) {
  return api<LoginResult>('auth', '/auth/login', {
    method: 'POST',
    auth: false,
    body: { identifier, password },
  });
}

export function getMe() {
  return api<CurrentUserView>('auth', '/auth/me');
}

export function updateMe(body: {
  displayName: string;
  email: string;
  phoneNumber?: string;
  preferredLanguage?: 'en' | 'fr' | 'rw';
}) {
  return api<CurrentUserView>('auth', '/auth/me', { method: 'PATCH', body });
}

export function switchRole(roleAssignmentId: string) {
  return api<void>('auth', '/auth/switch-role', {
    method: 'PUT',
    body: { roleAssignmentId },
    as: 'none',
  });
}

export function logout(refreshToken?: string | null) {
  return api<void>('auth', '/auth/logout', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : {},
    as: 'none',
  });
}

export function forgotPassword(username: string) {
  return api<void>('auth', '/auth/password/forgot', {
    method: 'POST',
    auth: false,
    body: { username },
    as: 'none',
  });
}
