import { Component } from '@angular/core';
import { Sidebar } from '../../layout/sidebar/sidebar';

/** Startseite: setzt die einzelnen Bereiche zusammen, enthält selbst keine Logik. */
@Component({
  imports: [Sidebar],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
