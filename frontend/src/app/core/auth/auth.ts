import { Component } from '@angular/core';
import { Register } from './register/register';

@Component({
  imports: [Register],
  selector: 'app-auth',
  styleUrl: './auth.css',
  templateUrl: './auth.html',
})
export class Auth {}
