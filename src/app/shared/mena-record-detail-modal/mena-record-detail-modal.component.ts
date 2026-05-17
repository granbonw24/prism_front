import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface MenaRecordDetailField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-mena-record-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mena-record-detail-modal.component.html',
  styleUrl: './mena-record-detail-modal.component.css',
})
export class MenaRecordDetailModalComponent {
  @Input() open = false;
  @Input() title = 'Détails';
  @Input() subtitle = '';
  @Input() loading = false;
  @Input() fields: MenaRecordDetailField[] = [];

  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }
}
