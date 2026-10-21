import type { NavigatorScreenParams } from '@react-navigation/native';

export type FacesStackParamList = {
  FacesHome: undefined;
  Enrol: { personId: string };
};

export type CheckStackParamList = {
  CheckHome: undefined;
  Confirm: { personId: string; how: 'face' | 'qr' | 'number' };
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
  Ballot: undefined;
  PersonalDetails: undefined;
};
