import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BRAND_CONFIG } from '@core/config/brand.config';
import { REFERENTIEL_ROUTE_DATA, type ReferentielRouteData } from '@core/config/referentiel-routes.data';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './menu.component.html',
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class MenuComponent {
  /** Liens référentiels : alignés sur `app.routes` et les `apiPath` du backend. */
  readonly referentielRoutes = REFERENTIEL_ROUTE_DATA;
  readonly referentielGroups = groupReferentiels(REFERENTIEL_ROUTE_DATA);
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;

  groupCollapseId(prefix: string, title: string): string {
    const slug = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${prefix}-${slug || 'g'}`;
  }
}

type ReferentielGroup = { title: string; items: ReferentielRouteData[] };

function groupReferentiels(items: ReferentielRouteData[]): ReferentielGroup[] {
  const groups: Record<string, ReferentielRouteData[]> = {};

  const keyFor = (r: ReferentielRouteData): string => {
    const p = `${r.path} ${r.apiPath} ${r.title}`.toLowerCase();
    if (p.includes('localite')) return 'Géographie';
    if (p.includes('autorite') || p.includes('periodicite') || p.includes('naturecentre') || p.includes('campagne')) {
      return 'Centres & autorisations';
    }
    if (p.includes('document')) return 'Documents';
    if (
      p.includes('alpha') ||
      p.includes('regime') ||
      p.includes('type') ||
      p.includes('niveau') ||
      p.includes('support') ||
      p.includes('langue') ||
      p.includes('materiel')
    ) {
      return 'Pédagogie';
    }
    return 'Autres';
  };

  for (const r of items) {
    const k = keyFor(r);
    (groups[k] ??= []).push(r);
  }

  const order = ['Géographie', 'Centres & autorisations', 'Pédagogie', 'Documents', 'Autres'];
  return order
    .filter((k) => (groups[k]?.length ?? 0) > 0)
    .map((k) => ({ title: k, items: groups[k] }));
}
