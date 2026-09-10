import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as fbSignOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets and Google Drive Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory & local access token caching
let isSigningIn = false;
const GOOGLE_TOKEN_STORAGE_KEY = 'pork_store_google_access_token';

export const getStoredGoogleToken = (): string | null => {
  try {
    const raw = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && Date.now() - (parsed.timestamp || 0) < 55 * 60 * 1000) {
      return parsed.token;
    }
  } catch {
    // ignore
  }
  return null;
};

export const saveStoredGoogleToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(
        GOOGLE_TOKEN_STORAGE_KEY,
        JSON.stringify({ token, timestamp: Date.now() })
      );
    } else {
      localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
};

let cachedAccessToken: string | null = getStoredGoogleToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || getStoredGoogleToken();
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      const savedToken = getStoredGoogleToken();
      if (savedToken) {
        cachedAccessToken = savedToken;
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถรับ Access Token จาก Google ได้');
    }

    cachedAccessToken = credential.accessToken;
    saveStoredGoogleToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    cachedAccessToken = getStoredGoogleToken();
  }
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  saveStoredGoogleToken(token);
};

export const logout = async (): Promise<void> => {
  await fbSignOut(auth);
  cachedAccessToken = null;
  saveStoredGoogleToken(null);
};
