/**
 * Vue alignee sur l'API JSON (champs optionnels si le backend evolue ou relations lazy).
 */
export interface Ministere {
  id: number;
  libelleMinistere?: string | null;
  codePromoteur?: string | null;
  libellePromoteur?: string | null;
  denomination?: string | null;
  nomProgramme?: string | null;
  personnemorale?: unknown;
}
