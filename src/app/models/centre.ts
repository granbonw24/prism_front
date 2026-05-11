export type RefOption = { id: number; libelle?: string; code?: string };
export type TypePromoteur = 'PHYSIQUE' | 'MORALE';

export type PromoteurPersonnePhysique = {
  libellePersonnePhysique?: string | null;
  nom?: string | null;
  prenom?: string | null;
  contact?: string | null;
  fonction?: string | null;
};

export type PromoteurPersonneMorale = {
  denomination?: string | null;
  nomProgramme?: string | null;
  nomRepresentant?: string | null;
  contact?: string | null;
  boitePostale?: string | null;
  mail?: string | null;
  idTypePersonneMorale?: number | null;
  libelleTypePersonneMorale?: string | null;
};

export type PromoteurDetails = {
  idPromoteur?: number | null;
  codePromoteur?: string | null;
  libellePromoteur?: string | null;
  typePromoteur?: TypePromoteur | null;
  personnePhysique?: PromoteurPersonnePhysique | null;
  personneMorale?: PromoteurPersonneMorale | null;
};

function normalizeTypePromoteur(raw: unknown): TypePromoteur | null {
  if (raw === 'PHYSIQUE' || raw === 'MORALE') return raw;
  if (typeof raw === 'string') {
    const u = raw.trim().toUpperCase();
    if (u === 'PHYSIQUE' || u === 'MORALE') return u;
    return null;
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    const nested = o['name'];
    if (nested !== undefined) return normalizeTypePromoteur(nested);
  }
  return null;
}

/** Détails promoteur renvoyés par l’API (normalise l’énum et déduit le type si absent). */
export function promoteurDetailsFromApi(value: unknown): PromoteurDetails | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  const personnePhysique = (p['personnePhysique'] as PromoteurPersonnePhysique | null | undefined) ?? null;
  const personneMorale = (p['personneMorale'] as PromoteurPersonneMorale | null | undefined) ?? null;
  let typePromoteur = normalizeTypePromoteur(p['typePromoteur']);
  if (typePromoteur == null && personneMorale != null && typeof personneMorale === 'object') {
    typePromoteur = 'MORALE';
  }
  if (typePromoteur == null && personnePhysique != null && typeof personnePhysique === 'object') {
    typePromoteur = 'PHYSIQUE';
  }
  const idRaw = p['idPromoteur'];
  let idPromoteur: number | null = null;
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) {
    idPromoteur = idRaw;
  } else if (idRaw != null && String(idRaw).trim() !== '') {
    const n = Number(idRaw);
    if (Number.isFinite(n)) idPromoteur = n;
  }
  return {
    idPromoteur,
    codePromoteur: (p['codePromoteur'] as string | undefined) ?? null,
    libellePromoteur: (p['libellePromoteur'] as string | undefined) ?? null,
    typePromoteur,
    personnePhysique,
    personneMorale,
  };
}

/** Réponse Spring Data pour les listes paginées (`GET` centres). */
export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

/** Ligne renvoyée par {@code GET /api/visites} (fiche document liée à un centre Alpha). */
export type VisiteDocumentRow = {
  id: number;
  codeDocument?: string | null;
  existe?: string | null;
  ajour?: string | null;
  bientenu?: string | null;
  respmethode?: string | null;
  bienrensigne?: string | null;
  idCentreAlpha?: number | null;
  codeCentre?: string | null;
  libelleAlpha?: string | null;
  idNatureDocument?: number | null;
  libelleNatureDocument?: string | null;
  idTypeDocument?: number | null;
  codeTypeDocument?: string | null;
  libelleTypeDocument?: string | null;
};

export type CentreRefDetails = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
};

/** Ligne liste + détail enrichi (`GET …/:id`). */
export type CentreDetailRow = CentreRow & {
  /** Détail Alpha : IDs FK (affichage de secours). */
  idCompagne?: number | null;
  idCategorieCentreAlpha?: number | null;
  idTypeAlpha?: number | null;
  idRegimeAlpha?: number | null;
  localite?: CentreRefDetails | null;
  iep?: CentreRefDetails | null;
  naturecentre?: CentreRefDetails | null;
  periodicite?: CentreRefDetails | null;
  autoriteAutorisation?: CentreRefDetails | null;
  campagne?: CentreRefDetails | null;
  categorieCentreAlpha?: CentreRefDetails | null;
  typeAlpha?: CentreRefDetails | null;
  regimeAlpha?: CentreRefDetails | null;
};

