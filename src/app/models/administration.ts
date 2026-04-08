export interface AppRole {
  id: number;
  codeRole?: string;
  libelleRole?: string;
  descriptionRole?: string;
}

export interface Fonctionnalite {
  id: number;
  codeFonctionnalite?: string;
  libelleFonctionnalite?: string;
  module?: string;
}

export interface Permission {
  id: number;
  codePermission?: string;
  libellePermission?: string;
}

export interface RoleFonctionnalitePermission {
  id: number;
  role?: { id: number };
  fonctionnalite?: { id: number };
  permission?: { id: number };
}

export interface AppUserAdmin {
  id: number;
  username: string;
  email?: string;
  actif?: boolean;
  roleIds: number[];
}

export interface AppUserAdminUpsertRequest {
  username: string;
  email?: string | null;
  actif?: boolean | null;
  password?: string | null;
  roleIds?: number[] | null;
}

export interface PersonnelAdmin {
  id: number;
  niveauPersonnelId: number | null;
  fonctionId: number | null;
  civiliteId: number | null;
  centreId: number | null;
  structureFormationCertificationId: number | null;
  statutPersonnelId: number | null;
  codePersonnel?: string | null;
  certifierPersonnel?: boolean | null;
  nomPersonnel?: string | null;
  prenomsPersonnel?: string | null;
  anneExpePersonnel?: number | null;
  sexePersonnel?: string | null;
  dateNaissance?: string | null;
  ancienneFonctPromoPesonnel?: number | null;
  contactPersonnel?: string | null;
  boitePostalePersonnel?: string | null;
  emailPersonnel?: string | null;
  denominationPersonnel?: string | null;
  nomDuPrgramme?: string | null;
  nomRepresentantLegalSturcture?: string | null;
}

export interface PersonnelAdminDashboard {
  centreId: number;
  total: number;
}
