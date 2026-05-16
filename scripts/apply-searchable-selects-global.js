/**
 * Remplace les <select> avec *ngFor par app-mena-searchable-select (listes longues).
 * Conserve les listes courtes (Oui/Non, sexe, pagination, type promoteur).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const files = [
  'src/app/features/administration/personnel/personnel.component.html',
  'src/app/features/visites/visites-list.component.html',
  'src/app/features/activites-centre/visite/activites-centre-visite.component.html',
  'src/app/features/activites-centre/controle/activites-centre-controle.component.html',
  'src/app/features/activites-centre/evaluation/activites-centre-evaluation.component.html',
  'src/app/features/administration/utilisateurs/utilisateurs.component.html',
  'src/app/features/administration/roles-acteurs/roles-acteurs.component.html',
  'src/app/shared/referentiel-list-page/referentiel-list-page.component.html',
];

function patch(content) {
  let out = content;

  // Personnel — centre principal
  out = out.replace(
    /<select\s+id="centreSelect"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            id="centreSelect"
            [(ngModel)]="centreId"
            (ngModelChange)="onCentreChange()"
            [options]="menaCentreOptions()"
            nullLabel="-- Sélectionner un centre --"
            [disabled]="loading || saving"
          />`,
  );

  // Generic: select with class form-control + ngModel + single ngFor option block (non-multiline option body)
  out = out.replace(
    /<select\s+class="form-control([^"]*)"([^>]*)>\s*<option \[ngValue\]="null">([^<]*)<\/option>\s*<option \*ngFor="let (\w+) of (\w+)" \[ngValue\]="(\w+)\.id">([^<]+)<\/option>\s*<\/select>/g,
    (m, extraClass, attrs, nullLabel, itemVar, listName, valueExpr, labelExpr) => {
      if (attrs.includes('sexePersonnel') || listName === 'typePromoteurOptions') {
        return m;
      }
      const method = guessMethod(listName, labelExpr.trim());
      return `<app-mena-searchable-select class="form-control${extraClass}"${attrs}
              [options]="${method}"
              nullLabel="${nullLabel.trim()}"
            />`;
    },
  );

  // Personnel filter selects with "Tous/Toutes"
  out = out.replace(
    /<select\s+class="form-control form-control-sm"([^>]*)>\s*<option \[ngValue\]="null">([^<]*)<\/option>\s*<option \*ngFor="let (\w+) of (\w+)" \[ngValue\]="\3\.id">\s*([^<]+)\s*<\/option>\s*<\/select>/g,
    (m, attrs, nullLabel, itemVar, listName, labelBody) => {
      const method = guessMethod(listName, labelBody);
      return `<app-mena-searchable-select class="form-control form-control-sm"${attrs}
              [options]="${method}"
              nullLabel="${nullLabel.trim()}"
              inputClass="form-control form-control-sm"
            />`;
    },
  );

  // Visites — alphas, natures, types (filters + forms)
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="filterIdCentre"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="filterIdCentre"
            [options]="menaAlphaFilterOptions()"
            nullLabel="Tous"
            [disabled]="loading"
          />`,
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="filterIdNatureDocument"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="filterIdNatureDocument"
            [options]="menaNatureFilterOptions()"
            nullLabel="Toutes"
            [disabled]="loading"
          />`,
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="filterIdTypeDocument"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="filterIdTypeDocument"
            [options]="menaTypeFilterOptions()"
            nullLabel="Tous"
            [disabled]="loading"
          />`,
  );

  const visitesFormSelect = (model, options, nullLabel) =>
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="${model}"
              [options]="${options}"
              nullLabel="${nullLabel}"
              [disabled]="saving"
            />`;

  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="createForm\.idCentre"[\s\S]*?<\/select>/g,
    visitesFormSelect('createForm.idCentre', 'menaAlphaFormOptions()', '—'),
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="createForm\.idNatureDocument"[\s\S]*?<\/select>/g,
    visitesFormSelect('createForm.idNatureDocument', 'menaNatureFormOptions()', '—'),
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="createForm\.idTypeDocument"[\s\S]*?<\/select>/g,
    visitesFormSelect('createForm.idTypeDocument', 'menaTypeFormOptions()', '—'),
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="editForm\.idCentre"[\s\S]*?<\/select>/g,
    visitesFormSelect('editForm.idCentre', 'menaAlphaFormOptions()', '—'),
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="editForm\.idNatureDocument"[\s\S]*?<\/select>/g,
    visitesFormSelect('editForm.idNatureDocument', 'menaNatureFormOptions()', '—'),
  );
  out = out.replace(
    /<select class="form-control" \[\(ngModel\)\]="editForm\.idTypeDocument"[\s\S]*?<\/select>/g,
    visitesFormSelect('editForm.idTypeDocument', 'menaTypeFormOptions()', '—'),
  );

  // Referentiel — form select fields
  out = out.replace(
    /<select\s+\*ngIf="field\.type === 'select'"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
                  *ngIf="field.type === 'select'"
                  class="form-control form-control-sm"
                  [id]="'cf-' + field.key"
                  [formControlName]="field.key"
                  [options]="menaFieldOptions(field)"
                  nullLabel="-- Sélectionner --"
                  inputClass="form-control form-control-sm"
                />`,
  );

  // Referentiel — toolbar context (if options)
  out = out.replace(
    /<select\s+\[id\]="'mena-toolbar-centre-type'"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
          [id]="'mena-toolbar-centre-type'"
          class="form-control form-control-sm mena-toolbar-type-select"
          [options]="menaContextOptions()"
          [ngModel]="addFormContextValue ?? ''"
          (ngModelChange)="onAddFormContextValueChange($event)"
          [searchable]="(addFormContextOptions?.length ?? 0) > 6"
          inputClass="form-control form-control-sm"
        />`,
  );

  return out;
}

function guessMethod(listName, labelHint) {
  const map = {
    niveaux: 'menaNiveauOptions()',
    fonctions: 'menaFonctionOptions()',
    civilites: 'menaCiviliteOptions()',
    statuts: 'menaStatutOptions()',
    centres: 'menaCentreOptions()',
    alphas: 'menaAlphaOptions()',
    periodes: 'menaPeriodeOptions()',
    roles: 'menaRoleOptions()',
  };
  if (map[listName]) {
    return map[listName];
  }
  return `menaListOptions(${listName})`;
}

for (const rel of files) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) {
    console.warn('skip', rel);
    continue;
  }
  const before = fs.readFileSync(filePath, 'utf8');
  const after = patch(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log('patched', rel);
  } else {
    console.log('unchanged', rel);
  }
}
