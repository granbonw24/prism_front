const fs = require('fs');
const p = 'src/app/features/administration/personnel/personnel.component.html';
const root = require('path').join(__dirname, '..');
let c = fs.readFileSync(require('path').join(root, p), 'utf8');

const rep = (from, to) => {
  if (!c.includes(from.split('\n')[0])) return false;
  c = c.replace(from, to);
  return true;
};

rep(
  `<select
            id="centreSelect"
            class="form-control"
            [(ngModel)]="centreId"
            (ngModelChange)="onCentreChange()"
            [disabled]="loading || saving"
          >
            <option [ngValue]="null">-- Sélectionner un centre --</option>
            <option *ngFor="let c of centres" [ngValue]="c.id">
              {{ c.codeCentre ?? ('Centre #' + c.id) }}
            </option>
          </select>`,
  `<app-mena-searchable-select
            id="centreSelect"
            [(ngModel)]="centreId"
            (ngModelChange)="onCentreChange()"
            [options]="menaCentreOptions()"
            nullLabel="-- Sélectionner un centre --"
            [disabled]="loading || saving"
          />`,
);

const refSelect = (ngModel, options, nullLabel, extra = '') =>
  `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="${ngModel}"
            [options]="${options}"
            nullLabel="${nullLabel}"
            ${extra}
          />`;

[
  ['creating.idNiveauPersonnelId', 'menaNiveauOptions()', '--'],
  ['creating.idFonctionId', 'menaFonctionOptions()', '--'],
  ['creating.idCiviliteId', 'menaCiviliteOptions()', '--'],
  ['creating.idStatutPersonnelId', 'menaStatutOptions()', '--'],
].forEach(([m, o, n]) => {
  c = c.replace(
    new RegExp(
      `<select class="form-control" \\[\\(ngModel\\)\\]="${m.replace('.', '\\.')}" \\[disabled\\]="saving">\\s*<option \\[ngValue\\]="null">${n}<\\/option>\\s*<option \\*ngFor="[^"]+" \\[ngValue\\]="[^"]+">[^<]+<\\/option>\\s*<\\/select>`,
    ),
    refSelect(m, o, n, '[disabled]="saving"'),
  );
});

[
  ['listFilter.idFonction', 'menaFonctionOptions()', 'Toutes', 'form-control-sm'],
  ['listFilter.idStatutPersonnel', 'menaStatutOptions()', 'Tous', 'form-control-sm'],
  ['listFilter.idNiveauPersonnel', 'menaNiveauOptions()', 'Tous', 'form-control-sm'],
  ['listFilter.idCivilite', 'menaCiviliteOptions()', 'Toutes', 'form-control-sm'],
].forEach(([m, o, n, cls]) => {
  c = c.replace(
    new RegExp(
      `<select\\s+class="form-control ${cls}"[\\s\\S]*?\\[\\(ngModel\\)\\]="${m.replace('.', '\\.')}"[\\s\\S]*?<\\/select>`,
    ),
    `<app-mena-searchable-select
            class="form-control ${cls}"
            [(ngModel)]="${m}"
            [options]="${o}"
            nullLabel="${n}"
            inputClass="form-control ${cls}"
            [disabled]="loading || saving"
          />`,
  );
});

fs.writeFileSync(require('path').join(root, p), c);
console.log('personnel html done');
