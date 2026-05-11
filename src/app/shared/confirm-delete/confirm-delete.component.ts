import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-delete.component.html',
})
export class ConfirmDeleteComponent {
  @Input() title = 'Supprimer ?';
  @Input() message = 'Cette action est définitive';
  @Input() targetLabel = '';
  @Input() fallbackLabel = '';
  @Input() errorMessage: string | null = null;
  @Input() deleting = false;
  @Input() confirmLabel = 'Supprimer';
  @Input() deletingLabel = 'Suppression...';

  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<void>();

  cancel(): void {
    if (!this.deleting) {
      this.cancelled.emit();
    }
  }

  confirm(): void {
    if (!this.deleting) {
      this.confirmed.emit();
    }
  }
}
