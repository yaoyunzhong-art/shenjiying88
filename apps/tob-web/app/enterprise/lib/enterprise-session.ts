import type { EnterpriseUser } from '../../../lib/enterprise-auth-service';

export const ENTERPRISE_ACCESS_TOKEN_KEY = 'enterprise_access_token';
export const ENTERPRISE_REFRESH_TOKEN_KEY = 'enterprise_refresh_token';
export const ENTERPRISE_USER_KEY = 'enterprise_user';

export function normalizeEnterpriseUser(raw: unknown): EnterpriseUser {
  const record = (raw ?? {}) as Record<string, unknown>;

  return {
    userId: typeof record.userId === 'string' ? record.userId : '',
    tenantId: typeof record.tenantId === 'string' ? record.tenantId : '',
    email: typeof record.email === 'string' ? record.email : undefined,
    mobile: typeof record.mobile === 'string' ? record.mobile : undefined,
    nickname: typeof record.nickname === 'string' ? record.nickname : undefined,
    roles: Array.isArray(record.roles)
      ? record.roles.filter((item): item is string => typeof item === 'string')
      : [],
    permissions: Array.isArray(record.permissions)
      ? record.permissions.filter((item): item is string => typeof item === 'string')
      : [],
    avatar: typeof record.avatar === 'string' ? record.avatar : undefined,
  };
}

export function getEnterpriseAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(ENTERPRISE_ACCESS_TOKEN_KEY);
}

export function getCachedEnterpriseUser(): EnterpriseUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(ENTERPRISE_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const normalized = normalizeEnterpriseUser(JSON.parse(raw));
    if (!normalized.userId || !normalized.tenantId) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function storeEnterpriseSession(input: {
  accessToken: string;
  refreshToken: string;
  user: unknown;
}): EnterpriseUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const normalizedUser = normalizeEnterpriseUser(input.user);
  localStorage.setItem(ENTERPRISE_ACCESS_TOKEN_KEY, input.accessToken);
  localStorage.setItem(ENTERPRISE_REFRESH_TOKEN_KEY, input.refreshToken);
  localStorage.setItem(ENTERPRISE_USER_KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

export function clearEnterpriseSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ENTERPRISE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ENTERPRISE_REFRESH_TOKEN_KEY);
  localStorage.removeItem(ENTERPRISE_USER_KEY);
}

export function hasEnterprisePermission(
  user: EnterpriseUser | null | undefined,
  permission: string,
): boolean {
  if (!user) {
    return false;
  }

  return user.permissions.includes('*') || user.permissions.includes(permission);
}
