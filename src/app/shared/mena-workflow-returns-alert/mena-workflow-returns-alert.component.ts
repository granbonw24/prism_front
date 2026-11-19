import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  formatReturnAlertDate,
  groupReturnAlertsByModule,
  summarizeReturnAlertsByLabel,
  type WorkflowReturnAlert,
} from '@core/workflow/workflow-return-alert.util';

@Component({
  selector: 'app-mena-workflow-returns-alert',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mena-workflow-returns-alert.component.html',
  styleUrl: './mena-workflow-returns-alert.component.css',
})
export class MenaWorkflowReturnsAlertComponent {
  @Input({ required: true }) alert!: WorkflowReturnAlert;

  modalOpen = false;

  readonly formatReturnAlertDate = formatReturnAlertDate;

  get total(): number {
    return this.alert?.total ?? 0;
  }

  get hasReturns(): boolean {
    return this.total > 0;
  }

  get groups() {
    return groupReturnAlertsByModule(this.alert?.items ?? []);
  }

  get summaryEntries() {
    return summarizeReturnAlertsByLabel(this.alert?.items ?? []);
  }

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }
}
