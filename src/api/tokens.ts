import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'intore.accessToken';
const REFRESH = 'intore.refreshToken';

const memory = new Map<string, string>();

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memory.get(key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (value) memory.set(key, value);
    else memory.delete(key);
    return;
  }
  try {
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    /* device storage unavailable — session lasts until the app is closed */
  }
}

export async function loadStoredTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const [accessToken, refreshToken] = await Promise.all([read(ACCESS), read(REFRESH)]);
  return { accessToken, refreshToken };
}

export async function saveStoredTokens(accessToken: string | null, refreshToken: string | null): Promise<void> {
  await Promise.all([write(ACCESS, accessToken), write(REFRESH, refreshToken)]);
}
