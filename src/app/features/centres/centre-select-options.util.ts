import {
  AutoriteOption,
  IepOption,
  iepOptionLabel,
  LocaliteOption,
  localiteOptionLabel,
  NatureOption,
  natureOptionLabel,
  PeriodiciteOption,
  periodiciteOptionLabel,
  PromoteurOption,
  RefOption,
  refOptionLabel,
  refOptionLibelle,
} from '@models/centre';
import {
  MenaSelectOption,
  sortByLabel,
  toMenaSelectOptions,
  toMenaSelectOptionsFromIds,
} from '@shared/mena-searchable-select/mena-select-options.util';

export function sortRefOptions(items: RefOption[], fullLabel = false): RefOption[] {
  return sortByLabel(items, fullLabel ? refOptionLabel : refOptionLibelle);
}

export function sortPromoteurOptions(items: PromoteurOption[]): PromoteurOption[] {
  return sortByLabel(items, refOptionLabel);
}

export function menaRefSelectOptions(items: readonly RefOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptionsFromIds(items, refOptionLibelle);
}

export function menaPromoteurSelectOptions(items: readonly PromoteurOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptionsFromIds(items, refOptionLabel);
}

export function menaLocaliteSelectOptions(items: readonly LocaliteOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (l) => l.id, localiteOptionLabel);
}

export function menaIepSelectOptions(items: readonly IepOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (i) => i.id, iepOptionLabel);
}

export function menaNatureSelectOptions(items: readonly NatureOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (n) => n.id, natureOptionLabel);
}

export function menaAutoriteSelectOptions(items: readonly AutoriteOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (a) => a.id, (a) => a.libelleAutoriteAutorisation?.trim() || '—');
}

export function menaPeriodiciteSelectOptions(items: readonly PeriodiciteOption[]): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (p) => p.id, periodiciteOptionLabel);
}
