export interface AuthReference {
  id: number;
  code?: string | null;
  libelle?: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  idRegion?: number | null;
  idDrena?: number | null;
  idIep?: number | null;
  idDepartement?: number | null;
  idSousPrefecture?: number | null;
  idCommune?: number | null;
  idLocalite?: number | null;
  region?: AuthReference | null;
  drena?: AuthReference | null;
  iep?: AuthReference | null;
  departement?: AuthReference | null;
  sousPrefecture?: AuthReference | null;
  commune?: AuthReference | null;
  localite?: AuthReference | null;
  nationalView?: boolean;
  scopeMode?: string;
  scopeLabel?: string;
}

export interface AuthMeResponse {
  userId: number;
  username: string;
  email?: string | null;
  roles?: string[];
  permissions: string[];
  idRegion?: number | null;
  idDrena?: number | null;
  idIep?: number | null;
  idDepartement?: number | null;
  idSousPrefecture?: number | null;
  idCommune?: number | null;
  idLocalite?: number | null;
  region?: AuthReference | null;
  drena?: AuthReference | null;
  iep?: AuthReference | null;
  departement?: AuthReference | null;
  sousPrefecture?: AuthReference | null;
  commune?: AuthReference | null;
  localite?: AuthReference | null;
  nationalView?: boolean;
  scopeMode?: string;
  scopeLabel?: string;
}

export interface AuthSession {
  userId: number;
  username: string;
  email?: string | null;
  roles: string[];
  permissions: string[];
  idRegion?: number | null;
  idDrena?: number | null;
  idIep?: number | null;
  idDepartement?: number | null;
  idSousPrefecture?: number | null;
  idCommune?: number | null;
  idLocalite?: number | null;
  region?: AuthReference | null;
  drena?: AuthReference | null;
  iep?: AuthReference | null;
  departement?: AuthReference | null;
  sousPrefecture?: AuthReference | null;
  commune?: AuthReference | null;
  localite?: AuthReference | null;
  /** Vue sur tout le territoire (pas de circonscription IEP/DRENA opérationnelle). */
  nationalView?: boolean;
  scopeMode?: string;
  scopeLabel?: string;
}
