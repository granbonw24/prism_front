import { Injectable } from '@angular/core';
import { AuthReference, AuthSession } from '@core/models/auth.models';

type ScopeEntry = {
  label: string;
  ref?: AuthReference | null;
  id?: number | null;
};

@Injectable({ providedIn: 'root' })
export class AuthPresentationService {
  roleLabel(session: AuthSession | null | undefined): string {
    const role = this.mainRole(session?.roles ?? []);
    if (!role) return 'Utilisateur';

    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      ADMINISTRATEUR: 'Administrateur',
      CONSEILLER: 'Conseiller',
      COORDONNATEUR: 'Coordonnateur',
      SUPERVISEUR: 'Superviseur',
      SUPERVISEUR_AENF: 'Superviseur AENF',
      DIRECTEUR: 'Directeur',
      IEPP: 'IEPP',
    };

    return labels[role] ?? this.titleCase(role);
  }

  scopeSummary(session: AuthSession | null | undefined): string {
    const scope = this.mainScope(session);
    return scope ? `${scope.label} ${this.referenceLabel(scope.ref, scope.id)}` : '';
  }

  headerLabel(session: AuthSession | null | undefined): string {
    if (!session) return 'Utilisateur';
    return [session.username, this.roleLabel(session), this.scopeSummary(session)]
      .filter(Boolean)
      .join(' · ');
  }

  allScopes(session: AuthSession | null | undefined): ScopeEntry[] {
    if (!session) return [];
    return [
      { label: 'Région', ref: session.region, id: session.idRegion },
      { label: 'DRENA', ref: session.drena, id: session.idDrena },
      { label: 'IEPP', ref: session.iep, id: session.idIep },
      { label: 'Département', ref: session.departement, id: session.idDepartement },
      { label: 'Sous-préfecture', ref: session.sousPrefecture, id: session.idSousPrefecture },
      { label: 'Commune', ref: session.commune, id: session.idCommune },
      { label: 'Localité', ref: session.localite, id: session.idLocalite },
    ].filter((item) => item.ref || item.id != null);
  }

  referenceLabel(ref: AuthReference | null | undefined, fallbackId?: number | null): string {
    const value = ref?.libelle ?? ref?.code ?? (fallbackId != null ? `#${fallbackId}` : '');
    return String(value).trim();
  }

  private mainRole(roles: string[]): string | null {
    const normalizedRoles = roles.map((role) => role.toUpperCase());
    const priority = [
      'ADMIN',
      'ADMINISTRATEUR',
      'SUPERVISEUR_AENF',
      'DIRECTEUR',
      'COORDONNATEUR',
      'SUPERVISEUR',
      'IEPP',
      'CONSEILLER',
    ];
    return priority.find((role) => normalizedRoles.includes(role)) ?? normalizedRoles[0] ?? null;
  }

  private mainScope(session: AuthSession | null | undefined): ScopeEntry | null {
    return (
      this.allScopes(session)
        .slice()
        .reverse()
        .find((item) => this.referenceLabel(item.ref, item.id).length > 0) ?? null
    );
  }

  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
