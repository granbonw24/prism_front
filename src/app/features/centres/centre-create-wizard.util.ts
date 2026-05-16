import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { PromoteurOption, promoteurDetailsFromApi, refOptionLabel } from '@models/centre';

export type CentrePageMode = 'list' | 'create';

export type WizardSavedFiche = {
  idCentre: number | null;
  codeCentre: string | null;
  libelle: string | null;
};

export function centrePageModeFromRoute(data: Record<string, unknown> | undefined): CentrePageMode {
  return data?.['mode'] === 'create' ? 'create' : 'list';
}

/** Extrait code / libellé depuis la réponse POST createFull. */
export function wizardSavedFicheFromCreateResponse(body: unknown): WizardSavedFiche {
  const x = (body ?? {}) as Record<string, unknown>;
  const idRaw = x['idCentre'] ?? x['id'];
  let idCentre: number | null = null;
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) {
    idCentre = idRaw;
  } else if (idRaw != null && String(idRaw).trim() !== '') {
    const n = Number(idRaw);
    if (Number.isFinite(n)) idCentre = n;
  }
  const libelle =
    (x['libelle'] as string | undefined) ??
    (x['libelleAlpha'] as string | undefined) ??
    (x['libelleCec'] as string | undefined) ??
    (x['libellleCp'] as string | undefined) ??
    (x['libelleSie'] as string | undefined) ??
    null;
  return {
    idCentre,
    codeCentre: (x['codeCentre'] as string | undefined)?.trim() || null,
    libelle: libelle?.trim() || null,
  };
}

export function printCentreIdentificationFiche(elementId: string): void {
  const root = document.getElementById(elementId);
  if (!root || typeof window.print !== 'function') {
    return;
  }
  root.classList.add('is-printing');
  window.print();
  window.setTimeout(() => root.classList.remove('is-printing'), 0);
}

export function fetchPromoteurOptionDetails(
  http: HttpClient,
  apiBaseUrl: string,
  promoteurs: PromoteurOption[],
  id: number | null,
): Observable<PromoteurOption | null> {
  if (id == null) {
    return of(null);
  }
  const cached = promoteurs.find((p) => p.id === id);
  if (cached?.details?.personnePhysique || cached?.details?.personneMorale) {
    return of(cached);
  }
  return http.get<Record<string, unknown>>(`${apiBaseUrl}/api/promoteur/${id}`).pipe(
    map((row) => {
      const details = promoteurDetailsFromApi(row);
      const option: PromoteurOption = {
        id,
        code: details?.codePromoteur ?? (row['codePromoteur'] as string | undefined),
        libelle: details?.libellePromoteur ?? (row['libellePromoteur'] as string | undefined),
        details,
      };
      return option;
    }),
    tap((option) => {
      if (!option) return;
      const idx = promoteurs.findIndex((p) => p.id === id);
      if (idx >= 0) {
        promoteurs[idx] = { ...promoteurs[idx], ...option, details: option.details ?? promoteurs[idx].details };
      }
    }),
  );
}

export function promoteurRecapHeadline(option: PromoteurOption | null): string {
  if (!option) return '—';
  return refOptionLabel(option);
}
