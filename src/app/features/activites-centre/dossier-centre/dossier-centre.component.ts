import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { forkJoin } from 'rxjs';

type Ref = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
};

type CentreOption = {
  id?: number | null;
  codeCentre?: string | null;
  localisationCentre?: string | null;
};

type AppuiRow = {
  id?: number | null;
  centre?: Ref | null;
  partenaire?: Ref | null;
  categorieAppui?: Ref | null;
  codeAppuiPartenaire?: string | null;
  libelleAppuiPartenaire?: string | null;
};

type DocumentRow = {
  id?: number | null;
  centre?: Ref | null;
  natureDocument?: Ref | null;
  typeDocument?: Ref | null;
  codeDocument?: string | null;
  existe?: string | null;
  ajour?: string | null;
  bientenu?: string | null;
  respmethode?: string | null;
  bienrensigne?: string | null;
};

type AppuiForm = {
  idPartenaire: number | null;
  idCategorieAppui: number | null;
  libelleAppuiPartenaire: string;
};

type DocumentForm = {
  idNatureDocument: number | null;
  idTypeDocument: number | null;
  codeDocument: string;
  existe: string;
  ajour: string;
  bientenu: string;
  respmethode: string;
  bienrensigne: string;
};

@Component({
  selector: 'app-dossier-centre',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-sm-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 class="h4 mb-1 text-gray-800">ACTIVITES CENTRE — Dossier centre</h1>
          <p class="small text-muted mb-0">
            Centralise les appuis, partenariats et documents à jour pour tous les types de centre.
          </p>
        </div>
        <button class="btn btn-sm btn-outline-primary mt-2 mt-sm-0" type="button" (click)="reload()" [disabled]="loading || saving">
          Rafraîchir
        </button>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger py-2">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success py-2">{{ successMessage }}</div>

      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <label class="small text-muted mb-1">Centre</label>
          <select class="form-control" [(ngModel)]="selectedCentreId" (ngModelChange)="onCentreChange()">
            <option [ngValue]="null">Sélectionner un centre</option>
            <option *ngFor="let centre of centres" [ngValue]="centre.id ?? null">{{ centreLabel(centre) }}</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading" class="small text-muted py-3">Chargement...</div>

      <div *ngIf="!loading && selectedCentreId == null" class="alert alert-info py-2">
        Sélectionner un centre pour définir son dossier.
      </div>

      <div *ngIf="!loading && selectedCentreId != null" class="row">
        <div class="col-lg-6 mb-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white">
              <h6 class="m-0 font-weight-bold text-primary">Appuis et partenariats</h6>
            </div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label>Partenaire</label>
                  <select class="form-control" [(ngModel)]="appuiForm.idPartenaire">
                    <option [ngValue]="null">Sélectionner</option>
                    <option *ngFor="let p of partenaires" [ngValue]="p.id ?? null">{{ refLabel(p) }}</option>
                  </select>
                </div>
                <div class="form-group col-md-6">
                  <label>Catégorie d'appui</label>
                  <select class="form-control" [(ngModel)]="appuiForm.idCategorieAppui">
                    <option [ngValue]="null">Sélectionner</option>
                    <option *ngFor="let c of categoriesAppui" [ngValue]="c.id ?? null">{{ refLabel(c) }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Libellé de l'appui</label>
                <input class="form-control" [(ngModel)]="appuiForm.libelleAppuiPartenaire" maxlength="150" />
              </div>
              <button class="btn btn-sm btn-primary" type="button" (click)="saveAppui()" [disabled]="saving">
                Ajouter l'appui
              </button>

              <hr />
              <div *ngIf="filteredAppuis.length === 0" class="small text-muted">Aucun appui enregistré pour ce centre.</div>
              <div class="table-responsive" *ngIf="filteredAppuis.length > 0">
                <table class="table table-sm table-bordered">
                  <thead class="thead-light">
                    <tr>
                      <th>Partenaire</th>
                      <th>Catégorie</th>
                      <th>Appui</th>
                      <th class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of filteredAppuis">
                      <td>{{ refLabel(row.partenaire) }}</td>
                      <td>{{ refLabel(row.categorieAppui) }}</td>
                      <td>
                        <div>{{ row.libelleAppuiPartenaire || '-' }}</div>
                        <div class="small text-muted">{{ row.codeAppuiPartenaire || '' }}</div>
                      </td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAppui(row)" [disabled]="saving">Supprimer</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6 mb-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 class="m-0 font-weight-bold text-primary">Documents du centre</h6>
              <span class="badge" [ngClass]="documentsUpToDate ? 'badge-success' : 'badge-warning'">
                {{ documentsUpToDate ? 'Documents à jour' : 'À compléter' }}
              </span>
            </div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label>Nature</label>
                  <select class="form-control" [(ngModel)]="documentForm.idNatureDocument">
                    <option [ngValue]="null">Sélectionner</option>
                    <option *ngFor="let n of naturesDocument" [ngValue]="n.id ?? null">{{ refLabel(n) }}</option>
                  </select>
                </div>
                <div class="form-group col-md-6">
                  <label>Type</label>
                  <select class="form-control" [(ngModel)]="documentForm.idTypeDocument">
                    <option [ngValue]="null">Sélectionner</option>
                    <option *ngFor="let t of typesDocument" [ngValue]="t.id ?? null">{{ refLabel(t) }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label>Code document</label>
                  <input class="form-control" [(ngModel)]="documentForm.codeDocument" maxlength="50" />
                </div>
                <div class="form-group col-md-6">
                  <label>Existe</label>
                  <select class="form-control" [(ngModel)]="documentForm.existe">
                    <option value="">Non renseigné</option>
                    <option *ngFor="let option of yesNoOptions" [value]="option">{{ option }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group col-md-4">
                  <label>À jour</label>
                  <select class="form-control" [(ngModel)]="documentForm.ajour">
                    <option value="">Non renseigné</option>
                    <option *ngFor="let option of yesNoOptions" [value]="option">{{ option }}</option>
                  </select>
                </div>
                <div class="form-group col-md-4">
                  <label>Bien tenu</label>
                  <select class="form-control" [(ngModel)]="documentForm.bientenu">
                    <option value="">Non renseigné</option>
                    <option *ngFor="let option of yesNoOptions" [value]="option">{{ option }}</option>
                  </select>
                </div>
                <div class="form-group col-md-4">
                  <label>Bien renseigné</label>
                  <select class="form-control" [(ngModel)]="documentForm.bienrensigne">
                    <option value="">Non renseigné</option>
                    <option *ngFor="let option of yesNoOptions" [value]="option">{{ option }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Responsable méthode</label>
                <select class="form-control" [(ngModel)]="documentForm.respmethode">
                  <option value="">Non renseigné</option>
                  <option *ngFor="let option of yesNoOptions" [value]="option">{{ option }}</option>
                </select>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <button class="btn btn-sm btn-primary mr-1" type="button" (click)="saveDocument()" [disabled]="saving">
                  {{ editingDocumentId == null ? 'Ajouter le document' : 'Mettre à jour le document' }}
                </button>
                <button *ngIf="editingDocumentId != null" class="btn btn-sm btn-light" type="button" (click)="cancelDocumentEdit()" [disabled]="saving">
                  Annuler
                </button>
              </div>

              <hr />
              <div *ngIf="filteredDocuments.length === 0" class="small text-muted">Aucun document enregistré pour ce centre.</div>
              <div class="table-responsive" *ngIf="filteredDocuments.length > 0">
                <table class="table table-sm table-bordered">
                  <thead class="thead-light">
                    <tr>
                      <th>Document</th>
                      <th>Existe</th>
                      <th>À jour</th>
                      <th>Qualité</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of filteredDocuments">
                      <td>
                        <div>{{ refLabel(row.typeDocument) }}</div>
                        <div class="small text-muted">{{ refLabel(row.natureDocument) }} {{ row.codeDocument || '' }}</div>
                      </td>
                      <td>{{ row.existe || '-' }}</td>
                      <td>{{ row.ajour || '-' }}</td>
                      <td>
                        <div>Bien tenu : {{ row.bientenu || '-' }}</div>
                        <div>Resp. méthode : {{ row.respmethode || '-' }}</div>
                        <div>Bien renseigné : {{ row.bienrensigne || '-' }}</div>
                      </td>
                      <td class="text-center text-nowrap">
                        <button class="btn btn-sm btn-outline-primary mr-1" type="button" (click)="editDocument(row)" [disabled]="saving">Modifier</button>
                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteDocument(row)" [disabled]="saving">Supprimer</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DossierCentreComponent implements OnInit {
  readonly yesNoOptions = ['Oui', 'Non'];

  centres: CentreOption[] = [];
  appuis: AppuiRow[] = [];
  documents: DocumentRow[] = [];
  partenaires: Ref[] = [];
  categoriesAppui: Ref[] = [];
  naturesDocument: Ref[] = [];
  typesDocument: Ref[] = [];

  selectedCentreId: number | null = null;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  editingDocumentId: number | null = null;

  appuiForm: AppuiForm = this.emptyAppuiForm();
  documentForm: DocumentForm = this.emptyDocumentForm();

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  get filteredAppuis(): AppuiRow[] {
    if (this.selectedCentreId == null) return [];
    return this.appuis.filter((row) => row.centre?.id === this.selectedCentreId);
  }

  get filteredDocuments(): DocumentRow[] {
    if (this.selectedCentreId == null) return [];
    return this.documents.filter((row) => row.centre?.id === this.selectedCentreId);
  }

  get documentsUpToDate(): boolean {
    const rows = this.filteredDocuments;
    return rows.length > 0 && rows.every((row) => this.isYes(row.existe) && this.isYes(row.ajour));
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      centres: this.http.get<unknown>(`${this.apiBaseUrl}/api/centres`),
      appuis: this.http.get<unknown>(`${this.apiBaseUrl}/api/appui-partenaire`),
      documents: this.http.get<unknown>(`${this.apiBaseUrl}/api/documents`),
      partenaires: this.http.get<unknown>(`${this.apiBaseUrl}/api/Partenaires`),
      categoriesAppui: this.http.get<unknown>(`${this.apiBaseUrl}/api/categorieappuis`),
      naturesDocument: this.http.get<unknown>(`${this.apiBaseUrl}/api/naturedocument`),
      typesDocument: this.http.get<unknown>(`${this.apiBaseUrl}/api/TypeDocuments`),
    }).subscribe({
      next: (res) => {
        this.centres = unwrapListBody(res.centres) as CentreOption[];
        this.appuis = unwrapListBody(res.appuis) as AppuiRow[];
        this.documents = unwrapListBody(res.documents) as DocumentRow[];
        this.partenaires = unwrapListBody(res.partenaires).map((row) => this.refFromAny(row, 'codePartenaire', 'libellePartenaire'));
        this.categoriesAppui = unwrapListBody(res.categoriesAppui).map((row) => this.refFromAny(row, 'codeCategorieAppui', 'libelleCategorieAppui'));
        this.naturesDocument = unwrapListBody(res.naturesDocument).map((row) => this.refFromAny(row, null, 'libelleNatureDocument'));
        this.typesDocument = unwrapListBody(res.typesDocument).map((row) => this.refFromAny(row, 'codeTypeDocument', 'libelleTypeDocument'));
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  onCentreChange(): void {
    this.appuiForm = this.emptyAppuiForm();
    this.cancelDocumentEdit();
    this.successMessage = null;
    this.errorMessage = null;
  }

  saveAppui(): void {
    if (this.selectedCentreId == null || this.appuiForm.idPartenaire == null || this.appuiForm.idCategorieAppui == null) {
      this.errorMessage = 'Centre, partenaire et catégorie d’appui sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    this.http.post(`${this.apiBaseUrl}/api/appui-partenaire`, {
      idCentre: this.selectedCentreId,
      idPartenaire: this.appuiForm.idPartenaire,
      idCategorieAppui: this.appuiForm.idCategorieAppui,
      libelleAppuiPartenaire: this.appuiForm.libelleAppuiPartenaire.trim(),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Appui enregistré.';
        this.appuiForm = this.emptyAppuiForm();
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  deleteAppui(row: AppuiRow): void {
    if (row.id == null || !window.confirm('Supprimer cet appui ?')) return;
    this.saving = true;
    this.http.delete(`${this.apiBaseUrl}/api/appui-partenaire/${row.id}`).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Appui supprimé.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  saveDocument(): void {
    if (this.selectedCentreId == null || this.documentForm.idNatureDocument == null || this.documentForm.idTypeDocument == null) {
      this.errorMessage = 'Centre, nature et type de document sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    const payload = {
      idCentre: this.selectedCentreId,
      idNatureDocument: this.documentForm.idNatureDocument,
      idTypeDocument: this.documentForm.idTypeDocument,
      codeDocument: this.clean(this.documentForm.codeDocument),
      existe: this.clean(this.documentForm.existe),
      ajour: this.clean(this.documentForm.ajour),
      bientenu: this.clean(this.documentForm.bientenu),
      respmethode: this.clean(this.documentForm.respmethode),
      bienrensigne: this.clean(this.documentForm.bienrensigne),
    };
    const request =
      this.editingDocumentId == null
        ? this.http.post(`${this.apiBaseUrl}/api/documents`, payload)
        : this.http.put(`${this.apiBaseUrl}/api/documents/${this.editingDocumentId}`, payload);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.editingDocumentId == null ? 'Document enregistré.' : 'Document mis à jour.';
        this.cancelDocumentEdit();
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  editDocument(row: DocumentRow): void {
    this.editingDocumentId = row.id ?? null;
    this.documentForm = {
      idNatureDocument: row.natureDocument?.id ?? null,
      idTypeDocument: row.typeDocument?.id ?? null,
      codeDocument: row.codeDocument ?? '',
      existe: row.existe ?? '',
      ajour: row.ajour ?? '',
      bientenu: row.bientenu ?? '',
      respmethode: row.respmethode ?? '',
      bienrensigne: row.bienrensigne ?? '',
    };
  }

  cancelDocumentEdit(): void {
    this.editingDocumentId = null;
    this.documentForm = this.emptyDocumentForm();
  }

  deleteDocument(row: DocumentRow): void {
    if (row.id == null || !window.confirm('Supprimer ce document ?')) return;
    this.saving = true;
    this.http.delete(`${this.apiBaseUrl}/api/documents/${row.id}`).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Document supprimé.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  centreLabel(centre: CentreOption): string {
    return [centre.codeCentre, centre.localisationCentre].filter(Boolean).join(' — ') || `Centre ${centre.id ?? ''}`;
  }

  refLabel(ref: Ref | null | undefined): string {
    if (!ref) return '-';
    return [ref.code, ref.libelle].filter(Boolean).join(' — ') || `#${ref.id ?? ''}`;
  }

  private refFromAny(raw: unknown, codeKey: string | null, libelleKey: string): Ref {
    const row = raw as Record<string, unknown>;
    return {
      id: typeof row['id'] === 'number' ? row['id'] : null,
      code: codeKey && row[codeKey] != null ? String(row[codeKey]) : null,
      libelle: row[libelleKey] != null ? String(row[libelleKey]) : null,
    };
  }

  private emptyAppuiForm(): AppuiForm {
    return {
      idPartenaire: null,
      idCategorieAppui: null,
      libelleAppuiPartenaire: '',
    };
  }

  private emptyDocumentForm(): DocumentForm {
    return {
      idNatureDocument: null,
      idTypeDocument: null,
      codeDocument: '',
      existe: '',
      ajour: '',
      bientenu: '',
      respmethode: '',
      bienrensigne: '',
    };
  }

  private isYes(value: string | null | undefined): boolean {
    return (value ?? '').trim().toLowerCase() === 'oui';
  }

  private clean(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private httpError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'object' && body?.message) return body.message;
    if (typeof body === 'string' && body.trim()) return body;
    return err.message || 'Une erreur est survenue.';
  }
}
