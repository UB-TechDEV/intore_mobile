import type { FaceStatus } from '../domain/rules';
import type { MoneyView, ParticipantView } from './types';

export function initialsOf(name?: string, fallback = ''): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function formatMoney(value?: MoneyView | number | null, currency = 'EUR'): string {
  const amount = typeof value === 'number' ? value : value?.amount;
  const code = typeof value === 'number' ? currency : value?.currency ?? currency;
  if (amount == null || Number.isNaN(amount)) return '—';
  const symbol = code === 'EUR' ? '€' : code === 'USD' ? '$' : `${code} `;
  const rounded = Math.round(amount * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${symbol}${text}`;
}

export function formatDay(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start) return '';
  const a = formatDay(start);
  const b = end && end !== start ? formatDay(end) : '';
  return b ? `${a} – ${b}` : a;
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const start = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86400000);
}

export function secondsUntilEndOf(iso?: string | null): number {
  if (!iso) return 0;
  const end = new Date(iso.length <= 10 ? `${iso}T23:59:59` : iso);
  if (Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
}

export function mapFaceStatus(status?: string): FaceStatus {
  if (status === 'ENROLLED') return 'enrolled';
  if (status === 'ID_MISSING') return 'id-missing';
  return 'no-photo';
}

export function participantName(person?: ParticipantView | null): string {
  return person?.fullName || person?.participantName || '';
}

export function maskId(value?: string | null, label = 'ID'): string {
  const digits = (value ?? '').replace(/\s/g, '');
  if (!digits) return '';
  const tail = digits.slice(-4);
  return `${label} •••• ${tail}`;
}

export function jpegPart(uri: string, name: string): { uri: string; name: string; type: string } {
  return { uri, name, type: 'image/jpeg' };
}
