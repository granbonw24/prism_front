import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mena-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mena-loading.component.html',
  styleUrl: './mena-loading.component.css',
})
export class MenaLoadingComponent {
  /** Texte affiché à côté du spinner (vide = icône seule). */
  @Input() message = 'Chargement…';
  /** `sm` pour listes / champs ; `md` pour zones plus larges. */
  @Input() size: 'sm' | 'md' = 'md';
  /** Affichage en ligne (filtres, selects). */
  @Input() inline = false;
  /** Centrage horizontal pour modales et tableaux. */
  @Input() centered = false;
}
