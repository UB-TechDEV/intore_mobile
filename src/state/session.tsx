import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { SamplePerson } from '../domain/rules';
import { PEOPLE } from '../data/sample';

export type Admission = {
  personId: string;
  at: string;
  how: 'face' | 'qr' | 'number';
  gate: string;
};

export type Enrolment = {
  personId: string;
  at: string;
  photoUri?: string;
  by: string;
  gate: string;
};

type SessionValue = {
  signedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  role: 'protocol' | 'member';
  setRole: (role: 'protocol' | 'member') => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  faceUnlock: boolean;
  setFaceUnlock: (value: boolean) => void;
  keepAwake: boolean;
  setKeepAwake: (value: boolean) => void;
  enrolments: Enrolment[];
  enrol: (entry: Enrolment) => void;
  enrolledIds: string[];
  admissions: Admission[];
  admit: (entry: Admission) => void;
  admittedIds: string[];
  stoppedIds: string[];
  stop: (personId: string) => void;
  octoberPaid: boolean;
  markOctoberPaid: () => void;
  voteChoice: string | null;
  castVote: (choice: string) => void;
  fullName: string;
  email: string;
  phone: string;
  updateProfile: (next: { fullName: string; email: string; phone: string }) => void;
  people: SamplePerson[];
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(true);
  const [role, setRole] = useState<'protocol' | 'member'>('protocol');
  const [notifications, setNotifications] = useState(true);
  const [faceUnlock, setFaceUnlock] = useState(true);
  const [keepAwake, setKeepAwake] = useState(true);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [stoppedIds, setStoppedIds] = useState<string[]>([]);
  const [octoberPaid, setOctoberPaid] = useState(false);
  const [voteChoice, setVoteChoice] = useState<string | null>(null);
  const [fullName, setFullName] = useState('Karangwa Fidèle');
  const [email, setEmail] = useState('f.karangwa@diaspora.rw');
  const [phone, setPhone] = useState('+33 6 12 44 80 19');

  const enrolledIds = useMemo(() => enrolments.map((entry) => entry.personId), [enrolments]);
  const admittedIds = useMemo(() => admissions.map((entry) => entry.personId), [admissions]);

  const value = useMemo<SessionValue>(
    () => ({
      signedIn,
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      role,
      setRole,
      notifications,
      setNotifications,
      faceUnlock,
      setFaceUnlock,
      keepAwake,
      setKeepAwake,
      enrolments,
      enrol: (entry) =>
        setEnrolments((current) =>
          current.some((item) => item.personId === entry.personId) ? current : [...current, entry],
        ),
      enrolledIds,
      admissions,
      admit: (entry) =>
        setAdmissions((current) =>
          current.some((item) => item.personId === entry.personId) ? current : [...current, entry],
        ),
      admittedIds,
      stoppedIds,
      stop: (personId) =>
        setStoppedIds((current) => (current.includes(personId) ? current : [...current, personId])),
      octoberPaid,
      markOctoberPaid: () => setOctoberPaid(true),
      voteChoice,
      castVote: (choice) => setVoteChoice((current) => current ?? choice),
      fullName,
      email,
      phone,
      updateProfile: (next) => {
        setFullName(next.fullName);
        setEmail(next.email);
        setPhone(next.phone);
      },
      people: PEOPLE,
    }),
    [
      signedIn,
      role,
      notifications,
      faceUnlock,
      keepAwake,
      enrolments,
      enrolledIds,
      admissions,
      admittedIds,
      stoppedIds,
      octoberPaid,
      voteChoice,
      fullName,
      email,
      phone,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}
