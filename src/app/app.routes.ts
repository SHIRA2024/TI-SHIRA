import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MarketplaceComponent } from './features/marketplace/marketplace.component';
import { InstalledComponent } from './features/installed/installed.component';
import { AppDetailsComponent } from './features/app-details/app-details.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        component: MarketplaceComponent
      },
      {
        path: 'installed',
        component: InstalledComponent
      },
      {
        path: 'app/:id',
        component: AppDetailsComponent
      }
    ]
  }
];
