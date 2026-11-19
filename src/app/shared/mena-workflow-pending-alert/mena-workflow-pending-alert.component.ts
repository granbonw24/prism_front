import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { workflowReturnCorrectQueryParams } from '@core/workflow/workflow-deep-link.util';
import {
  formatReturnAlertDate,
  groupReturnAlertsByModule,
  summarizeReturnAlertsByLabel,
  workflowReturnItemTitle,
  type WorkflowReturnAlert,
} from '@core/workflow/workflow-return-alert.util';

@Component({
  selector: 'app-mena-workflow-pending-alert',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mena-workflow-pending-alert.component.html',
  styleUrl: './mena-workflow-pending-alert.component.css',
})
export class MenaWorkflowPendingAlertComponent {
  @Input({ required: true }) alert!: WorkflowReturnAlert;

  modalOpen = false;
  readonly formatReturnAlertDate = formatReturnAlertDate;
  readonly itemTitle = workflowReturnItemTitle;

  correctQueryParams(item: (WorkflowReturnAlert['items'][number])): Record<string, string> {
    return { ...workflowReturnCorrectQueryParams(item), workflowTab: 'ACTION' };
  }

  get total(): number {
    return this.alert?.total ?? 0;
  }

  get hasPending(): boolean {
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