import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  countByWorkflowTab,
  type WorkflowQueueTab,
  workflowQueueTabLabels,
} from '@core/workflow/workflow-queue.util';
import type { AuthSession } from '@core/models/auth.models';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import { toMenaSelectOptionsFromPairs } from '@shared/mena-searchable-select/mena-select-options.util';

@Component({
  selector: 'app-mena-workflow-queue-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MenaSearchableSelectComponent],
  templateUrl: './mena-workflow-queue-toolbar.component.html',
  styleUrl: './mena-workflow-queue-toolbar.component.css',
})
export class MenaWorkflowQueueToolbarComponent {
  @Input({ required: true }) rows: Record<string, unknown>[] = [];
  @Input() session: AuthSession | null = null;
  @Input() activeTab: WorkflowQueueTab = 'ACTION';
  @Input() filterCentreId: number | '' = '';
  @Input() filterConseiller = '';
  @Input() centreOptions: Array<{ value: number | ''; label: string }> = [];
  @Input() conseillerOptions: Array<{ value: string; label: string }> = [];
  @Input() disabled = false;

  @Output() activeTabChange = new EventEmitter<WorkflowQueueTab>();
  @Output() filterCentreIdChange = new EventEmitter<number | ''>();
  @Output() filterConseillerChange = new EventEmitter<string>();

  readonly tabs: WorkflowQueueTab[] = ['ACTION', 'EN_COURS', 'RENVOYE', 'TERMINE'];

  get labels() {
    return workflowQueueTabLabels(this.session);
  }

  get counts(): Record<WorkflowQueueTab, number> {
    return countByWorkflowTab(this.rows);
  }

  selectTab(tab: WorkflowQueueTab): void {
    if (tab === this.activeTab) {
      return;
    }
    this.activeTabChange.emit(tab);
  }

  menaCentreOptions() {
    return toMenaSelectOptionsFromPairs(
      this.centreOptions.map((o) => ({
        value: o.value === '' ? '' : String(o.value),
        label: o.label,
      })),
    );
  }

  menaConseillerOptions() {
    return toMenaSelectOptionsFromPairs([
      { value: '', label: 'Tous les conseillers' },
      ...this.conseillerOptions,
    ]);
  }

  onCentreChange(value: string | number | null): void {
    if (value === '' || value == null) {
      this.filterCentreIdChange.emit('');
      return;
    }
    const n = Number(value);
    this.filterCentreIdChange.emit(Number.isFinite(n) ? n : '');
  }

  onConseillerChange(value: string | number | null): void {
    this.filterConseillerChange.emit(value == null ? '' : String(value));
  }
}
