import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isNationalView } from '@core/circonscription/circonscription.util';
import { MenuContextDashboard, MenuContextDashboardModule } from '@models/context-dashboard';
import { AuthService } from '@services/auth.service';
import { ContextDashboardService } from '@services/context-dashboard.service';

@Component({
  selector: 'app-mena-context-dashboard',
  standalone: true,
  imports: [
    MenaLoadingComponent,CommonModule],
  templateUrl: './mena-context-dashboard.component.html',
  styleUrl: './mena-context-dashboard.component.css',
})
export class MenaContextDashboardComponent implements OnChanges {
  @Input({ required: true }) module!: MenuContextDashboardModule;
  @Input() centreType?: string;
  @Input() centreId?: number | null;
  @Input() subModule?: string;
  @Input() apiPath?: string;
  /** Titre de section (défaut : Vue d'ensemble). */
  @Input() title = "Vue d'ensemble";
  /** Afficher le bandeau même sans filtre centre (ex. promoteurs). */
  @Input() alwaysVisible = false;

  loading = false;
  dashboard: MenuContextDashboard | null = null;

  constructor(
    private readonly contextDashboard: ContextDashboardService,
    private readonly auth: AuthService,
  ) {}

  get visible(): boolean {
    return (
      this.alwaysVisible ||
      isNationalView(this.auth.currentSession) ||
      !!(this.centreType && this.centreType !== '') ||
      this.centreId != null
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['module'] ||
      changes['centreType'] ||
      changes['centreId'] ||
      changes['subModule'] ||
      changes['apiPath'] ||
      changes['alwaysVisible']
    ) {
      this.reload();
    }
  }

  reload(): void {
    if (!this.module) {
      return;
    }
    const national = isNationalView(this.auth.currentSession);
    if (!this.alwaysVisible && !national && !this.centreType && this.centreId == null) {
      this.dashboard = null;
      this.loading = false;
      return;
    }
    this.loading = true;
    this.contextDashboard
      .load({
        module: this.module,
        centreType: this.centreType,
        centreId: this.centreId,
        subModule: this.subModule,
        apiPath: this.apiPath,
      })
      .subscribe({
        next: (d) => {
          this.dashboard = d;
          this.loading = false;
        },
        error: () => {
          this.dashboard = null;
          this.loading = false;
        },
      });
  }

  cardColClass(index: number, total: number): string {
    if (total <= 2) {
      return 'col-sm-6 col-lg-6';
    }
    if (total <= 4) {
      return 'col-6 col-md-4 col-lg-3';
    }
    return index >= total - 1 && total % 2 === 1 ? 'col-12 col-md-8 col-lg-4' : 'col-6 col-md-4 col-lg-2';
  }
}
