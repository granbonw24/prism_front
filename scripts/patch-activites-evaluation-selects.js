const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/app/features/activites-centre/evaluation/activites-centre-evaluation.component.html');
let c = fs.readFileSync(p, 'utf8');
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
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idPeriodeEvaluation"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idPeriodeEvaluation"
              [options]="menaPeriodeFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.idNiveauEvaluation"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.idNiveauEvaluation"
              [options]="menaNiveauFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
c = c.replace(
  /<select class="form-control form-control-sm" \[\(ngModel\)\]="form\.typeEvaluation"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
              class="form-control form-control-sm"
              [(ngModel)]="form.typeEvaluation"
              [options]="menaTypeFormOptions()"
              inputClass="form-control form-control-sm"
              [disabled]="saving"
            />`,
);
fs.writeFileSync(p, c);
console.log('evaluation done');
