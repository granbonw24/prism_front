import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid px-2 px-sm-3">
      <div class="card border-0 shadow-sm">
        <div class="card-header py-3 bg-white border-bottom-0">
          <h6 class="m-0 font-weight-bold text-primary">{{ title }}</h6>
        </div>
        <div class="card-body">
          <p class="text-muted mb-0">
            Cette section est accessible et prête pour l'intégration des ecrans metier.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class SectionPlaceholderComponent {
  title = 'Section';

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = String(this.route.snapshot.data['title'] ?? 'Section');
  }
}

