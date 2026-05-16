const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../src/app/features/administration/utilisateurs/utilisateurs.component.html');
let c = fs.readFileSync(p, 'utf8');

const rep = (from, to) => {
  if (!c.includes(from.split('\n')[0].trim())) {
    console.warn('skip', from.split('\n')[0].trim().slice(0, 60));
    return;
  }
  c = c.replace(from, to);
};

rep(
  `<select
                  id="users-filter-role"
                  class="form-control form-control-sm"
                  [(ngModel)]="listFilterRoleId"
                  (ngModelChange)="applyListFilters()"
                  [disabled]="saving"
                >
                  <option [ngValue]="null">Tous les rôles</option>
                  <option *ngFor="let r of roles; trackBy: trackRoleById" [ngValue]="r.id">
                    {{ r.libelleRole ?? r.codeRole ?? r.id }}
                  </option>
                </select>`,
  `<app-mena-searchable-select
                  id="users-filter-role"
                  [(ngModel)]="listFilterRoleId"
                  (ngModelChange)="applyListFilters()"
                  [options]="menaRoleOptions('')"
                  nullLabel="Tous les rôles"
                  inputClass="form-control form-control-sm"
                  [disabled]="saving"
                />`,
);

rep(
  `<select
            class="form-control"
            [ngModel]="createSelectedRoleId"
            (ngModelChange)="createSelectedRoleId = $event"
            [disabled]="saving"
          >
            <option [ngValue]="null">-- Sélectionner un rôle --</option>
            <option *ngFor="let r of filteredRoles(roleFilterCreate); trackBy: trackRoleById" [ngValue]="r.id">
              {{ r.libelleRole ?? r.codeRole ?? r.id }}
            </option>
          </select>`,
  `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="createSelectedRoleId"
            [options]="menaRoleOptions(roleFilterCreate)"
            nullLabel="-- Sélectionner un rôle --"
            [disabled]="saving"
          />`,
);

rep(
  `<select
                class="form-control"
                [ngModel]="createForm[scope.key]"
                (ngModelChange)="onScopeChanged(createForm, scope.key, $event)"
                [disabled]="saving"
              >
                <option [ngValue]="null">— Non rattaché —</option>
                <option *ngFor="let option of filteredScopeOptions(scope.key, createForm); trackBy: trackScopeById" [ngValue]="option.id">
                  {{ optionLabel(option) }}
                </option>
              </select>`,
  `<app-mena-searchable-select
                class="form-control"
                [ngModel]="createForm[scope.key]"
                (ngModelChange)="onScopeChanged(createForm, scope.key, $event)"
                [options]="menaScopeOptions(scope.key, createForm)"
                nullLabel="— Non rattaché —"
                [disabled]="saving"
              />`,
);

// edit modal - read from file after first replacements
const editRole = c.match(/editSelectedRoleId[\s\S]*?<\/select>/);
if (editRole) {
  c = c.replace(
    /<select\s+class="form-control"\s+\[ngModel\]="editSelectedRoleId"[\s\S]*?<\/select>/,
    `<app-mena-searchable-select
            class="form-control"
            [(ngModel)]="editSelectedRoleId"
            [options]="menaRoleOptions(roleFilterEdit)"
            nullLabel="-- Sélectionner un rôle --"
            [disabled]="saving"
          />`,
  );
}

c = c.replace(
  /<select\s+class="form-control"\s+\[ngModel\]="editForm\[scope\.key\]"[\s\S]*?<\/select>/g,
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
console.log('utilisateurs v2 done');
