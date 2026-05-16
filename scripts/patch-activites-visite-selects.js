const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/app/features/activites-centre/visite/activites-centre-visite.component.html');
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="filterAlphaId">[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterAlphaId"
            [options]="menaAlphaFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"
          />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="filterPeriodeId">[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
            class="form-control form-control-sm"
            [(ngModel)]="filterPeriodeId"
            [options]="menaPeriodeFilterOptions()"
            [allowNull]="false"
            inputClass="form-control form-control-sm"
            [disabled]="loading"
          />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idAlpha"[\s\S]*?<\/select>/g,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idAlpha"
              [options]="menaAlphaFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idPeriodeActivite"[\s\S]*?<\/select>/g,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idPeriodeActivite"
              [options]="menaPeriodeFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
fs.writeFileSync(p, c);
console.log('activites visite html');
