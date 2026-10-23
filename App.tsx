import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useTx, type ProfileLanguage } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SessionProvider, useSession } from './src/state/session';

function LanguageSync() {
  const { me } = useSession();
  const { profileLanguage, setLanguage } = useTx();
  useEffect(() => {
    const next = me?.preferredLanguage;
    if (next === 'en' || next === 'fr' || next === 'rw') {
      if (next !== profileLanguage) setLanguage(next as ProfileLanguage);
    }
  }, [me?.preferredLanguage, profileLanguage, setLanguage]);
  return null;
}

function ShiftWake() {
  const { keepAwake, role, signedIn } = useSession();
  useEffect(() => {
    if (signedIn && role === 'protocol' && keepAwake) {
      void activateKeepAwakeAsync('shift');
      return () => {
        deactivateKeepAwake('shift');
      };
    }
    deactivateKeepAwake('shift');
    return undefined;
  }, [keepAwake, role, signedIn]);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Glancyr-Light': require('./assets/fonts/Glancyr-Light.otf'),
    'Glancyr-Regular': require('./assets/fonts/Glancyr-Regular.otf'),
    'Glancyr-Medium': require('./assets/fonts/Glancyr-Medium.otf'),
    'Glancyr-Semibold': require('./assets/fonts/Glancyr-Semibold.otf'),
    'Glancyr-Bold': require('./assets/fonts/Glancyr-Bold.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SessionProvider>
          <LanguageSync />
          <ShiftWake />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
