export type RoleName = 'MEMBER' | 'CELL_LEADER' | 'EUROPE_COMMITTEE' | 'PROTOCOL' | 'SYSTEM_ADMINISTRATOR';

export type ActiveRoleView = {
  roleAssignmentId?: string;
  role?: string;
  orgUnitId?: string;
  categoryIds?: string[];
  permissions?: string[];
};

export type RoleAssignmentView = {
  id: string;
  role: RoleName | string;
  orgUnitId?: string;
  orgUnitName?: string;
  categoryIds?: string[];
};

export type CurrentUserView = {
  id: string;
  displayName?: string;
  email?: string;
  username?: string;
  initials?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  memberId?: string;
  memberType?: string;
  roleAssignments?: RoleAssignmentView[];
  permissions?: string[];
  mfaEnabled?: boolean;
  passwordChangedAt?: string;
  activeRole?: ActiveRoleView | null;
};

export type LoginResult = {
  mfaRequired?: boolean;
  mfaToken?: string | null;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export type TokenPair = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  activeRole?: ActiveRoleView;
};

export type ColleagueView = {
  name?: string;
  role?: string;
  cell?: string;
  phone?: string;
};

export type OtherGateView = {
  name?: string;
  detail?: string;
  officerCount?: number;
};

export type DayRowView = {
  label?: string;
  date?: string;
  isToday?: boolean;
};

export type MyPostResponse = {
  eventId?: string;
  gateId?: string;
  eventName?: string;
  venue?: string;
  gateName?: string;
  purpose?: string;
  days?: string;
  colleagues?: ColleagueView[];
  otherGates?: OtherGateView[];
  assignedBy?: string;
  assignedAt?: string;
  facesEnrolled?: number;
  facesRemaining?: number;
  dayOfEdition?: number;
  totalDays?: number;
  dayRows?: DayRowView[];
};

export type EventOption = {
  id: string;
  name?: string;
};

export type PersonView = {
  id: string;
  name?: string;
  cell?: string;
  role?: string;
  seat?: string;
  nationalId?: string;
  maskedEmail?: string;
  status?: string;
};

export type FacesPhoneResponse = {
  eventId?: string;
  eventName?: string;
  venue?: string;
  gateName?: string;
  events?: EventOption[];
  enrolled?: number;
  total?: number;
  people?: PersonView[];
  day?: number;
};

export type CodeResponse = {
  sentTo?: string;
  expiresInSeconds?: number;
};

export type ParticipantView = {
  memberId?: string;
  externalInviteeId?: string;
  fullName?: string;
  participantName?: string;
  isDelegate?: boolean;
  nationalId?: string;
  cellName?: string;
  seat?: string;
  contributionGiven?: boolean;
  hasEnrolledPhoto?: boolean;
};

export type OriginalAttendanceView = {
  checkedInAt?: string;
  gateName?: string;
};

export type ResolveOutcome =
  | 'VALID'
  | 'ALREADY_CHECKED_IN'
  | 'NOT_INVITED'
  | 'EVENT_CLOSED'
  | 'DECLINED'
  | 'REVOKED_CREDENTIAL'
  | 'STOPPED'
  | string;

export type ResolveResponse = {
  outcome?: ResolveOutcome;
  resolutionToken?: string;
  participant?: ParticipantView | null;
  originalAttendance?: OriginalAttendanceView | null;
  original?: OriginalAttendanceView | null;
  arrivalsToday?: number;
  arrivalsAtGate?: number;
};

export type OtpResponse = {
  verified?: boolean;
  remainingAttempts?: number;
};

export type AttendanceView = {
  id?: string;
  eventId?: string;
  gateId?: string;
  checkedInAt?: string;
  method?: string;
  punctuality?: string;
  entrancePhotoUrl?: string;
};

export type GateStatsView = {
  admittedTodayEvent?: number;
  admittedTodayGate?: number;
};

export type MoneyView = {
  amount?: number;
  currency?: string;
};

export type NextEventView = {
  eventId?: string;
  title?: string;
  startsOn?: string;
  endsOn?: string;
  venue?: string;
  youGave?: MoneyView;
  youGaveOn?: string;
  cellName?: string;
  cellPercent?: number;
  cellPledge?: MoneyView;
  contributionsCloseOn?: string;
  invitationIssued?: boolean;
  qrPayload?: string | null;
};

export type TodoItemView = {
  kind?: string;
  eventId?: string;
  eventTitle?: string;
  cellPercent?: number;
  pledge?: MoneyView;
  dueOn?: string;
  hostYear?: number;
  month?: string;
  amount?: MoneyView;
  cellName?: string;
};

export type FromCellView = {
  messageId?: string;
  senderName?: string;
  senderRole?: string;
  sentAt?: string;
  excerpt?: string;
};

export type HomeView = {
  firstName?: string;
  cellName?: string;
  leagueName?: string | null;
  memberSince?: number;
  year?: number;
  givenThisYear?: MoneyView;
  eventsAttended?: number;
  eventsInvited?: number;
  unreadMessages?: number;
  nextEvent?: NextEventView | null;
  todo?: TodoItemView[];
  fromCell?: FromCellView | null;
};

export type MemberView = {
  id: string;
  fullName?: string;
  idType?: string;
  idNumber?: string;
  phoneNumber?: string;
  email?: string;
  cellName?: string;
  orgUnitName?: string;
  joinedOn?: string;
};

export type MonthView = {
  month?: number;
  amount?: number | null;
  status?: string;
  paidOn?: string | null;
};

export type ContributionMeView = {
  year?: number;
  currency?: string;
  cellName?: string;
  monthlyRate?: number;
  openMonth?: number;
  monthsPaid?: number;
  monthsDue?: number;
  given?: number;
  months?: MonthView[];
};

export type ContributionEntryView = {
  id: string;
  occurredOn?: string;
  name?: string;
  how?: string;
  type?: string;
  amount?: number;
  currency?: string;
  status?: string;
};

export type HostCandidateView = {
  orgUnitId: string;
  name?: string;
  votes?: number | null;
};

export type MyHostVoteView = {
  id: string;
  eventId?: string;
  eventName?: string;
  status?: string;
  candidates?: HostCandidateView[];
  closesOn?: string;
  myChoiceCellId?: string | null;
  myChoiceName?: string | null;
};

export type PhoneVerificationView = {
  verificationId?: string;
  expiresAt?: string;
};

export type BallotResponseView = {
  id?: string;
  voteId?: string;
  choiceCellId?: string;
  myChoiceName?: string;
  castAt?: string;
};

export type PhotoPart = {
  uri: string;
  name: string;
  type: string;
};
