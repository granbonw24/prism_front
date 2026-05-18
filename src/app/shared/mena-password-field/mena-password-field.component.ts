import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-mena-password-field',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MenaPasswordFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './mena-password-field.component.html',
  styleUrl: './mena-password-field.component.css',
})
export class MenaPasswordFieldComponent implements ControlValueAccessor {
  @Input() placeholder = 'Mot de passe';
  @Input() autocomplete = 'current-password';
  @Input() inputClass = 'form-control';
  /** Style arrondi de la page de connexion (form-control-user). */
  @Input() userStyle = false;

  @Input() set disabled(value: boolean) {
    this.setDisabledState(value);
  }

  visible = false;
  inputDisabled = false;
  value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.inputDisabled = isDisabled;
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value = next;
    this.onChange(next);
  }

  onBlur(): void {
    this.onTouched();
  }

  toggleVisibility(): void {
    this.visible = !this.visible;
  }
}
