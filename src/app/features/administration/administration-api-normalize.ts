import { unwrapListBody } from '@core/http/unwrap-spring-page';
import type {
  AppRole,
  Fonctionnalite,
  Permission,
  RoleFonctionnalitePermission,
} from '@models/administration';

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

/**
 * Liste API au format B (`id`, `code`, `libelle`) ou entité plate historique.
 */
export function normalizeAppRole(raw: Record<string, unknown>): AppRole {
  return {
    id: num(raw['id']),
    codeRole: str(raw['codeRole'] ?? raw['code']) || undefined,
    libelleRole: str(raw['libelleRole'] ?? raw['libelle']) || undefined,
    descriptionRole: str(raw['descriptionRole']) || undefined,
  };
}

export function normalizeFonctionnalite(raw: Record<string, unknown>): Fonctionnalite {
  return {
    id: num(raw['id']),
    codeFonctionnalite: str(raw['codeFonctionnalite'] ?? raw['code']) || undefined,
    libelleFonctionnalite: str(raw['libelleFonctionnalite'] ?? raw['libelle']) || undefined,
    module: str(raw['module']) || undefined,
  };
}

export function normalizePermission(raw: Record<string, unknown>): Permission {
  return {
    id: num(raw['id']),
    codePermission: str(raw['codePermission'] ?? raw['code']) || undefined,
    libellePermission: str(raw['libellePermission'] ?? raw['libelle']) || undefined,
  };
}

/**
 * Réponse {@code putRef(..., "AppRole", ...)} → clé JSON {@code appRole}, pas {@code role}.
 */
export function normalizeRoleFonctionnalitePermission(
  raw: Record<string, unknown>,
): RoleFonctionnalitePermission {
  const roleObj = (raw['role'] ?? raw['appRole']) as Record<string, unknown> | undefined;
  const fnObj = raw['fonctionnalite'] as Record<string, unknown> | undefined;
  const permObj = raw['permission'] as Record<string, unknown> | undefined;
  return {
    id: num(raw['id']),
    role: roleObj ? { id: num(roleObj['id']) } : undefined,
    fonctionnalite: fnObj ? { id: num(fnObj['id']) } : undefined,
    permission: permObj ? { id: num(permObj['id']) } : undefined,
  };
}

export function normalizeAppRoleList(body: unknown): AppRole[] {
  return unwrapListBody(body).map((x) => normalizeAppRole(x as Record<string, unknown>));
}

export function normalizeFonctionnaliteList(body: unknown): Fonctionnalite[] {
  return unwrapListBody(body).map((x) => normalizeFonctionnalite(x as Record<string, unknown>));
}

export function normalizePermissionList(body: unknown): Permission[] {
  return unwrapListBody(body).map((x) => normalizePermission(x as Record<string, unknown>));
}

export function normalizeRfpList(body: unknown): RoleFonctionnalitePermission[] {
  return unwrapListBody(body).map((x) =>
    normalizeRoleFonctionnalitePermission(x as Record<string, unknown>),
  );
}
