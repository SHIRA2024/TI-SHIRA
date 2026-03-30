import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Navbar Component
 * 
 * Main layout/navigation component that provides the application shell with navigation and routing.
 * This component serves as the parent container for all feature views (marketplace,
 * installed apps, app details).
 * 
 * Architecture Role:
 * - Acts as the root layout/navbar component for authenticated/logged-in users
 * - Provides consistent navigation header across all views
 * - Contains router-outlet for child route components
 * - Handles top-level navigation between main sections
 * 
 * Navigation Structure:
 * - Marketplace: Browse and discover all available apps
 * - Installed Apps: View and manage installed applications
 * 
 * @component
 * @standalone This is a standalone component (Angular 17+)
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  /**
   * Application Title
   * 
   * Display name for the Connectivity Toolbox application.
   * Shown in the header navigation bar.
   */
      title = 'Connectivity Toolbox';
      constructor(
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef
      ) {}
        toastMessage: string | null = null;

        private toastListener = (event: Event) => {
      const customEvent = event as CustomEvent<string>;

      this.ngZone.run(() => {
        this.showToast(customEvent.detail);
      });
    };

        ngOnInit(): void {
        window.addEventListener('show-toast', this.toastListener);
      }

      ngOnDestroy(): void {
        window.removeEventListener('show-toast', this.toastListener);
      }

        showToast(message: string): void {
          this.toastMessage = message;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.ngZone.run(() => {
              this.toastMessage = null;
              this.cdr.detectChanges();
            });
          }, 2500);
        }
}

