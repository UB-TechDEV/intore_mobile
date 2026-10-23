export const API_HOST =
  process.env.EXPO_PUBLIC_API_HOST ?? 'https://apis-qa-events.intoresolutions.rw';

export const services = {
  auth: `${API_HOST}/auth/api/v1`,
  event: `${API_HOST}/event/api/v1`,
  member: `${API_HOST}/member/api/v1`,
  contribution: `${API_HOST}/contribution/api/v1`,
} as const;

export type Service = keyof typeof services;
