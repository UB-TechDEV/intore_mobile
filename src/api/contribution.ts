import { api } from './client';
import type { ContributionEntryView, ContributionMeView } from './types';

export function getMyContributions(year: number) {
  return api<ContributionMeView>('contribution', '/diaspora/contributions/me', { query: { year } });
}

export function getContributionEntries(year: number) {
  return api<{ data?: ContributionEntryView[] }>('contribution', '/diaspora/contributions/me/entries', {
    query: { year, page: 1, pageSize: 12 },
  });
}

export function payMonth(input: { year: number; month: number; amount: number; currency: string }) {
  return api<{ id?: string; status?: string }>('contribution', '/diaspora/contributions/me/payments', {
    method: 'POST',
    body: { ...input, method: 'bank_transfer' },
  });
}
