'use client';

export interface AdminSessionUser {
  userId: string;
  username?: string;
  email?: string;
  role: string;
  permissions: string[];
}

export const ADMIN_ACCESS_TOKEN_KEY = 'admin_access_token';
export const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token';
export const ADMIN_USER_KEY = 'admin_user';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function normalizeAdminSessionUser(raw: unknown): AdminSessionUser {
  const record = (raw ?? {}) as Record<string, unknown>;
  const username = typeof record.username === 'string' ? record.username : undefined;
  const email = typeof record.email === 'string' ? record.email : undefined;
  const role = typeof record.role === 'string' ? record.role : '';
  const userId =
    typeof record.userId === 'string' && record.userId
      ? record.userId
      : username
        ? `admin:${username}`
        : email
          ? `admin:${email}`
          : '';

  return {
    userId,
    username,
    email,
    role,
    permissions: Array.isArray(record.permissions)
      ? record.permissions.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export function getAdminAccessToken(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(ADMIN_ACCESS_TOKEN_KEY);
}

export function getCachedAdminUser(): AdminSessionUser | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(ADMIN_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const user = normalizeAdminSessionUser(JSON.parse(raw));
    if (!user.userId || !user.role) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function storeAdminSession(input: {
  accessToken: string;
  refreshToken: string;
  user: unknown;
}): AdminSessionUser | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const user = normalizeAdminSessionUser(input.user);
  storage.setItem(ADMIN_ACCESS_TOKEN_KEY, input.accessToken);
  storage.setItem(ADMIN_REFRESH_TOKEN_KEY, input.refreshToken);
  storage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  return user;
}

export function clearAdminSession(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  storage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  storage.removeItem(ADMIN_USER_KEY);
}

export function hasAdminPermission(
  user: AdminSessionUser | null | undefined,
  permission: string,
): boolean {
  if (!user) {
    return false;
  }

  return user.permissions.includes('*') || user.permissions.includes(permission);
}
