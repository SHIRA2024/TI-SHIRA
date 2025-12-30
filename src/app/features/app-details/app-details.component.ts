import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppStatusBadgeComponent } from '../../shared/components/app-status-badge/app-status-badge.component';

/**
 * App Details Component
 * 
 * Feature component that displays comprehensive information about a single application.
 * This is the detail view accessed when users click "View Details" on an app card.
 * 
 * Features:
 * - Full app information display (description, metadata, version info)
 * - Context-aware action buttons (install/update/uninstall based on status)
 * - Loading and error states
 * - Action progress indicators
 * - Launch app placeholder functionality
 * 
 * Routing:
 * Accessed via route: /app/:id
 * Uses route parameter to identify which app to display
 * 
 * User Flow:
 * 1. User clicks "View Details" on app card
 * 2. Navigates to /app/{id}
 * 3. Component loads app data by ID
 * 4. Displays full details and available actions
 * 5. User can perform install/update/uninstall/launch actions
 * 
 * @component
 * @standalone This is a standalone component (Angular 17+)
 */
@Component({
  selector: 'app-app-details',
  standalone: true,
  imports: [CommonModule, RouterModule, AppStatusBadgeComponent],
  templateUrl: './app-details.component.html',
  styleUrl: './app-details.component.css'
})
export class AppDetailsComponent implements OnInit {
  /**
   * Current App Signal
   * 
   * Reactive signal containing the app object being displayed.
   * Null when app is loading or not found.
   */
  app = signal<App | null>(null);
  
  /**
   * Loading State Signal
   * 
   * Indicates whether the component is currently fetching app data.
   * Used to show loading spinner in the template.
   */
  loading = signal<boolean>(true);
  
  /**
   * Action In Progress Signal
   * 
   * Tracks which action (if any) is currently being performed.
   * Values: 'install', 'uninstall', 'update', or null
   * Used to disable buttons and show progress indicators during async operations.
   */
  actionInProgress = signal<string | null>(null);

  /**
   * Constructor
   * 
   * Injects dependencies:
   * - ActivatedRoute: Access route parameters (app ID)
   * - Router: Navigation functionality
   * - AppService: App data operations
   * 
   * @param {ActivatedRoute} route - Service for accessing route parameters
   * @param {Router} router - Service for programmatic navigation
   * @param {AppService} appService - Service for app data operations
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService
  ) {}

  /**
   * Component Initialization
   * 
   * Lifecycle hook called after Angular has initialized the component.
   * Extracts the app ID from route parameters and loads the app data.
   */
  ngOnInit(): void {
    // Get app ID from route parameter (e.g., /app/1 -> id = '1')
    const appId = this.route.snapshot.paramMap.get('id');
    if (appId) {
      this.loadApp(appId);
    }
    // If no ID found, app will remain null and template shows error state
  }

  /**
   * Load Application by ID
   * 
   * Fetches a single application by its unique identifier from the AppService.
   * Updates component state with the app data or handles error scenarios.
   * 
   * @param {string} id - The unique identifier of the app to load
   */
  loadApp(id: string): void {
    this.loading.set(true);
    this.appService.getAppById(id).subscribe({
      next: (app) => {
        if (app) {
          this.app.set(app);
        }
        // If app is null/undefined, template will show "not found" message
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load app', error);
        this.loading.set(false);
        // Template will show error state
      }
    });
  }

  /**
   * Handle Install Action
   * 
   * Called when user clicks the install button.
   * Shows progress indicator, performs installation, then refreshes app data.
   * 
   * Flow:
   * 1. Set actionInProgress to 'install' (disables buttons, shows progress)
   * 2. Call AppService.installApp()
   * 3. On success: reload app data to reflect status change
   * 4. Clear actionInProgress to re-enable buttons
   * 5. On error: log error and clear actionInProgress
   */
  handleInstall(): void {
    const app = this.app();
    if (!app) return; // Guard clause: ensure app exists

    this.actionInProgress.set('install');
    this.appService.installApp(app.id).subscribe({
      next: () => {
        // Reload app to get updated status
        this.loadApp(app.id);
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to install app', error);
        this.actionInProgress.set(null);
        // In production, show user-friendly error toast/notification
      }
    });
  }

