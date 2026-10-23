import { api } from './client';
import type {
  AttendanceView,
  CodeResponse,
  FacesPhoneResponse,
  GateStatsView,
  MyHostVoteView,
  MyPostResponse,
  OtpResponse,
  PersonView,
  PhoneVerificationView,
  PhotoPart,
  ResolveResponse,
  BallotResponseView,
} from './types';

export function getMyPost() {
  return api<MyPostResponse>('event', '/protocol/my-post');
}

export function getFaces(eventId?: string) {
  return api<FacesPhoneResponse>('event', '/protocol/faces', { query: { eventId } });
}

export function sendEnrolmentCode(memberId: string, eventId: string) {
  return api<CodeResponse>('event', `/protocol/faces/${memberId}/code`, {
    method: 'POST',
    body: { eventId },
  });
}

export function confirmEnrolmentCode(memberId: string, eventId: string, code: string) {
  return api<{ ok?: boolean }>('event', `/protocol/faces/${memberId}/confirm`, {
    method: 'POST',
    body: { eventId, code },
  });
}

export function enrollFace(memberId: string, eventId: string, file: PhotoPart) {
  const body = new FormData();
  body.append('enrollment', JSON.stringify({ eventId }));
  body.append('file', file as unknown as Blob);
  return api<PersonView>('event', `/protocol/faces/${memberId}`, { method: 'POST', body });
}

export function getEnrolledPhoto(memberId: string, eventId: string) {
  return api<string>('event', `/protocol/faces/${memberId}/photo`, {
    query: { eventId },
    as: 'binary',
  });
}

export function getGateStats(eventId: string, gateId: string) {
  return api<GateStatsView>('event', `/event-schedules/${eventId}/gates/${gateId}/stats`);
}

export function resolveCheckIn(eventId: string, gateId: string, code: string) {
  return api<ResolveResponse>('event', '/event-schedules/checkin/resolve', {
    method: 'POST',
    body: { eventId, gateId, code },
  });
}

export function verifyCheckInOtp(resolutionToken: string, code: string) {
  return api<OtpResponse>('event', '/event-schedules/checkin/otp', {
    method: 'POST',
    body: { resolutionToken, code },
  });
}

export function commitAttendance(resolutionToken: string, photo: PhotoPart, overrideReason?: string) {
  const body = new FormData();
  body.append('photo', photo as unknown as Blob);
  return api<AttendanceView>('event', '/event-schedules/checkin/attendance', {
    method: 'POST',
    query: { resolutionToken, overrideReason },
    body,
  });
}

export function stopGate(resolutionToken: string) {
  return api<{ name?: string }>('event', '/protocol/gate/stop', {
    method: 'POST',
    body: { resolutionToken },
  });
}

export function searchFace(eventId: string, gateId: string) {
  return api<unknown>('event', '/protocol/gate/face-search', {
    method: 'POST',
    body: { eventId, gateId },
  });
}

export function listMyVotes() {
  return api<{ data?: MyHostVoteView[] }>('event', '/host-votes/mine', {
    query: { page: 1, pageSize: 10 },
  });
}

export function getMyVote(voteId: string) {
  return api<MyHostVoteView>('event', `/host-votes/mine/${voteId}`);
}

export function verifyVotePin(voteId: string, pin: string) {
  return api<PhoneVerificationView>('event', `/host-votes/${voteId}/phone-verification`, {
    method: 'POST',
    body: { method: 'PIN', pin },
  });
}

export function castBallot(voteId: string, choiceCellId: string, verificationId: string) {
  return api<BallotResponseView>('event', `/host-votes/${voteId}/ballots`, {
    method: 'POST',
    body: { choiceCellId, channel: 'PHONE', verificationId },
  });
}
