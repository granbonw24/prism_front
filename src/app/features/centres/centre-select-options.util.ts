import {
  AutoriteOption,
  autoriteSelectLabel,
  IepOption,
  iepSelectLabel,
  LocaliteOption,
  localiteSelectLabel,
  NatureOption,
  natureSelectLabel,
  PeriodiciteOption,
  periodiciteSelectLabel,
  PromoteurOption,
  promoteurSelectLabel,
  RefOption,
  refOptionLabel,
  refOptionLibelle,
} from '@models/centre';
import {
  MenaSelectOption,
  sortByLabel,
  toMenaSelectOptions,
  toMenaSelectOptionsFromIds,
  toMenaSelectOptionsFromPairs,
} from '@shared/mena-searchable-select/mena-select-options.util';

export function sortRefOptions(items: RefOption[], fullLabel = false): RefOption[] {
  return sortByLabel(items, fullLabel ? refOptionLabel : refOptionLibelle);
}

export function sortPromoteurOptions(items: PromoteurOption[]): PromoteurOption[] {
  return sortByLabel(items, refOptionLibelle);
}

export function menaRefSelectOptions(items: readonly RefOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptionsFromIds(items, refOptionLibelle);
}

export function menaPromoteurSelectOptions(items: readonly PromoteurOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptionsFromIds(items, promoteurSelectLabel);
}

export function menaLocaliteSelectOptions(items: readonly LocaliteOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (l) => l.id, localiteSelectLabel);
}

export function menaIepSelectOptions(items: readonly IepOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (i) => i.id, iepSelectLabel);
}

export function menaNatureSelectOptions(items: readonly NatureOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (n) => n.id, natureSelectLabel);
}

export function menaAutoriteSelectOptions(items: readonly AutoriteOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (a) => a.id, autoriteSelectLabel);
}

export function menaPeriodiciteSelectOptions(items: readonly PeriodiciteOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (p) => p.id, periodiciteSelectLabel);
}

/** Options dont la valeur envoyée à l’API est le libellé (champs texte promoteur). */
export function menaRefLibelleStringOptions(
  items: readonly RefOption[],
  labelFn: (item: RefOption) => string = refOptionLibelle,
): MenaSelectOption<string>[] {
  const pairs: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();
  for (const item of items) {
    const label = labelFn(item).trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    pairs.push({ value: label, label });
  }
  return toMenaSelectOptionsFromPairs(pairs) as MenaSelectOption<string>[];
}
