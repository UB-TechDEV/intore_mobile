import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ResolveResponse } from '../api/types';

export type FacesStackParamList = {
  FacesHome: undefined;
  Enrol: { personId: string };
};

export type CheckStackParamList = {
  CheckHome: undefined;
  Confirm: { how: 'qr' | 'number'; resolve: ResolveResponse };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  PersonalDetails: undefined;
};

export type ProtocolTabParamList = {
  Post: undefined;
  Faces: NavigatorScreenParams<FacesStackParamList> | undefined;
  CheckIn: NavigatorScreenParams<CheckStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type MemberTabParamList = {
  Home: undefined;
  Pay: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  Protocol: NavigatorScreenParams<ProtocolTabParamList> | undefined;
  Member: NavigatorScreenParams<MemberTabParamList> | undefined;
  Ballot: { voteId?: string } | undefined;
  PersonalDetails: undefined;
};
