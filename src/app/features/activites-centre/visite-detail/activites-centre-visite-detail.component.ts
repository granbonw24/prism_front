import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import type { VisitePayload, VisiteRow } from '@models/visite';

type DetailFieldKey = Exclude<keyof VisitePayload, 'mode' | 'idPeriodeActivite' | 'idAlpha' | 'idNiveauAlpha'>;

type DetailField = {
  key: DetailFieldKey;
  label: string;
  section: 'points' | 'conseiller';
};

const DETAIL_FIELDS: DetailField[] = [
  { section: 'points', key: 'maitriseSeanceLecture', label: 'Maîtrise des séances de lecture' },
  { section: 'points', key: 'maitriseSeanceEcriture', label: 'Maîtrise des séances d’écriture' },
  { section: 'points', key: 'maitriseSeanceCalcul', label: 'Maîtrise des séances de calcul' },
  { section: 'points', key: 'maitriseSeanceCvc', label: 'Maîtrise des séances CVC' },
  { section: 'conseiller', key: 'nombreVisiteRealiseParConseiller', label: 'Nombre des visites réalisées' },
  { section: 'conseiller', key: 'nombreBulletinEffectueParConseiller', label: 'Nombre de bulletins effectués' },
];

@Component({
  selector: 'app-activites-centre-visite-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activites-centre-visite-detail.component.html',
  styleUrl: './activites-centre-visite-detail.component.css',
})
export class ActivitesCentreVisiteDetailComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  row: VisiteRow | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Identifiant de visite manquant.';
      return;
    }
    this.loading = true;
    this.http.get<VisiteRow>(`${this.apiBaseUrl}/api/visite/${encodeURIComponent(id)}`).subscribe({
      next: (row) => {
        this.row = row;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.formatError(err);
      },
    });
  }

  fields(section: DetailField['section']): DetailField[] {
    return DETAIL_FIELDS.filter((field) => field.section === section);
  }

  alphaLabel(): string {
    const ref = this.row?.alpha;
    if (!ref) {
      return '—';
    }
    return [ref.code, ref.libelle].filter(Boolean).join(' — ') || `Alpha #${ref.id ?? '—'}`;
  }

  value(key: DetailFieldKey): string | number {
    const raw = this.row?.[key];
    if (raw === 'BONNE') return 'Bonne';
    if (raw === 'MOYENNE') return 'Moyenne';
    if (raw === 'MAUVAISE') return 'Mauvaise';
    if (raw === 'OUI') return 'Bonne';
    if (raw === 'NON') return 'Mauvaise';
    return raw ?? '—';
  }

  private formatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message = typeof err.error?.message === 'string' ? err.error.message : '';
      return message ? `Erreur serveur: ${err.status} ${err.statusText} — ${message}` : `Erreur serveur: ${err.status} ${err.statusText}`;
    }
    return err instanceof Error ? err.message : 'Erreur inconnue';
  }
}
