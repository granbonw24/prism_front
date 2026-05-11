import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-categorie-appui-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './categorie-appui-page.component.html',
  styleUrl: './categorie-appui-page.component.css',
})
export class CategorieAppuiPageComponent {}
