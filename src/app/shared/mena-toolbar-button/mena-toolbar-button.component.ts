import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type MenaToolbarButtonVariant =
  | 'add'
  | 'add-outline'
  | 'refresh'
  | 'reset'
  | 'filter'
  | 'cancel'
  | 'next'
  | 'print'
  | 'save'
  | 'confirm'
  | 'confirm-danger'
  | 'confirm-success';

@Component({
  selector: 'app-mena-toolbar-btn',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mena-toolbar-button.component.html',
  styleUrl: './mena-toolbar-button.component.css',
})
export class MenaToolbarButtonComponent {
  @Input({ required: true }) variant!: MenaToolbarButtonVariant;
  @Input() label = '';
  @Input() disabled = false;
  @Input() loading = false;
  /** Pleine largeur (ex. colonne filtres). */
  @Input() block = false;
  @Input() routerLink: string | any[] | null = null;
  @Input() type: 'button' | 'submit' = 'button';

  @Output() clicked = new EventEmitter<MouseEvent>();

  get effectiveLabel(): string {
    if (this.label.trim()) {
      return this.label.trim();
    }
    const v = this.variant;
    switch (v) {
      case 'add':
      case 'add-outline':
        return 'Ajouter';
      case 'refresh':
        return 'Rafraîchir';
      case 'reset':
        return 'Réinitialiser';
      case 'filter':
        return 'Filtrer';
      case 'cancel':
        return 'Annuler';
      case 'next':
        return 'Continuer';
      case 'print':
        return 'Imprimer';
      case 'save':
        return 'Enregistrer';
      case 'confirm-danger':
        return 'Supprimer';
      case 'confirm-success':
        return 'Confirmer';
      case 'confirm':
        return 'Confirmer';
      default: {
        const _exhaustive: never = v;
        return _exhaustive;
      }
    }
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
    const v = this.variant;
    switch (v) {
      case 'add':
      case 'add-outline':
        return 'fas fa-plus';
      case 'refresh':
        return 'fas fa-sync-alt';
      case 'reset':
        return 'fas fa-undo';
      case 'filter':
        return 'fas fa-filter';
      case 'cancel':
        return 'fas fa-arrow-left';
      case 'next':
        return 'fas fa-arrow-right';
      case 'print':
        return 'fas fa-print';
      case 'save':
        return 'fas fa-save';
      case 'confirm-danger':
        return 'fas fa-trash-alt';
      case 'confirm-success':
      case 'confirm':
        return 'fas fa-check';
      default: {
        const _exhaustive: never = v;
        return _exhaustive;
      }
    }
  }

  get buttonClass(): string {
    const block = this.block ? ' btn-block' : '';
    const v = this.variant;
    switch (v) {
      case 'add':
        return `btn btn-sm btn-primary shadow-sm mena-toolbar-btn mena-toolbar-btn--add${block}`;
      case 'add-outline':
      case 'refresh':
        return `btn btn-sm btn-outline-primary mena-toolbar-btn${block}`;
      case 'cancel':
        return `btn btn-sm btn-outline-secondary mena-toolbar-btn mena-toolbar-btn--soft-secondary${block}`;
      case 'reset':
        return `btn btn-sm btn-outline-warning mena-toolbar-btn mena-toolbar-btn--soft-reset${block}`;
      case 'next':
        return `btn btn-sm btn-outline-primary mena-toolbar-btn mena-toolbar-btn--soft-primary${block}`;
      case 'print':
        return `btn btn-sm btn-outline-primary mena-toolbar-btn mena-toolbar-btn--soft-print${block}`;
      case 'filter':
      case 'save':
      case 'confirm':
        return `btn btn-sm btn-primary mena-toolbar-btn mena-toolbar-btn--soft-primary-solid${block}`;
      case 'confirm-danger':
        return `btn btn-sm btn-danger mena-toolbar-btn${block}`;
      case 'confirm-success':
        return `btn btn-sm btn-success mena-toolbar-btn${block}`;
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
