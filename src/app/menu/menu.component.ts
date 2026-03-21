import { Component } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterOutlet,RouterLink],
  templateUrl: './menu.component.html',
  styles: ``
})
export class MenuComponent {

}
