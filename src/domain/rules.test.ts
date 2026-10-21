import assert from 'node:assert/strict';
import test from 'node:test';
import {
  admitBlock,
  canCastVote,
  findByInvitation,
  formatInvitation,
  sampleFaceMatch,
  verifyEnrolmentCode,
  verifySampleSignIn,
  type SamplePerson,
} from './rules';

const ange: SamplePerson = {
  id: 'ange',
  name: 'Uwase Ange',
  initials: 'UA',
  cell: 'Belgium',
  role: 'Delegate',
  seat: 'A-14',
  documentLabel: 'National ID',
  documentNumber: '1198 0800 1234 5601',
  paid: true,
  contributionLabel: '€60 paid',
  baseStatus: 'no-photo',
  emailMasked: 'a•••••@diaspora.rw',
  invitationNumber: '53476150',
  events: ['RPF Europe Retreat — Poland'],
};

const unpaid: SamplePerson = {
  ...ange,
  id: 'solange',
  name: 'Mukamana Solange',
  paid: false,
  invitationNumber: '22001876',
  baseStatus: 'enrolled',
};

test('formats an invitation number in two groups', () => {
  assert.equal(formatInvitation('53476150'), '5347 6150');
  assert.equal(formatInvitation('5347 6150'), '5347 6150');
});

test('accepts only the sample sign-in and enrolment code', () => {
  assert.equal(verifySampleSignIn('f.karangwa', 'diaspora-demo'), true);
  assert.equal(verifySampleSignIn('f.karangwa', 'wrong-password'), false);
  assert.equal(verifyEnrolmentCode('4829'), true);
  assert.equal(verifyEnrolmentCode('0000'), false);
});

test('finds a person by the 8-digit invitation number', () => {
  assert.equal(findByInvitation([ange], '5347 6150')?.id, 'ange');
  assert.equal(findByInvitation([ange], '11111111'), undefined);
  assert.equal(findByInvitation([ange], '5347'), undefined);
});

test('face search returns an enrolled person and ignores people with no photo', () => {
  assert.equal(sampleFaceMatch([ange], []), undefined);
  assert.equal(sampleFaceMatch([ange], ['ange'])?.id, 'ange');
});

test('admission blocks a second entry, a stopped QR, and an unpaid contribution', () => {
  assert.equal(
    admitBlock({ personId: 'ange', paid: true, idMissing: false, admittedIds: ['ange'], stoppedIds: [] }),
    'already',
  );
  assert.equal(
    admitBlock({ personId: 'ange', paid: true, idMissing: false, admittedIds: [], stoppedIds: ['ange'] }),
    'stopped',
  );
  assert.equal(
    admitBlock({
      personId: unpaid.id,
      paid: unpaid.paid,
      idMissing: false,
      admittedIds: [],
      stoppedIds: [],
    }),
    'unpaid',
  );
  assert.equal(
    admitBlock({ personId: 'ange', paid: true, idMissing: false, admittedIds: [], stoppedIds: [] }),
    null,
  );
});

test('a member can vote once', () => {
  assert.equal(canCastVote(null), true);
  assert.equal(canCastVote('Belgium'), false);
});
