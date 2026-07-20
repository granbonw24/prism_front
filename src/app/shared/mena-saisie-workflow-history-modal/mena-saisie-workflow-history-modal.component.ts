import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

export type SaisieWorkflowHistoriqueEtape = {
  action?: string | null;
  libelle?: string | null;
  acteur?: string | null;
  date?: string | null;
  detail?: string | null;
};

export type SaisieWorkflowHistorique = {
  resourcePath?: string | null;
  recordId?: number | null;
  workflowStatut?: string | null;
  workflowStatutLibelle?: string | null;
  etapes?: SaisieWorkflowHistoriqueEtape[] | null;
};

@Component({
  selector: 'app-mena-saisie-workflow-history-modal',
  standalone: true,
  imports: [MenaLoadingComponent, CommonModule],
  templateUrl: './mena-saisie-workflow-history-modal.component.html',
  styleUrl: './mena-saisie-workflow-history-modal.component.css',
})
export class MenaSaisieWorkflowHistoryModalComponent implements OnChanges {
  @Input() open = false;
  @Input() resource = '';
  @Input() recordId: number | string | null = null;
  @Input() title = 'Historique de validation';

  @Output() closed = new EventEmitter<void>();

  loading = false;
  errorMessage: string | null = null;
  data: SaisieWorkflowHistorique | null = null;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) {
      return;
    }
    if (changes['open'] || changes['resource'] || changes['recordId']) {
      this.load();
    }
  }

  get etapes(): SaisieWorkflowHistoriqueEtape[] {
    return this.data?.etapes ?? [];
  }

  onClose(): void {
    this.closed.emit();
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    return d.toLocaleString('fr-FR');
  }

  private load(): void {
    if (!this.resource || this.recordId == null) {
      this.errorMessage = 'Identifiant manquant pour l’historique.';
      this.data = null;
      return;
    }
    this.loading = true;
    this.errorMessage = null;
    this.data = null;
    this.http
      .get<SaisieWorkflowHistorique>(`${this.apiBaseUrl}/api/saisie-workflows/historique`, {
        params: {
          resource: this.resource,
          recordId: String(this.recordId),
        },
      })
      .subscribe({
        next: (data) => {
          this.data = data;
          this.loading = false;
        },
        error: (err: unknown) => {
          this.loading = false;
          this.errorMessage = this.formatError(err);
        },
      });
  }

  private formatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message = typeof err.error?.message === 'string' ? err.error.message : '';
      return message || `Erreur serveur: ${err.status} ${err.statusText}`;
    }
    return err instanceof Error ? err.message : 'Erreur inconnue';
  }
}
