import { Component, input } from '@angular/core';
import { App } from '../../../models/app.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatusBadgeComponent } from '../app-status-badge/app-status-badge.component';
import { AppLogoComponent } from '../app-logo/app-logo.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterModule, AppStatusBadgeComponent, AppLogoComponent],
  templateUrl: './app-card.component.html',
  styleUrl: './app-card.component.css'
})
export class AppCardComponent {

  app = input.required<App>();

}

