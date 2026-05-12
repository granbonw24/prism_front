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
}

export interface AuthMeResponse {
  userId: number;
  username: string;
  permissions: string[];
  idRegion?: number | null;
  idDrena?: number | null;
  idIep?: number | null;
  idDepartement?: number | null;
  idSousPrefecture?: number | null;
  idCommune?: number | null;
  idLocalite?: number | null;
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
}
