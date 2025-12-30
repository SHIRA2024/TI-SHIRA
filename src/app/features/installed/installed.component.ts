import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';

/**
 * Installed Apps Component
 * 
 * Feature component that displays only the applications that are currently installed
 * or have updates available. This provides a focused view for managing installed tools.
 * 
 * Purpose:
 * - Quick access to installed applications
 * - Easy identification of apps needing updates
 * - Simplified management interface (no "install" actions shown)
 * 
 * Filtering Logic:
 * Shows apps with status 'Installed' or 'UpdateAvailable' (excludes 'Available' apps)
 * 
 * User Flow:
 * 1. User navigates to "Installed Apps" from dashboard
 * 2. Sees filtered list of only installed/updateable apps
 * 3. Can update apps with available updates
 * 4. Can uninstall apps they no longer need
 * 
 * @component
 * @standalone This is a standalone component (Angular 17+)
 */
@Component({
  selector: 'app-installed',
  standalone: true,
  imports: [CommonModule, AppCardComponent],
  templateUrl: './installed.component.html',
  styleUrl: './installed.component.css'
})
export class InstalledComponent implements OnInit {
  /**
   * Installed Apps List Signal
   * 
   * Reactive signal containing only the apps that are installed or have updates available.
   * This is a filtered subset of all apps.
   */
  apps = signal<App[]>([]);
  
  /**
   * Loading State Signal
   * 
   * Indicates whether the component is currently fetching app data.
   * Used to show loading spinner in the template.
   */
  loading = signal<boolean>(true);

  /**
   * Constructor
   * 
   * Injects the AppService dependency for fetching and managing app data.
   * 
   * @param {AppService} appService - Service for app data operations
   */
  constructor(private appService: AppService) {}

  /**
   * Component Initialization
   * 
   * Lifecycle hook called after Angular has initialized the component.
   * Loads the installed apps when the component is first rendered.
   */
  ngOnInit(): void {
    this.loadApps();
  }

  /**
   * Load Installed Applications
   * 
   * Fetches all applications from the AppService, then filters to show only
   * installed apps and apps with available updates.
   * 
   * Filtering Logic:
   * Includes apps with status 'Installed' or 'UpdateAvailable'
   * Excludes apps with status 'Available' (not yet installed)
   * 
   * Flow:
   * 1. Set loading to true (show spinner)
   * 2. Call AppService.getApps() to get all apps
   * 3. Filter to installed/updateable apps
   * 4. Update apps signal and hide loading
   */
  loadApps(): void {
    this.loading.set(true);
    this.appService.getApps().subscribe({
      next: (allApps) => {
        // Filter to show only installed apps and apps with updates available
        const installedApps = allApps.filter(app => 
          app.status === AppStatus.Installed || app.status === AppStatus.UpdateAvailable
        );
        this.apps.set(installedApps);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load apps', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Handle Uninstall Action
   * 
   * Called when user clicks uninstall button on an app card.
   * Delegates to AppService to perform the uninstallation, then refreshes the app list.
   * 
   * After uninstallation, the app will no longer appear in this view since it will
   * have status 'Available' and will be filtered out.
   * 
   * @param {string} appId - The unique identifier of the app to uninstall
   */
  onUninstall(appId: string): void {
    this.appService.uninstallApp(appId).subscribe({
      next: () => {
        // Reload apps - uninstalled app will be filtered out
        this.loadApps();
      },
      error: (error) => {
        console.error('Failed to uninstall app', error);
        // In production, show user-friendly error message
      }
    });
  }

  /**
   * Handle Update Action
   * 
   * Called when user clicks update button on an app card.
   * Delegates to AppService to perform the update, then refreshes the app list.
   * 
   * After update, the app status changes from 'UpdateAvailable' to 'Installed',
   * but it remains visible in this view.
   * 
   * @param {string} appId - The unique identifier of the app to update
   */
  onUpdate(appId: string): void {
    this.appService.updateApp(appId).subscribe({
      next: () => {
        // Reload apps to reflect the status change
        this.loadApps();
      },
      error: (error) => {
        console.error('Failed to update app', error);
        // In production, show user-friendly error message
      }
    });
  }
}

