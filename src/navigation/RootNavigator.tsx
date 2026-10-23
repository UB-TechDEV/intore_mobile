import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BallotScreen } from '../screens/ballot/BallotScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { MemberHomeScreen, MemberPayScreen } from '../screens/member/MemberScreens';
import { CheckInScreen } from '../screens/protocol/CheckInScreen';
import { ConfirmScreen } from '../screens/protocol/ConfirmScreen';
import { EnrolScreen } from '../screens/protocol/EnrolScreen';
import { FacesScreen } from '../screens/protocol/FacesScreen';
import { MyPostScreen } from '../screens/protocol/MyPostScreen';
import { MemberProfileScreen, PersonalDetailsScreen, ProtocolProfileScreen } from '../screens/shared/ProfileScreens';
import { useTx } from '../i18n';
import type {
  CheckStackParamList,
  FacesStackParamList,
  MemberTabParamList,
  ProfileStackParamList,
  ProtocolTabParamList,
  RootStackParamList,
} from './types';
import { useSession } from '../state/session';
import { Text } from '../theme/text';
import { colors, font, type } from '../theme/tokens';

const Root = createNativeStackNavigator<RootStackParamList>();
const ProtocolTab = createBottomTabNavigator<ProtocolTabParamList>();
const MemberTab = createBottomTabNavigator<MemberTabParamList>();
const FacesStack = createNativeStackNavigator<FacesStackParamList>();
const CheckStack = createNativeStackNavigator<CheckStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const PROTOCOL_ICONS = {
  Post: ['location-outline', 'location'],
  Faces: ['camera-outline', 'camera'],
  CheckIn: ['scan-outline', 'scan'],
  Profile: ['person-outline', 'person'],
} as const;

const MEMBER_ICONS = {
  Home: ['home-outline', 'home-outline'],
  Pay: ['wallet-outline', 'wallet-outline'],
  Profile: ['person-circle-outline', 'person-circle-outline'],
} as const;

function PhoneTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tx } = useTx();
  const labels: Record<string, string> = {
    Post: tx('My post', 'Mon poste'),
    Faces: tx('Faces', 'Visages'),
    CheckIn: tx('Check in', 'Contrôle'),
    Profile: tx('Profile', 'Profil'),
    Home: tx('Home', 'Accueil'),
    Pay: tx('Pay', 'Payer'),
  };
  const icons = state.routeNames.includes('Post') ? PROTOCOL_ICONS : MEMBER_ICONS;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const pair = icons[route.name as keyof typeof icons];
        const icon = selected ? pair[1] : pair[0];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={labels[route.name] ?? route.name}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            <Ionicons name={icon} size={24} color={selected ? colors.primary : colors.faint} />
            <Text style={[styles.tabLabel, selected ? styles.tabLabelOn : null]}>{labels[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FacesNavigator() {
  return (
    <FacesStack.Navigator screenOptions={{ headerShown: false }}>
      <FacesStack.Screen name="FacesHome" component={FacesScreen} />
      <FacesStack.Screen name="Enrol" component={EnrolScreen} />
    </FacesStack.Navigator>
  );
}

function CheckNavigator() {
  return (
    <CheckStack.Navigator screenOptions={{ headerShown: false }}>
      <CheckStack.Screen name="CheckHome" component={CheckInScreen} />
      <CheckStack.Screen name="Confirm" component={ConfirmScreen} />
    </CheckStack.Navigator>
  );
}

function ProtocolProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProtocolProfileScreen} />
      <ProfileStack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
    </ProfileStack.Navigator>
  );
}

function ProtocolNavigator() {
  return (
    <ProtocolTab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <PhoneTabBar {...props} />}>
      <ProtocolTab.Screen name="Post" component={MyPostScreen} />
      <ProtocolTab.Screen name="Faces" component={FacesNavigator} />
      <ProtocolTab.Screen name="CheckIn" component={CheckNavigator} />
      <ProtocolTab.Screen name="Profile" component={ProtocolProfileNavigator} />
    </ProtocolTab.Navigator>
  );
}

function MemberNavigator() {
  return (
    <MemberTab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <PhoneTabBar {...props} />}>
      <MemberTab.Screen name="Home" component={MemberHomeScreen} />
      <MemberTab.Screen name="Pay" component={MemberPayScreen} />
      <MemberTab.Screen name="Profile" component={MemberProfileScreen} />
    </MemberTab.Navigator>
  );
}

export function RootNavigator() {
  const { ready, signedIn, role } = useSession();
  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  const initial = !signedIn ? 'SignIn' : role === 'protocol' ? 'Protocol' : 'Member';
  return (
    <Root.Navigator key={signedIn ? role : 'guest'} initialRouteName={initial} screenOptions={{ headerShown: false }}>
      <Root.Screen name="SignIn" component={SignInScreen} />
      <Root.Screen name="Protocol" component={ProtocolNavigator} />
      <Root.Screen name="Member" component={MemberNavigator} />
      <Root.Screen name="Ballot" component={BallotScreen} />
      <Root.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
    </Root.Navigator>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,31,42,0.16)',
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontFamily: font.display,
    color: colors.faint,
    fontSize: type.tab,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  tabLabelOn: {
    color: colors.primary,
  },
});
