import type { ReferentielMenuGroupId, ReferentielRouteData } from '@core/config/referentiel-routes.data';

/** Ordre d’affichage des sections dans le menu Paramétrage. */
export const REFERENTIEL_MENU_GROUP_ORDER: ReferentielMenuGroupId[] = [
  'geographie',
  'centres-autorisations',
  'pedagogie',
  'activites-centre',
  'documents',
  'others',
];

/** Libellés menu (sidebar). */
export const REFERENTIEL_MENU_GROUP_LABEL: Record<ReferentielMenuGroupId, string> = {
  geographie: 'Géographie',
  'centres-autorisations': 'Centres & autorisations',
  pedagogie: 'Pédagogie',
  'activites-centre': 'Activités centre',
  documents: 'Documents',
  others: 'Autres',
};

export type ReferentielMenuGroup = { title: string; items: ReferentielRouteData[] };

/** Regroupe les entrées Paramétrage selon `menuGroup` (config explicite). */
export function groupReferentielsForMenu(items: ReferentielRouteData[]): ReferentielMenuGroup[] {
  const by = new Map<ReferentielMenuGroupId, ReferentielRouteData[]>();
  for (const r of items) {
    const list = by.get(r.menuGroup) ?? [];
    list.push(r);
    by.set(r.menuGroup, list);
  }
  return REFERENTIEL_MENU_GROUP_ORDER.filter((id) => (by.get(id)?.length ?? 0) > 0).map((id) => ({
    title: REFERENTIEL_MENU_GROUP_LABEL[id],
    items: by.get(id)!,
  }));
}
