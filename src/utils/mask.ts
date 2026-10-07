/**
 * Masks an email address for privacy in the UI.
 * Example: 'karthik@gmail.com' -> 'ka***ik@gmail.com'
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return email || '';
  }

  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username.charAt(0)}*@${domain}`;
  }
  if (username.length <= 4) {
    return `${username.charAt(0)}**${username.slice(-1)}@${domain}`;
  }

  const start = username.slice(0, 2);
  const end = username.slice(-2);
  const stars = '*'.repeat(Math.min(4, Math.max(3, username.length - 4)));
  return `${start}${stars}${end}@${domain}`;
}
