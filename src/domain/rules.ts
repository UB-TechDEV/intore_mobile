/**
 * Sample rules for the phone apps.
 * Invitation lookup, the enrolment code, and the face score come from the
 * prototype's sample scenario. They are not a server, a payment provider,
 * or a face-matching service.
 */

export const SAMPLE_USERNAME = 'f.karangwa';
export const SAMPLE_PASSWORD = 'diaspora-demo';
export const SAMPLE_ENROLMENT_CODE = '4829';
export const SAMPLE_INVITATION = '53476150';
export const SAMPLE_MATCH_SCORE = 97;
export const MAX_SIGN_IN_ATTEMPTS = 5;

export type FaceStatus = 'enrolled' | 'no-photo' | 'id-missing';

export type SamplePerson = {
  id: string;
  name: string;
  initials: string;
  cell: string;
  role: string;
  seat: string;
  documentLabel: string;
  documentNumber: string;
  paid: boolean;
  contributionLabel: string;
  baseStatus: FaceStatus;
  emailMasked: string;
  invitationNumber: string;
  events: string[];
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatInvitation(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function verifySampleSignIn(username: string, password: string): boolean {
  return username.trim().toLowerCase() === SAMPLE_USERNAME && password === SAMPLE_PASSWORD;
}

export function verifyEnrolmentCode(entered: string): boolean {
  return digitsOnly(entered) === SAMPLE_ENROLMENT_CODE;
}

export function findByInvitation(people: SamplePerson[], raw: string): SamplePerson | undefined {
  const digits = digitsOnly(raw);
  if (digits.length !== 8) {
    return undefined;
  }
  return people.find((person) => person.invitationNumber === digits);
}

export function faceStatus(person: SamplePerson, enrolledIds: readonly string[]): FaceStatus {
  if (!person.documentNumber) {
    return 'id-missing';
  }
  if (enrolledIds.includes(person.id) || person.baseStatus === 'enrolled') {
    return 'enrolled';
  }
  return 'no-photo';
}

export function sampleFaceMatch(
  people: SamplePerson[],
  enrolledIds: readonly string[],
): SamplePerson | undefined {
  const enrolled = people.filter(
    (person) => faceStatus(person, enrolledIds) === 'enrolled' && person.documentNumber,
  );
  return enrolled.find((person) => person.invitationNumber === SAMPLE_INVITATION) ?? enrolled[0];
}

export type AdmitBlock = 'already' | 'stopped' | 'unpaid' | 'id-missing';

export function admitBlock(input: {
  personId: string;
  paid: boolean;
  idMissing: boolean;
  admittedIds: readonly string[];
  stoppedIds: readonly string[];
}): AdmitBlock | null {
  if (input.stoppedIds.includes(input.personId)) {
    return 'stopped';
  }
  if (input.admittedIds.includes(input.personId)) {
    return 'already';
  }
  if (input.idMissing) {
    return 'id-missing';
  }
  if (!input.paid) {
    return 'unpaid';
  }
  return null;
}

export function canCastVote(existingChoice: string | null): boolean {
  return existingChoice === null;
}
