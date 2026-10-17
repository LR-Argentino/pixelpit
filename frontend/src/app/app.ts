import {Component} from '@angular/core';
import {Auth} from './core/auth/auth';

@Component({
  imports: [
    Auth
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html'
})
export class App {

}
