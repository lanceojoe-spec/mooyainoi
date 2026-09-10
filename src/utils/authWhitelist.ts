/**
 * Credentials for system login (Username & Password)
 */
export const APP_CREDENTIALS = {
  username: 'mooyainoi',
  password: 'Amazing*mooyainoi',
} as const;

export const PRIMARY_OWNER_EMAIL = 'lanceojoe@gmail.com';

export interface StoreAuthUser {
  username: string;
  displayName: string;
  role: string;
  loggedInAt: number;
}

const SESSION_STORAGE_KEY = 'pork_store_session_user';

/**
 * Verify user input against required system credentials
 */
export function verifyCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  const isUsernameMatch = username.trim().toLowerCase() === APP_CREDENTIALS.username.toLowerCase();
  const isPasswordMatch = password.trim() === APP_CREDENTIALS.password;
  return isUsernameMatch && isPasswordMatch;
}

/**
 * Get active saved session from localStorage
 */
export function getSavedSession(): StoreAuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username) {
      if (parsed.displayName !== 'ร้าน หมูยายน้อย') {
        parsed.displayName = 'ร้าน หมูยายน้อย';
        saveSession(parsed);
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Save active session to localStorage
 */
export function saveSession(user: StoreAuthUser): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

/**
 * Clear active session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Historical email list for Google Drive/Sheets authorization references
 */
export const AUTHORIZED_EMAILS = [
  'lanceojoe@gmail.com',
  'lanceokongkwan@gmail.com',
  'a.butsachat@gmail.com',
  'choochat052515@gmail.com',
] as const;

export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (AUTHORIZED_EMAILS as readonly string[]).includes(normalized);
}

export function isPrimaryOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
}

