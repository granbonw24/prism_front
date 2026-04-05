import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import type { Ministere } from '@models/ministere';
import { MinistereService } from '@services/ministere.service';

@Component({
  selector: 'app-ministere',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ministere.component.html',
  styleUrl: './ministere.component.css',
})
export class MinistereComponent implements OnInit {
  ministeres: Ministere[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(private readonly ministereService: MinistereService) {}

  ngOnInit(): void {
    this.loading = true;
    this.ministereService.findAll().subscribe({
      next: (list: Ministere[]) => {
        this.ministeres = list;
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Impossible de charger la liste (vérifiez le backend et la session).';
        this.loading = false;
      },
    });
  }
}
