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
  idRegion?: number | null;
  idDrena?: number | null;
  idIep?: number | null;
  idDepartement?: number | null;
  idSousPrefecture?: number | null;
  idCommune?: number | null;
  idLocalite?: number | null;
  region?: AdminReference | null;
  drena?: AdminReference | null;
  iep?: AdminReference | null;
  departement?: AdminReference | null;
  sousPrefecture?: AdminReference | null;
  commune?: AdminReference | null;
  localite?: AdminReference | null;
}

export interface AppUserAdminUpsertRequest {
  username: string;
  email?: string | null;
  actif?: boolean | null;
  password?: string | null;
  roleIds?: number[] | null;
  idRegion?: number | null;
  idDrena?: number | null;
  idIep?: number | null;
  idDepartement?: number | null;
  idSousPrefecture?: number | null;
  idCommune?: number | null;
  idLocalite?: number | null;
}

export interface AdminReference {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
}

export interface AdminScopeOption {
  id: number;
  code?: string | null;
  libelle?: string | null;
  [key: string]: unknown;
}

export interface PersonnelAdmin {
  id: number;
  niveauPersonnelId: number | null;
  fonctionId: number | null;
  civiliteId: number | null;
  centreId: number | null;
  structureFormationCertificationId: number | null;
  statutPersonnelId: number | null;
  diplomeId?: number | null;
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
