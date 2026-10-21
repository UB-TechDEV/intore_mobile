import type { SamplePerson } from '../domain/rules';

/** Fixed scenario from prototype diaspora-ems v5.0. Not live event data. */
export const SAMPLE_EVENT = 'RPF Europe Retreat — Poland';
export const SAMPLE_EVENTS = [
  SAMPLE_EVENT,
  'Rwanda Convention Canada 2027',
  'RPF Europe Retreat — Warsaw 2025',
];
export const SAMPLE_CELLS = [
  'All cells',
  'Belgium',
  'Netherlands',
  'Luxembourg',
  'France',
  'United Kingdom',
  'Poland',
];

export const EVENT_FACE_TOTALS: Record<string, { enrolled: number; invited: number }> = {
  [SAMPLE_EVENT]: { enrolled: 318, invited: 412 },
  'Rwanda Convention Canada 2027': { enrolled: 702, invited: 960 },
  'RPF Europe Retreat — Warsaw 2025': { enrolled: 29, invited: 33 },
};

export const PEOPLE: SamplePerson[] = [
  {
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
    events: SAMPLE_EVENTS,
  },
  {
    id: 'eric',
    name: 'Habimana Eric',
    initials: 'HE',
    cell: 'United Kingdom',
    role: 'Cell committee',
    seat: 'B-02',
    documentLabel: 'Passport',
    documentNumber: 'PC1234567',
    paid: true,
    contributionLabel: '€60 paid',
    baseStatus: 'enrolled',
    emailMasked: 'e•••••@diaspora.rw',
    invitationNumber: '44001218',
    events: SAMPLE_EVENTS,
  },
  {
    id: 'solange',
    name: 'Mukamana Solange',
    initials: 'MS',
    cell: 'France',
    role: 'Women’s league',
    seat: 'C-21',
    documentLabel: 'National ID',
    documentNumber: '1197 5700 9876 5402',
    paid: false,
    contributionLabel: 'Unpaid',
    baseStatus: 'enrolled',
    emailMasked: 's•••••@diaspora.rw',
    invitationNumber: '22001876',
    events: [SAMPLE_EVENT, 'Rwanda Convention Canada 2027'],
  },
  {
    id: 'patrick',
    name: 'Nsengiyumva Patrick',
    initials: 'NP',
    cell: 'Poland',
    role: 'Participant',
    seat: '—',
    documentLabel: 'ID',
    documentNumber: '',
    paid: false,
    contributionLabel: 'Unpaid',
    baseStatus: 'id-missing',
    emailMasked: 'p•••••@diaspora.rw',
    invitationNumber: '10000001',
    events: [SAMPLE_EVENT, 'Rwanda Convention Canada 2027'],
  },
  {
    id: 'chantal',
    name: 'Ingabire Chantal',
    initials: 'IC',
    cell: 'Netherlands',
    role: 'Delegate',
    seat: 'A-31',
    documentLabel: 'Passport',
    documentNumber: 'PC7654321',
    paid: true,
    contributionLabel: '€60 paid',
    baseStatus: 'enrolled',
    emailMasked: 'c•••••@diaspora.rw',
    invitationNumber: '33004521',
    events: SAMPLE_EVENTS,
  },
  {
    id: 'jean',
    name: 'Rukundo Jean-Bosco',
    initials: 'RJ',
    cell: 'United Kingdom',
    role: 'Cell committee',
    seat: 'B-18',
    documentLabel: 'National ID',
    documentNumber: '1196 5400 1112 2233',
    paid: true,
    contributionLabel: '€60 paid',
    baseStatus: 'enrolled',
    emailMasked: 'j•••••@diaspora.rw',
    invitationNumber: '55006789',
    events: SAMPLE_EVENTS,
  },
  {
    id: 'diane',
    name: 'Umutoni Diane',
    initials: 'UD',
    cell: 'Belgium',
    role: 'Youth league',
    seat: '—',
    documentLabel: 'National ID',
    documentNumber: '1200 2800 3334 4455',
    paid: true,
    contributionLabel: '€60 paid',
    baseStatus: 'no-photo',
    emailMasked: 'd•••••@diaspora.rw',
    invitationNumber: '66007890',
    events: [SAMPLE_EVENT, 'Rwanda Convention Canada 2027'],
  },
  {
    id: 'olivier',
    name: 'Gasana Olivier',
    initials: 'GO',
    cell: 'Netherlands',
    role: 'Cell committee',
    seat: '—',
    documentLabel: 'Passport',
    documentNumber: 'PC9988776',
    paid: false,
    contributionLabel: 'Unpaid',
    baseStatus: 'no-photo',
    emailMasked: 'o•••••@diaspora.rw',
    invitationNumber: '77008901',
    events: SAMPLE_EVENTS,
  },
  {
    id: 'aline',
    name: 'Mutesi Aline',
    initials: 'MA',
    cell: 'Belgium',
    role: 'Europe Committee',
    seat: 'C-07',
    documentLabel: 'National ID',
    documentNumber: '1195 5100 4445 5566',
    paid: true,
    contributionLabel: '€60 paid',
    baseStatus: 'enrolled',
    emailMasked: 'm•••••@diaspora.rw',
    invitationNumber: '88009012',
    events: SAMPLE_EVENTS,
  },
  {
    id: 'fidele',
    name: 'Karangwa Fidèle',
    initials: 'KF',
    cell: 'France',
    role: 'Delegate',
    seat: 'A-45',
    documentLabel: 'Passport',
    documentNumber: 'PC3456789',
    paid: true,
    contributionLabel: '€60 paid',
    baseStatus: 'enrolled',
    emailMasked: 'f•••••@diaspora.rw',
    invitationNumber: '99000123',
    events: SAMPLE_EVENTS,
  },
];