  /**
   * Handle Uninstall Action
   * 
   * Called when user clicks the uninstall button.
   * Shows progress indicator, performs uninstallation, then refreshes app data.
   * 
   * Flow:
   * 1. Set actionInProgress to 'uninstall' (disables buttons, shows progress)
   * 2. Call AppService.uninstallApp()
   * 3. On success: reload app data to reflect status change
   * 4. Clear actionInProgress to re-enable buttons
   */
  handleUninstall(): void {
    const app = this.app();
    if (!app) return; // Guard clause: ensure app exists

    this.actionInProgress.set('uninstall');
    this.appService.uninstallApp(app.id).subscribe({
      next: () => {
        // Reload app to get updated status
        this.loadApp(app.id);
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to uninstall app', error);
        this.actionInProgress.set(null);
      }
    });
  }

  /**
   * Handle Update Action
   * 
   * Called when user clicks the update button.
   * Shows progress indicator, performs update, then refreshes app data.
   * 
   * Flow:
   * 1. Set actionInProgress to 'update' (disables buttons, shows progress)
   * 2. Call AppService.updateApp()
   * 3. On success: reload app data to reflect status change
   * 4. Clear actionInProgress to re-enable buttons
   */
  handleUpdate(): void {
    const app = this.app();
    if (!app) return; // Guard clause: ensure app exists

    this.actionInProgress.set('update');
    this.appService.updateApp(app.id).subscribe({
      next: () => {
        // Reload app to get updated status
        this.loadApp(app.id);
        this.actionInProgress.set(null);
      },
      error: (error) => {
        console.error('Failed to update app', error);
        this.actionInProgress.set(null);
      }
    });
  }

  /**
   * Handle Launch Action
   * 
   * Placeholder method for launching an installed application.
   * In a production environment, this would:
   * - Open the app in an iframe or new window
   * - Navigate to the app's URL
   * - Or trigger a custom app launch protocol
   * 
   * Current Implementation:
   * Shows an alert as a placeholder. This should be replaced with actual
   * app launching logic based on the app's configuration/metadata.
   */
  handleLaunch(): void {
    // Placeholder for launching app
    // TODO: Implement actual app launch logic
    // This could involve:
    // - Opening app URL in iframe
    // - Navigating to app route
    // - Calling app-specific launch handler
    alert('App launch functionality would be implemented here. This is a placeholder.');
  }

  /**
   * Can Install Check
   * 
   * Determines if the install button should be displayed.
   * Only apps with status 'Available' can be installed.
   * 
   * @returns {boolean} True if install action is available
   */
  get canInstall(): boolean {
    return this.app()?.status === AppStatus.Available;
  }

  /**
   * Can Uninstall Check
   * 
   * Determines if the uninstall button should be displayed.
   * Only apps with status 'Installed' can be uninstalled.
   * 
   * @returns {boolean} True if uninstall action is available
   */
  get canUninstall(): boolean {
    return this.app()?.status === AppStatus.Installed;
  }

  /**
   * Can Update Check
   * 
   * Determines if the update button should be displayed.
   * Only apps with status 'UpdateAvailable' can be updated.
   * 
   * @returns {boolean} True if update action is available
   */
  get canUpdate(): boolean {
    return this.app()?.status === AppStatus.UpdateAvailable;
  }

  /**
   * Is Installed Check
   * 
   * Determines if the launch button should be displayed.
   * Apps that are installed OR have updates available are considered "installed"
   * and can be launched.
   * 
   * @returns {boolean} True if app is installed (regardless of update status)
   */
  /**
   * Is Installed Check
   * 
   * Determines if the launch button should be displayed.
   * Apps that are installed OR have updates available are considered "installed"
   * and can be launched.
   * 
   * @returns {boolean} True if app is installed (regardless of update status)
   */
  get isInstalled(): boolean {
    return this.app()?.status === AppStatus.Installed || this.app()?.status === AppStatus.UpdateAvailable;
  }
}

