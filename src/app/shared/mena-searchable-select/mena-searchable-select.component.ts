import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MenaSelectOption } from './mena-select-options.util';

@Component({
  selector: 'app-mena-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mena-searchable-select.component.html',
  styleUrl: './mena-searchable-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MenaSearchableSelectComponent),
      multi: true,
    },
  ],
})
export class MenaSearchableSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() options: MenaSelectOption[] = [];
  @Input() searchable = true;
  @Input() allowNull = true;
  @Input() nullLabel = '—';
  @Input() placeholder = 'Rechercher…';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() inputClass = 'form-control';

  value: number | string | boolean | null = null;
  query = '';
  open = false;
  filteredOptions: MenaSelectOption[] = [];

  private onChange: (value: number | string | boolean | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.refreshFilteredOptions();
    this.syncQueryFromValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.refreshFilteredOptions();
      if (!this.isActiveSearch()) {
        this.syncQueryFromValue();
      }
    }
    if (changes['loading'] && !changes['loading'].firstChange) {
      this.refreshFilteredOptions();
    }
  }

  writeValue(value: number | string | boolean | null): void {
    this.value = value === '' ? null : (value ?? null);
    this.syncQueryFromValue();
  }

  registerOnChange(fn: (value: number | string | boolean | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.open = false;
    }
  }

  get isControlDisabled(): boolean {
    return this.disabled;
  }

  get displayPlaceholder(): string {
    if (this.loading) {
      return 'Chargement…';
    }
    if (this.searchable) {
      return this.placeholder;
    }
    return this.allowNull ? this.nullLabel : 'Sélectionner…';
  }

  onInputFocus(): void {
    if (this.disabled) {
      return;
    }
    this.open = true;
    if (this.searchable) {
      this.query = '';
      this.refreshFilteredOptions();
    }
  }

  onInputInput(raw: string): void {
    if (!this.searchable || this.isControlDisabled) {
      return;
    }
    this.query = raw;
    this.open = true;
    this.refreshFilteredOptions();
  }

  onInputBlur(): void {
    this.onTouched();
    setTimeout(() => {
      if (!this.open) {
        return;
      }
      this.open = false;
      this.syncQueryFromValue();
    }, 150);
  }

  selectOption(option: MenaSelectOption, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.applyValue(option.value);
    this.open = false;
    this.syncQueryFromValue();
  }

  clearSelection(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.allowNull || this.isControlDisabled) {
      return;
    }
    this.applyValue(null);
    this.query = '';
    this.refreshFilteredOptions();
    this.open = false;
  }

  togglePanel(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) {
      return;
    }
    this.open = !this.open;
    if (this.open) {
      this.refreshFilteredOptions();
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.open) {
      return;
    }
    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) {
      return;
    }
    this.open = false;
    this.syncQueryFromValue();
  }

  isSelected(option: MenaSelectOption): boolean {
    return this.valuesEqual(option.value, this.value);
  }

  private applyValue(next: number | string | boolean | null): void {
    this.value = next;
    this.onChange(next);
    this.onTouched();
  }

  private syncQueryFromValue(): void {
    if (this.isActiveSearch()) {
      return;
    }
    if (this.value == null) {
      this.query = '';
      return;
    }
    const found = this.options.find((o) => this.valuesEqual(o.value, this.value));
    this.query = found?.label ?? String(this.value);
  }

  private isActiveSearch(): boolean {
    return this.searchable && this.open && this.query.trim() !== '';
  }

  private refreshFilteredOptions(): void {
    const q = this.query.trim().toLowerCase();
    const base = this.options ?? [];
    if (!this.searchable || !q) {
      this.filteredOptions = base;
      return;
    }
    this.filteredOptions = base.filter((o) => o.label.toLowerCase().includes(q));
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }
    if (a == null && b == null) {
      return true;
    }
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) {
      return true;
    }
    return false;
  }
}