export const DUTY_DAYS = [
  { id: 'day-1', label: 'Day 1 · Fri 30 Oct', note: 'Today', current: true },
  { id: 'day-2', label: 'Day 2 · Sat 31 Oct', note: '', current: false },
];

export const GATE_TEAM = [
  { id: 'kf', initials: 'KF', name: 'Karangwa Fidèle', detail: 'You · France cell' },
  { id: 'ik', initials: 'IK', name: 'Ishimwe Kevin', detail: 'Belgium cell · +32 470 553 018' },
];

export const OTHER_GATES = [
  { id: 'gate-1', name: 'Gate 1', purpose: 'Main entrance — participants', officers: '3 officers' },
  { id: 'vip', name: 'VIP desk', purpose: 'Guests and committee', officers: '1 officer' },
  { id: 'accreditation', name: 'Accreditation desk', purpose: 'Badges and late registration', officers: '1 officer' },
];

export const BALLOT_OPTIONS = [
  { id: 'belgium', name: 'Belgium', league: 'Belgium cell', city: 'Antwerp Expo' },
  { id: 'poland', name: 'Poland', league: 'Poland cell', city: 'Warsaw · EXPO XXI' },
  { id: 'france', name: 'France', league: 'France cell', city: 'Paris · Cité Internationale' },
  { id: 'uk', name: 'United Kingdom', league: 'United Kingdom cell', city: 'London · ExCeL London' },
];

export const PAYMENT_HISTORY = [
  { id: 'solidarity', name: 'Solidarity fund — France cell', detail: '2 Oct · bank transfer', amount: '€20' },
  { id: 'september', name: 'September payment', detail: '4 Sep · bank transfer', amount: '€10' },
  { id: 'retreat', name: 'RPF Europe Retreat — Poland', detail: '3 Sep · bank transfer', amount: '€80' },
  { id: 'august', name: 'August payment', detail: '5 Aug · bank transfer', amount: '€10' },
  { id: 'kwibuka', name: 'Kwibuka 32 commemoration', detail: '9 Apr · cash', amount: '€25' },
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

export const OFFICER = {
  name: 'Karangwa Fidèle',
  initials: 'KF',
  email: 'f.karangwa@diaspora.rw',
  phone: '+33 6 12 44 80 19',
  idMasked: 'Passport •••• 6789',
  cell: 'France cell',
  memberSince: 'March 2019',
};

export const PROTOCOL_LEAD = {
  name: 'Uwamahoro Joy',
  phone: '+48 512 330 114',
  phoneHref: 'tel:+48512330114',
};

/** Prototype sample face used when a live enrolment photo is not on this phone yet. */
export const SAMPLE_FACE = require('../../assets/sample/ange.jpg');
