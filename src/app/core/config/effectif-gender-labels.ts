/** Libellés SIE / CP : H → Garçon, F → Fille (affichage uniquement). */
export function effectifCpSieDisplayLabel(label: string): string {
  return label
    .replace(/\bHommes?\b/g, 'Garçons')
    .replace(/\bFemmes?\b/g, 'Filles')
    .replace(/\bIvoirien H\b/g, 'Ivoirien Garçon')
    .replace(/\bIvoirienne? F\b/g, 'Ivoirienne Fille')
    .replace(/\bHandicap H\b/g, 'Handicap Garçon')
    .replace(/\bHandicap F\b/g, 'Handicap Fille')
    .replace(/\bNon Ivoirien H\b/g, 'Non Ivoirien Garçon')
    .replace(/\bNon Ivoirien F\b/g, 'Non Ivoirien Fille')
    .replace(/\bNon Ivoiriien H\b/g, 'Non Ivoirien Garçon')
    .replace(/\bNon Ivoiriien F\b/g, 'Non Ivoirien Fille')
    .replace(/ \(H\)$/g, ' (Garçon)')
    .replace(/ \(F\)$/g, ' (Fille)')
    .replace(/ H$/g, ' Garçon')
    .replace(/ F$/g, ' Fille');
}
