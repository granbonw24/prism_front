export type MenuContextDashboardModule =
  | 'CENTRES'
  | 'PERSONNEL'
  | 'PROMOTEUR'
  | 'APPRENANT'
  | 'ACTIVITES'
  | 'ADMIN';

export interface MenuContextDashboardCard {
  label: string;
  value: number | string;
  hint?: string;
  icon?: string;
  variant?: 'mint' | 'default' | string;
}

export interface MenuContextDashboard {
  module: MenuContextDashboardModule;
  scopeLabel: string;
  scopeMode?: string;
  nationalView?: boolean;
  subtitle?: string;
  cards: MenuContextDashboardCard[];
}

export interface MenuContextDashboardQuery {
  module: MenuContextDashboardModule;
  centreType?: string;
  centreId?: number | null;
  subModule?: string;
  apiPath?: string;
}
