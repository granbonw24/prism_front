import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface MenaRecordDetailField {
  label: string;
  value: string;
  /** Affiche une ligne de section (titre de groupe) au lieu d’une paire label/valeur. */
  section?: boolean;
}

@Component({
  selector: 'app-mena-record-detail-modal',
  standalone: true,
  imports: [
    MenaLoadingComponent,CommonModule],
  templateUrl: './mena-record-detail-modal.component.html',
  styleUrl: './mena-record-detail-modal.component.css',
})
export class MenaRecordDetailModalComponent {
  @Input() open = false;
  @Input() title = 'Détails';
  @Input() subtitle = '';
  @Input() loading = false;
  @Input() fields: MenaRecordDetailField[] = [];
  /** Affiche le bouton Historique (workflow multi-validation). */
  @Input() showHistory = false;

  @Output() closed = new EventEmitter<void>();
  @Output() historyRequested = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

  onHistory(): void {
    this.historyRequested.emit();
  }
}
