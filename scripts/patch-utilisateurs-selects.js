const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/app/features/administration/utilisateurs/utilisateurs.component.html');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /<select\s+class="form-control"[\s\S]*?\[ngModel\]="createSelectedRoleId"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="createSelectedRoleId"
            [options]="menaRoleOptions(roleFilterCreate)"
            nullLabel="-- Sélectionner un rôle --"
            [disabled]="saving"
          />`,
);

c = c.replace(
  /<select\s+class="form-control"[\s\S]*?\[ngModel\]="editSelectedRoleId"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="editSelectedRoleId"
            [options]="menaRoleOptions(roleFilterEdit)"
            nullLabel="-- Sélectionner un rôle --"
            [disabled]="saving"
          />`,
);

c = c.replace(
  /<select\s+class="form-control"[\s\S]*?\*ngFor="let r of roles; trackBy: trackRoleById"[\s\S]*?<\/select>/,
  `<app-mena-searchable-select
                  class="form-control form-control-sm"
                  [(ngModel)]="listFilterRoleId"
                  [options]="menaRoleOptions('')"
                  nullLabel="Tous les rôles"
                  inputClass="form-control form-control-sm"
                  [disabled]="loading || saving"
                />`,
);

c = c.replace(
  /<select\s+class="form-control"[\s\S]*?\[ngModel\]="createForm\[scope\.key\]"[\s\S]*?<\/select>/g,
  `<app-mena-searchable-select
                class="form-control"
                [ngModel]="createForm[scope.key]"
                (ngModelChange)="onScopeChanged(createForm, scope.key, $event)"
                [options]="menaScopeOptions(scope.key, createForm)"
                nullLabel="— Non rattaché —"
                [disabled]="saving"
              />`,
);

c = c.replace(
  /<select\s+class="form-control"[\s\S]*?\[ngModel\]="editForm\[scope\.key\]"[\s\S]*?<\/select>/g,
  `<app-mena-searchable-select
                class="form-control"
                [ngModel]="editForm[scope.key]"
                (ngModelChange)="onScopeChanged(editForm, scope.key, $event)"
                [options]="menaScopeOptions(scope.key, editForm)"
                nullLabel="— Non rattaché —"
                [disabled]="saving"
              />`,
);

fs.writeFileSync(p, c);
console.log('utilisateurs done');
