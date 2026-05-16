const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/app/features/visites/visites-list.component.html');
let c = fs.readFileSync(p, 'utf8');

const blocks = [
  [
    /<select class="form-control form-control-sm" \[\(ngModel\)\]="filterIdCentre">[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterIdCentre"
            [options]="menaAlphaFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"
          />`,
  ],
  [
    /<select class="form-control form-control-sm" \[\(ngModel\)\]="filterIdNatureDocument">[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterIdNatureDocument"
            [options]="menaNatureFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"
          />`,
  ],
  [
    /<select class="form-control form-control-sm" \[\(ngModel\)\]="filterIdTypeDocument">[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterIdTypeDocument"
            [options]="menaTypeFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"
          />`,
  ],
  [
    /<select class="form-control" \[\(ngModel\)\]="createForm\.idCentre"[\s\S]*?<\/select>/g,
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="createForm.idCentre"
              [options]="menaAlphaFormOptions()"
              [disabled]="saving"
            />`,
  ],
  [
    /<select class="form-control" \[\(ngModel\)\]="createForm\.idNatureDocument"[\s\S]*?<\/select>/g,
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="createForm.idNatureDocument"
              [options]="menaNatureFormOptions()"
              [disabled]="saving"
            />`,
  ],
  [
    /<select class="form-control" \[\(ngModel\)\]="createForm\.idTypeDocument"[\s\S]*?<\/select>/g,
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="createForm.idTypeDocument"
              [options]="menaTypeFormOptions()"
              [disabled]="saving"
            />`,
  ],
  [
    /<select class="form-control" \[\(ngModel\)\]="editForm\.idCentre"[\s\S]*?<\/select>/g,
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="editForm.idCentre"
              [options]="menaAlphaFormOptions()"
              [disabled]="saving"
            />`,
  ],
  [
    /<select class="form-control" \[\(ngModel\)\]="editForm\.idNatureDocument"[\s\S]*?<\/select>/g,
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="editForm.idNatureDocument"
              [options]="menaNatureFormOptions()"
              [disabled]="saving"
            />`,
  ],
  [
    /<select class="form-control" \[\(ngModel\)\]="editForm\.idTypeDocument"[\s\S]*?<\/select>/g,
    `<app-mena-searchable-select
              class="form-control"
              [(ngModel)]="editForm.idTypeDocument"
              [options]="menaTypeFormOptions()"
              [disabled]="saving"
            />`,
  ],
];

for (const [re, rep] of blocks) {
  c = c.replace(re, rep);
}
fs.writeFileSync(p, c);
console.log('visites done');
