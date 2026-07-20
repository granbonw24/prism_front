import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { formatHttpError } from '@core/utils/http-error.util';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';

@Component({
  selector: 'app-apprenant-import-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MenaToolbarButtonComponent],
  template: `
    <div class="container-fluid">
      <div class="d-sm-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 class="h4 mb-0 text-gray-800">Chargement liste des apprenants</h1>
          <p class="small text-muted mb-0 mt-1">
            Importez le modèle officiel PRISM (Excel .xlsx ou CSV). Colonnes :
            <code>nom;prenom;sexe;dateNaissance</code>.
          </p>
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger py-2">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success py-2">{{ successMessage }}</div>

      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header py-3 bg-white border-bottom-0">
          <h6 class="m-0 font-weight-bold text-primary">1. Télécharger le modèle</h6>
        </div>
        <div class="card-body pt-0">
          <p class="small text-muted mb-3">
            Le fichier Excel est généré par le serveur aux couleurs PRISM MENA (en-tête orange, exemples sur fond crème).
            Remplissez la feuille <strong>Apprenants</strong> puis importez-la ci-dessous.
          </p>
          <div class="mena-toolbar">
            <app-mena-toolbar-btn
              variant="add-outline"
              label="Modèle Excel (.xlsx)"
              [disabled]="downloading"
              [loading]="downloadingExcel"
              (clicked)="downloadTemplate('excel')"
            />
            <app-mena-toolbar-btn
              variant="add-outline"
              label="Modèle CSV"
              [disabled]="downloading"
              [loading]="downloadingCsv"
              (clicked)="downloadTemplate('csv')"
            />
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header py-3 bg-white border-bottom-0">
          <h6 class="m-0 font-weight-bold text-primary">2. Importer le fichier rempli</h6>
        </div>
        <div class="card-body pt-0">
          <div class="form-group">
            <label class="small text-muted">Fichier (.xlsx ou .csv)</label>
            <input
              type="file"
              class="form-control-file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              (change)="onFileSelected($event)"
            />
          </div>
          <div class="mena-toolbar mt-3">
            <app-mena-toolbar-btn
              variant="save"
              [label]="uploading ? 'Import…' : 'Importer'"
              [disabled]="uploading || !selectedFile"
              [loading]="uploading"
              (clicked)="upload()"
            />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApprenantImportPageComponent {
  selectedFile: File | null = null;
  uploading = false;
  downloadingExcel = false;
  downloadingCsv = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  get downloading(): boolean {
    return this.downloadingExcel || this.downloadingCsv;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  downloadTemplate(format: 'excel' | 'csv'): void {
    this.errorMessage = null;
    this.successMessage = null;
    const isExcel = format === 'excel';
    if (isExcel) {
      this.downloadingExcel = true;
    } else {
      this.downloadingCsv = true;
    }
    const url = isExcel
      ? `${this.apiBaseUrl}/api/apprenants/import/modele`
      : `${this.apiBaseUrl}/api/apprenants/import/modele.csv`;
    const filename = isExcel
      ? 'PRISM_modele_import_apprenants.xlsx'
      : 'PRISM_modele_import_apprenants.csv';
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.triggerBrowserDownload(blob, filename);
        this.downloadingExcel = false;
        this.downloadingCsv = false;
        this.successMessage = `Modèle téléchargé : ${filename}`;
      },
      error: (err) => {
        this.downloadingExcel = false;
        this.downloadingCsv = false;
        this.errorMessage = formatHttpError(err, 'Impossible de télécharger le modèle.');
      },
    });
  }

  upload(): void {
    if (!this.selectedFile) {
      return;
    }
    const form = new FormData();
    form.append('file', this.selectedFile);
    this.uploading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.http.post<{ message?: string; lignesDonnees?: number }>(`${this.apiBaseUrl}/api/apprenants/import`, form).subscribe({
      next: (res) => {
        this.uploading = false;
        this.successMessage = res.message ?? `Import terminé (${res.lignesDonnees ?? 0} ligne(s)).`;
      },
      error: (err) => {
        this.uploading = false;
        this.errorMessage = formatHttpError(err, "Échec de l'import des apprenants.");
      },
    });
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
}