export type CentreRow = {
  idCentre: number;
  codeCentre?: string | null;
  codeType?: string | null;
  libelle?: string | null;
  idLocalite?: number | null;
  idIep?: number | null;
  idNaturecentre?: number | null;
  idPeriodicite?: number | null;
  idAutoriteAutorisation?: number | null;
  idPromoteur?: number | null;
  autorisation?: boolean | null;
  estElectrifie?: boolean | null;
  aDeLeau?: boolean | null;
  nombreVisite?: number | null;
  localisationCentre?: string | null;
  nomMilieuImplentation?: string | null;
  encadreurNonMena?: string | null;
  encadrerParMena?: boolean | null;
  promoteur?: PromoteurDetails | null;
};

/** Ligne liste Alpha (même forme que `CentreTypeListItem` côté API). */
export type AlphaRow = CentreRow;

export type LocaliteOption = {
  id: number;
  codeLocalite?: string | null;
  nomLocalite?: string | null;
};

export type IepOption = { id: number; codeIep?: string | null; nomIep?: string | null };

export type NatureOption = {
  id: number;
  codeNatureCentre?: string | null;
  libelleNatureCentre?: string | null;
};

export type PeriodiciteOption = {
  id: number;
  codePeriodicite?: string | null;
  libellePeriodicite?: string | null;
};

export type AutoriteOption = {
  id: number;
  codeAutorisation?: string | null;
  libelleAutoriteAutorisation?: string | null;
};

export type AlphaFullCreatePayload = {
  campagneId: number;
  categorieCentreAlphaId: number;
  typeAlphaId: number;
  regimeAlphaId: number;
  libelleAlpha: string;
  promoteur: PromoteurUpsertPayload;
  centre: {
    localiteId: number;
    periodiciteId?: number | null;
    iepId: number;
    autoriteAutorisationId?: number | null;
    natureCentreId: number;
    autorisation?: boolean | null;
    encadreurNonMena?: string | null;
    encadrerParMena?: boolean | null;
    estElectrifie?: boolean | null;
    aDeLeau?: boolean | null;
    nombreVisite?: number | null;
    localisationCentre?: string | null;
    nomMilieuImplentation?: string | null;
  };
};

export type SimpleCentreFullCreatePayload = {
  libelle: string;
  promoteur: PromoteurUpsertPayload;
  centre: {
    localiteId: number;
    periodiciteId?: number | null;
    iepId: number;
    autoriteAutorisationId?: number | null;
    natureCentreId: number;
    autorisation?: boolean | null;
    encadreurNonMena?: string | null;
    encadrerParMena?: boolean | null;
    estElectrifie?: boolean | null;
    aDeLeau?: boolean | null;
    nombreVisite?: number | null;
    localisationCentre?: string | null;
    nomMilieuImplentation?: string | null;
  };
};

export type PromoteurUpsertPayload = {
  id?: number | null;
  libellePromoteur?: string | null;
  typePromoteur?: TypePromoteur | null;
  personnePhysique?: {
    libellePersonnePhysique?: string | null;
    nom?: string | null;
    prenom?: string | null;
    contact?: string | null;
    fonction?: string | null;
  } | null;
  personneMorale?: {
    denomination?: string | null;
    nomProgramme?: string | null;
    nomRepresentant?: string | null;
    contact?: string | null;
    boitePostale?: string | null;
    mail?: string | null;
    idTypePersonneMorale?: number | null;
  } | null;
};

/** Libellés des listes déroulantes filtres (code — libellé). */
export function refOptionLabel(o: RefOption): string {
  const c = o.code?.trim();
  const l = o.libelle?.trim();
  if (c && l) return `${c} — ${l}`;
  if (c) return c;
  if (l) return l;
  return `#${o.id}`;
}

export function localiteOptionLabel(l: LocaliteOption): string {
  const c = l.codeLocalite?.trim();
  const n = l.nomLocalite?.trim();
  if (c && n) return `${c} — ${n}`;
  return c || n || `LOC#${l.id}`;
}

export function iepOptionLabel(i: IepOption): string {
  const c = i.codeIep?.trim();
  const n = i.nomIep?.trim();
  if (c && n) return `${c} — ${n}`;
  return c || n || `IEP#${i.id}`;
}

export function natureOptionLabel(n: NatureOption): string {
  const c = n.codeNatureCentre?.trim();
  const l = n.libelleNatureCentre?.trim();
  if (c && l) return `${c} — ${l}`;
  return c || l || `NAT#${n.id}`;
}

export function periodiciteOptionLabel(p: PeriodiciteOption): string {
  const c = p.codePeriodicite?.trim();
  const l = p.libellePeriodicite?.trim();
  if (c && l) return `${c} — ${l}`;
  return c || l || `PER#${p.id}`;
}

export function autoriteOptionLabel(a: AutoriteOption): string {
  const c = a.codeAutorisation?.trim();
  const l = a.libelleAutoriteAutorisation?.trim();
  if (c && l) return `${c} — ${l}`;
  return c || l || `AUT#${a.id}`;
}
