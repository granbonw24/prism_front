import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AuthService } from '@services/auth.service';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import { DossierCentreLiaisonTabComponent } from './dossier-centre-liaison-tab.component';
import {
  liaisonConfigForSection,
  visibleLiaisonSections,
} from './dossier-centre-liaison.config';
import type { DossierCentreLiaisonConfig } from './dossier-centre-liaison.config';
import {
  sortByLabel,
  toMenaSelectOptions,
  toMenaSelectOptionsFromPairs,
} from '@shared/mena-searchable-select/mena-select-options.util';
import { forkJoin } from 'rxjs';

type CentreType = 'alpha' | 'cec' | 'cp' | 'sie';
type WorkflowStatus =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'VALIDEE_COORDONNATEUR'
  | 'VALIDEE_SUPERVISEUR'
  | 'VALIDEE_CENTRALE'
  | 'REJETE'
  | 'RETOURNE';

type Ref = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
};

type CentreOption = {
  idCentre?: number | null;
  id?: number | null;
  codeCentre?: string | null;
  codeType?: string | null;
  libelle?: string | null;
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
  workflowStatut?: WorkflowStatus | null;
  workflowEditable?: boolean | null;
  workflowMotifRejet?: string | null;
  workflowCommentaireRetour?: string | null;
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

type DossierSection = 'appuis' | 'documents' | string;

@Component({
  selector: 'app-dossier-centre',
  standalone: true,
  imports: [
    MenaLoadingComponent,
    CommonModule,
    FormsModule,
    MenaSearchableSelectComponent,
    MenaContextDashboardComponent,
    DossierCentreLiaisonTabComponent,
  ],
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

      <app-mena-context-dashboard
        module="ACTIVITES"
        subModule="dossier"
        [centreType]="selectedCentreType ? selectedCentreType.toUpperCase() : undefined"
        [centreId]="selectedCentreId"
      />

      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="form-row">
            <div class="form-group col-md-4 mb-md-0">
              <label class="small text-muted mb-1">Type de centre</label>
              <app-mena-searchable-select
                [(ngModel)]="selectedCentreType"
                (ngModelChange)="onCentreTypeChange()"
                [options]="menaCentreTypeOptions()"
                nullLabel="Sélectionner"
                [searchable]="false"
                [loading]="loading"
              />
            </div>
            <div class="form-group col-md-8 mb-0">
              <label class="small text-muted mb-1">Centre</label>
              <app-mena-searchable-select
                [(ngModel)]="selectedCentreId"
                (ngModelChange)="onCentreChange($event)"
                [options]="menaCentreOptions()"
                nullLabel="Sélectionner un centre"
                [disabled]="!selectedCentreType || centresLoading"
                [loading]="centresLoading"
              />
            </div>
          </div>
        </div>
      </div>

      <app-mena-loading *ngIf="loading" message="Chargement du dossier…" [centered]="true" />

      <div *ngIf="!loading && selectedCentreType == null" class="alert alert-info py-2">
        Sélectionner d’abord le type de centre.
      </div>

      <div *ngIf="!loading && selectedCentreType != null && selectedCentreId == null" class="alert alert-info py-2">
        Sélectionner ensuite le centre concerné.
      </div>

      <div *ngIf="!loading && selectedCentreId != null" class="card border-0 shadow-sm mb-3">
        <div class="card-body py-2">
          <div class="d-flex flex-wrap" style="gap: 0.35rem" role="group" aria-label="Sections du dossier centre">
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="activeSection === 'appuis'"
              [class.btn-outline-primary]="activeSection !== 'appuis'"
              (click)="activeSection = 'appuis'"
            >
              Appuis et partenariats
            </button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="activeSection === 'documents'"
              [class.btn-outline-primary]="activeSection !== 'documents'"
              (click)="activeSection = 'documents'"
            >
              Documents du centre
            </button>
            <button
              *ngFor="let tab of visibleLiaisonTabs"
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="activeSection === tab.section"
              [class.btn-outline-primary]="activeSection !== tab.section"
              (click)="activeSection = tab.section"
            >
              {{ tab.shortLabel }}
            </button>
          </div>
        </div>
      </div>

      <ng-container *ngIf="!loading && selectedCentreId != null">
        <app-dossier-centre-liaison-tab
          *ngIf="activeLiaisonConfig as liaisonCfg"
          [config]="liaisonCfg"
          [centreId]="selectedCentreId"
        />
        <div *ngIf="activeSection === 'appuis'" class="mb-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white">
              <h6 class="m-0 font-weight-bold text-primary">Appuis et partenariats</h6>
            </div>
            <div class="card-body">
              <div class="border rounded bg-light p-3 mb-3">
                <h6 class="font-weight-bold mb-3">Ajouter un appui</h6>
                <div class="form-row">
                  <div class="form-group col-md-6">
                    <label>Partenaire</label>
                    <app-mena-searchable-select
                      [(ngModel)]="appuiForm.idPartenaire"
                      [options]="menaPartenaireOptions()"
                      nullLabel="Sélectionner"
                      [loading]="loading"
                    />
                  </div>
                  <div class="form-group col-md-6">
                    <label>Catégorie d'appui</label>
                    <app-mena-searchable-select
                      [(ngModel)]="appuiForm.idCategorieAppui"
                      [options]="menaCategorieAppuiOptions()"
                      nullLabel="Sélectionner"
                      [loading]="loading"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label>Libellé de l'appui</label>
                  <input class="form-control" [(ngModel)]="appuiForm.libelleAppuiPartenaire" maxlength="150" />
                </div>
                <button class="btn btn-sm btn-primary" type="button" (click)="saveAppui()" [disabled]="saving">
                  Ajouter l'appui
                </button>
              </div>

              <h6 class="font-weight-bold text-muted">Appuis enregistrés</h6>
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

        <div *ngIf="activeSection === 'documents'" class="mb-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 class="m-0 font-weight-bold text-primary">Documents du centre</h6>
              <span class="badge" [ngClass]="documentsUpToDate ? 'badge-success' : 'badge-warning'">
                {{ documentsUpToDate ? 'Documents à jour' : 'À compléter' }}
              </span>
            </div>
            <div class="card-body">
              <div class="border rounded bg-light p-3 mb-3">
                <h6 class="font-weight-bold mb-3">{{ editingDocumentId == null ? 'Ajouter un document' : 'Modifier le document' }}</h6>
                <div class="form-row">
                  <div class="form-group col-md-6">
                    <label>Nature</label>
                    <app-mena-searchable-select
                      [(ngModel)]="documentForm.idNatureDocument"
                      [options]="menaNatureDocumentOptions()"
                      nullLabel="Sélectionner"
                      [loading]="loading"
                    />
                  </div>
                  <div class="form-group col-md-6">
                    <label>Type</label>
                    <app-mena-searchable-select
                      [(ngModel)]="documentForm.idTypeDocument"
                      [options]="menaTypeDocumentOptions()"
                      nullLabel="Sélectionner"
                      [loading]="loading"
                    />
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
              </div>

              <h6 class="font-weight-bold text-muted">Documents enregistrés</h6>
              <div *ngIf="filteredDocuments.length === 0" class="small text-muted">Aucun document enregistré pour ce centre.</div>
              <div class="table-responsive" *ngIf="filteredDocuments.length > 0">
                <table class="table table-sm table-bordered">
                  <thead class="thead-light">
                    <tr>
                      <th>Document</th>
                      <th>Existe</th>
                      <th>À jour</th>
                      <th>Qualité</th>
                      <th>Validation</th>
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
                      <td>
                        <span class="badge" [ngClass]="documentWorkflowBadge(row)" [title]="documentWorkflowTooltip(row)">
                          {{ documentWorkflowLabel(row) }}
                        </span>
                      </td>
                      <td class="text-center text-nowrap">
                        <button class="btn btn-sm btn-outline-primary mr-1" type="button" (click)="editDocument(row)" [disabled]="saving || !documentEditable(row)">Modifier</button>
                        <button class="btn btn-sm btn-outline-warning mr-1" type="button" (click)="submitDocument(row)" *ngIf="canSubmitDocument(row)" [disabled]="saving">Soumettre</button>
                        <button class="btn btn-sm btn-outline-success mr-1" type="button" (click)="validateDocument(row)" *ngIf="canDecideDocument(row)" [disabled]="saving">Valider</button>
                        <button class="btn btn-sm btn-outline-danger mr-1" type="button" (click)="rejectDocument(row)" *ngIf="canDecideDocument(row)" [disabled]="saving">Rejeter</button>
                        <button class="btn btn-sm btn-outline-secondary mr-1" type="button" (click)="returnDocument(row)" *ngIf="canDecideDocument(row)" [disabled]="saving">Retourner</button>
                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteDocument(row)" [disabled]="saving || !documentEditable(row)">Supprimer</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class DossierCentreComponent implements OnInit {
  readonly yesNoOptions = ['Oui', 'Non'];
  readonly centreTypeOptions: Array<{ value: CentreType; label: string }> = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'cec', label: 'CEC' },
    { value: 'cp', label: 'CP' },
    { value: 'sie', label: 'SIE' },
  ];
  private readonly centreApiByType: Record<CentreType, string> = {
    alpha: '/api/alpha',
    cec: '/api/cec',
    cp: '/api/cp',
    sie: '/api/sie',
  };

  centres: CentreOption[] = [];
  appuis: AppuiRow[] = [];
  documents: DocumentRow[] = [];
  partenaires: Ref[] = [];
  categoriesAppui: Ref[] = [];
  naturesDocument: Ref[] = [];
  typesDocument: Ref[] = [];

  selectedCentreType: CentreType | null = null;
  selectedCentreId: number | null = null;
  activeSection: DossierSection = 'appuis';
  loading = false;
  centresLoading = false;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  editingDocumentId: number | null = null;

  appuiForm: AppuiForm = this.emptyAppuiForm();
  documentForm: DocumentForm = this.emptyDocumentForm();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
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

  get visibleLiaisonTabs(): DossierCentreLiaisonConfig[] {
    return visibleLiaisonSections(this.selectedCentreType);
  }

  get activeLiaisonConfig(): DossierCentreLiaisonConfig | undefined {
    return liaisonConfigForSection(this.activeSection);
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      appuis: this.http.get<unknown>(`${this.apiBaseUrl}/api/appui-partenaire`),
      documents: this.http.get<unknown>(`${this.apiBaseUrl}/api/documents`),
      partenaires: this.http.get<unknown>(`${this.apiBaseUrl}/api/Partenaires`),
      categoriesAppui: this.http.get<unknown>(`${this.apiBaseUrl}/api/categorieappuis`),
      naturesDocument: this.http.get<unknown>(`${this.apiBaseUrl}/api/naturedocument`),
      typesDocument: this.http.get<unknown>(`${this.apiBaseUrl}/api/TypeDocuments`),
    }).subscribe({
      next: (res) => {
        this.appuis = unwrapListBody(res.appuis) as AppuiRow[];
        this.documents = unwrapListBody(res.documents) as DocumentRow[];
        this.partenaires = sortByLabel(
          unwrapListBody(res.partenaires).map((row) => this.refFromAny(row, 'libellePartenaire')),
          (r) => this.refLabel(r),
        );
        this.categoriesAppui = sortByLabel(
          unwrapListBody(res.categoriesAppui).map((row) => this.refFromAny(row, 'libelleCategorieAppui')),
          (r) => this.refLabel(r),
        );
        this.naturesDocument = sortByLabel(
          unwrapListBody(res.naturesDocument).map((row) => this.refFromAny(row, 'libelleNatureDocument')),
          (r) => this.refLabel(r),
        );
        this.typesDocument = sortByLabel(
          unwrapListBody(res.typesDocument).map((row) => this.refFromAny(row, 'libelleTypeDocument')),
          (r) => this.refLabel(r),
        );
        this.loading = false;
        this.loadDocumentWorkflowStatuses();
        if (this.selectedCentreType) {
          this.loadCentresForType(this.selectedCentreType);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  onCentreTypeChange(): void {
    this.selectedCentreId = null;
    this.centres = [];
    this.onCentreChange();
    if (this.selectedCentreType) {
      this.loadCentresForType(this.selectedCentreType);
    }
  }

  private loadCentresForType(type: CentreType): void {
    this.centresLoading = true;
    this.http.get<unknown>(`${this.apiBaseUrl}${this.centreApiByType[type]}`, {
      params: { page: '0', size: '2000', sort: 'id,asc' },
    }).subscribe({
      next: (body) => {
        this.centres = sortByLabel(unwrapListBody(body) as CentreOption[], (c) => this.centreLabel(c));
        this.centresLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.centresLoading = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  onCentreChange(rawCentreId: number | string | null = this.selectedCentreId): void {
    if (rawCentreId != null && rawCentreId !== '') {
      const n = Number(rawCentreId);
      this.selectedCentreId = Number.isFinite(n) ? Math.trunc(n) : null;
    }
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
    if (!this.documentEditable(row)) return;
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
    if (!this.documentEditable(row)) return;
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

  menaCentreTypeOptions() {
    return toMenaSelectOptionsFromPairs(this.centreTypeOptions);
  }

  menaCentreOptions() {
    return toMenaSelectOptions(this.centres, (c) => this.centreId(c), (c) => this.centreLabel(c));
  }

  menaPartenaireOptions() {
    return toMenaSelectOptions(this.partenaires, (p) => p.id ?? null, (p) => this.refLabel(p));
  }

  menaCategorieAppuiOptions() {
    return toMenaSelectOptions(this.categoriesAppui, (c) => c.id ?? null, (c) => this.refLabel(c));
  }

  menaNatureDocumentOptions() {
    return toMenaSelectOptions(this.naturesDocument, (n) => n.id ?? null, (n) => this.refLabel(n));
  }

  menaTypeDocumentOptions() {
    return toMenaSelectOptions(this.typesDocument, (t) => t.id ?? null, (t) => this.refLabel(t));
  }

  centreLabel(centre: CentreOption): string {
    return centre.libelle?.trim() || centre.localisationCentre?.trim() || 'Sans libellé';
  }

  centreId(centre: CentreOption): number | null {
    return centre.idCentre ?? centre.id ?? null;
  }

  refLabel(ref: Ref | null | undefined): string {
    if (!ref) return '-';
    return ref.libelle?.trim() || 'Sans libellé';
  }

  documentEditable(row: DocumentRow): boolean {
    if (typeof row.workflowEditable === 'boolean') {
      return row.workflowEditable;
    }
    const status = row.workflowStatut ?? 'BROUILLON';
    return status === 'BROUILLON' || status === 'RETOURNE';
  }

  documentWorkflowLabel(row: DocumentRow): string {
    const status = row.workflowStatut ?? 'BROUILLON';
    switch (status) {
      case 'BROUILLON':
        return 'Brouillon';
      case 'SOUMIS':
        return 'Soumis';
      case 'VALIDEE_COORDONNATEUR':
        return 'Validé coordonnateur';
      case 'VALIDEE_SUPERVISEUR':
        return 'Validé superviseur';
      case 'VALIDEE_CENTRALE':
        return 'Validé central';
      case 'REJETE':
        return 'Rejeté';
      case 'RETOURNE':
        return 'Retourné';
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  documentWorkflowBadge(row: DocumentRow): string {
    const status = row.workflowStatut ?? 'BROUILLON';
    switch (status) {
      case 'VALIDEE_CENTRALE':
        return 'badge-success';
      case 'VALIDEE_SUPERVISEUR':
        return 'badge-primary';
      case 'VALIDEE_COORDONNATEUR':
        return 'badge-info';
      case 'SOUMIS':
        return 'badge-warning';
      case 'REJETE':
        return 'badge-danger';
      case 'BROUILLON':
      case 'RETOURNE':
        return 'badge-secondary';
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  documentWorkflowTooltip(row: DocumentRow): string {
    const motif = row.workflowMotifRejet?.trim();
    if (motif) return `Motif rejet : ${motif}`;
    const commentaire = row.workflowCommentaireRetour?.trim();
    if (commentaire) return `Commentaire retour : ${commentaire}`;
    return this.documentWorkflowLabel(row);
  }

  canSubmitDocument(row: DocumentRow): boolean {
    return (
      row.id != null &&
      this.documentEditable(row) &&
      this.auth.hasPermission('SAISIE_DONNEES:MODIFIER')
    );
  }

  canDecideDocument(row: DocumentRow): boolean {
    return row.id != null && this.nextDocumentValidationStatus(row) != null;
  }

  submitDocument(row: DocumentRow): void {
    if (row.id == null) return;
    this.runDocumentWorkflow('soumettre', row.id, {});
  }

  validateDocument(row: DocumentRow): void {
    if (row.id == null) return;
    this.runDocumentWorkflow('valider', row.id, {});
  }

  rejectDocument(row: DocumentRow): void {
    if (row.id == null) return;
    const motif = window.prompt('Motif du rejet (obligatoire)');
    if (motif == null) return;
    if (!motif.trim()) {
      this.errorMessage = 'Le motif de rejet est obligatoire.';
      return;
    }
    this.runDocumentWorkflow('rejeter', row.id, { motif: motif.trim() });
  }

  returnDocument(row: DocumentRow): void {
    if (row.id == null) return;
    const commentaire = window.prompt('Commentaire de retour (facultatif)', '');
    if (commentaire == null) return;
    this.runDocumentWorkflow('retourner', row.id, { commentaire: commentaire.trim() || null });
  }

  private refFromAny(raw: unknown, specificLibelleKey: string): Ref {
    const row = raw as Record<string, unknown>;
    const libelle = row['libelle'] ?? row[specificLibelleKey];
    return {
      id: typeof row['id'] === 'number' ? row['id'] : null,
      code: null,
      libelle: libelle != null ? String(libelle) : null,
    };
  }

  private loadDocumentWorkflowStatuses(): void {
    const ids = this.documents
      .map((row) => row.id)
      .filter((id): id is number => id != null);
    if (!ids.length) return;
    this.http.get<Record<string, Partial<DocumentRow>>>(`${this.apiBaseUrl}/api/saisie-workflows/statuses`, {
      params: {
        resource: '/api/documents',
        ids: ids.join(','),
      },
    }).subscribe({
      next: (statuses) => {
        this.documents = this.documents.map((row) => {
          const status = row.id == null ? null : statuses[String(row.id)];
          return status ? { ...row, ...status } : row;
        });
      },
      error: () => {
        /* La page reste utilisable sans statuts workflow. */
      },
    });
  }

  private nextDocumentValidationStatus(row: DocumentRow): WorkflowStatus | null {
    if (!this.auth.hasPermission('SAISIE_DONNEES:VALIDER')) {
      return null;
    }
    const status = row.workflowStatut ?? 'BROUILLON';
    switch (status) {
      case 'SOUMIS':
        return this.hasValidatorRole(['COORDONNATEUR']) ? 'VALIDEE_COORDONNATEUR' : null;
      case 'VALIDEE_COORDONNATEUR':
        return this.hasValidatorRole(['SUPERVISEUR']) ? 'VALIDEE_SUPERVISEUR' : null;
      case 'VALIDEE_SUPERVISEUR':
        return this.hasValidatorRole(['SUPERVISEUR_AENF', 'DIRECTEUR']) ? 'VALIDEE_CENTRALE' : null;
      case 'BROUILLON':
      case 'VALIDEE_CENTRALE':
      case 'REJETE':
      case 'RETOURNE':
        return null;
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  private runDocumentWorkflow(action: 'soumettre' | 'valider' | 'rejeter' | 'retourner', recordId: number, payload: Record<string, unknown>): void {
    this.saving = true;
    this.errorMessage = null;
    this.http.put(`${this.apiBaseUrl}/api/saisie-workflows/${action}`, payload, {
      params: {
        resource: '/api/documents',
        recordId,
        feature: 'SAISIE_DONNEES',
      },
    }).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage =
          action === 'soumettre'
            ? 'Document soumis pour validation.'
            : action === 'valider'
              ? 'Document validé.'
              : action === 'rejeter'
                ? 'Document rejeté.'
                : 'Document retourné pour correction.';
        this.loadDocumentWorkflowStatuses();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  private hasValidatorRole(roles: string[]): boolean {
    return this.auth.hasAnyRole([...roles, 'ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT']);
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
