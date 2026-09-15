import { RBAC_BYPASS_ROLE_CODES } from '@core/config/menu-rbac.config';
import { CENTRAL_ADMIN_ROLE_CODES, isCentralAdmin } from '@core/auth/central-admin.util';
import { AuthService } from '@services/auth.service';

function mockAuth(roles: string[]): AuthService {
  return {
    currentSession: { roles, permissions: [] },
    hasAnyRole: (codes: string[]) => codes.some((c) => roles.includes(c)),
  } as unknown as AuthService;
}

describe('isCentralAdmin', () => {
  it('accepte SUPERVISEUR_AENF et DIRECTEUR', () => {
    for (const role of CENTRAL_ADMIN_ROLE_CODES) {
      expect(isCentralAdmin(mockAuth([role]))).toBeTrue();
    }
  });

  it('accepte les rôles bypass RBAC', () => {
    for (const role of RBAC_BYPASS_ROLE_CODES) {
      expect(isCentralAdmin(mockAuth([role]))).toBeTrue();
    }
  });

  it('refuse conseiller et coordonnateur', () => {
    expect(isCentralAdmin(mockAuth(['CONSEILLER']))).toBeFalse();
    expect(isCentralAdmin(mockAuth(['COORDONNATEUR']))).toBeFalse();
  });
});
