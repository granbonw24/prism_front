const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/app/features/activites-centre/controle/activites-centre-controle.component.html');
let c = fs.readFileSync(p, 'utf8');
const reps = [
  [/<select class="form-control form-control-sm" \[\(ngModel\)\]="filterAlphaId">[\s\S]*?<\/select>/, `app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterAlphaId"
            [options]="menaAlphaFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"`],
  [/<select class="form-control form-control-sm" \[\(ngModel\)\]="filterPeriodeId">[\s\S]*?<\/select>/, `app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterPeriodeId"
            [options]="menaPeriodeFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"`],
];
for (const [re, inner] of reps) {
  c = c.replace(re, `<${inner} />`);
}
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idAlpha"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idAlpha"
              [options]="menaAlphaFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idPeriodeActivite"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idPeriodeActivite"
              [options]="menaPeriodeFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idNiveauAlpha"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idNiveauAlpha"
              [options]="menaNiveauFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="kit\.idManuel"[\s\S]*?<\/select>/g,
  `<app-mena-searchable-select
                  class="form-control form-control-sm"
                  [(ngModel)]="kit.idManuel"
                  [options]="menaManuelOptions()"
                  inputClass="form-control form-control-sm"
                  [disabled]="saving"
                />`,
);
fs.writeFileSync(p, c);
console.log('controle done');
