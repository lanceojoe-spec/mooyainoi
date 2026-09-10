export const AUTHORIZED_EMAILS = [
  'lanceojoe@gmail.com',
  'lanceokongkwan@gmail.com',
  'a.butsachat@gmail.com',
  'choochat052515@gmail.com',
] as const;

export const PRIMARY_OWNER_EMAIL = 'lanceojoe@gmail.com';

/**
 * Checks if the given email is in the allowed system users list
 */
export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (AUTHORIZED_EMAILS as readonly string[]).includes(normalized);
}

/**
 * Checks if the given email is the primary spreadsheet owner
 */
export function isPrimaryOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
}

/**
 * Returns formatted role name for display
 */
export function getEmailRoleDescription(email: string | null | undefined): string {
  if (!email) return 'ผู้ใช้งานทั่วไป';
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_OWNER_EMAIL.toLowerCase()) {
    return 'เจ้าของร้าน / ผู้ถือครอง Google Sheets';
  }
  return 'ทีมงานร้านหมู';
}
