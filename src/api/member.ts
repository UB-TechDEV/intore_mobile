import { api } from './client';
import type { HomeView, MemberView } from './types';

export function getMemberHome() {
  return api<HomeView>('member', '/members/me/home');
}

export function getMember(memberId: string) {
  return api<MemberView>('member', `/members/${memberId}`);
}

export function verifyPin(pin: string) {
  return api<void>('member', '/members/me/pin/verify', {
    method: 'POST',
    body: { pin },
    as: 'none',
  });
}
