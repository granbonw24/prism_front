import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type MenaRowActionVariant =
  | 'detail'
  | 'edit'
  | 'submit'
  | 'validate'
  | 'refuse'
  | 'return'
  | 'delete'
  | 'activate'
  | 'deactivate'
  | 'history';

@Component({
  selector: 'app-mena-row-action',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mena-row-action-button.component.html',
  styleUrl: './mena-row-action-button.component.css',
})
export class MenaRowActionButtonComponent {
  @Input({ required: true }) variant!: MenaRowActionVariant;
  @Input() title = '';
  @Input() ariaLabel: string | null = null;
  @Input() disabled = false;
  /** When set, renders a router link instead of a button. */
  @Input() routerLink: string | any[] | null = null;
  /** Overrides the default Font Awesome classes for the variant. */
  @Input() iconClass: string | null = null;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get effectiveAriaLabel(): string {
    return (this.ariaLabel ?? this.title).trim() || this.variant;
  }

  get useLink(): boolean {
    const rl = this.routerLink;
    if (rl === null || rl === undefined) {
      return false;
    }
    if (typeof rl === 'string') {
      return rl.length > 0;
    }
    return Array.isArray(rl) && rl.length > 0;
  }

  get icon(): string {
    if (this.iconClass) {
      return this.iconClass;
    }
    const v = this.variant;
    switch (v) {
      case 'detail':
        return 'fas fa-eye';
      case 'history':
        return 'fas fa-history';
      case 'edit':
        return 'fas fa-pen';
      case 'submit':
        return 'fas fa-paper-plane';
      case 'validate':
        return 'fas fa-check';
      case 'refuse':
        return 'fas fa-times';
      case 'return':
        return 'fas fa-reply';
      case 'delete':
        return 'fas fa-trash-alt';
      case 'activate':
        return 'fas fa-toggle-on';
      case 'deactivate':
        return 'fas fa-ban';
      default: {
        const _exhaustive: never = v;
        return _exhaustive;
      }
    }
  }

  get buttonClass(): string {
    const v = this.variant;
    switch (v) {
      case 'detail':
      case 'history':
      case 'return':
        return 'btn btn-sm btn-outline-secondary mena-btn-action';
      case 'edit':
        return 'btn btn-sm btn-outline-primary mena-btn-action';
      case 'submit':
        return 'btn btn-sm btn-outline-warning mena-btn-action';
      case 'validate':
      case 'activate':
        return 'btn btn-sm btn-outline-success mena-btn-action';
      case 'deactivate':
        return 'btn btn-sm btn-outline-warning mena-btn-action';
      case 'refuse':
      case 'delete':
        return 'btn btn-sm btn-outline-danger mena-btn-action';
      default: {
        const _exhaustive: never = v;
        return _exhaustive;
      }
    }
  }

  onClick(event: MouseEvent): void {
    this.clicked.emit(event);
  }
}
