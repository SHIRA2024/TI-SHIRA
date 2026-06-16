import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { App, AppStatus } from '../../models/app.model';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';

/**
 * Marketplace Component
 * 
 * Main feature component that displays the app marketplace where users can browse,
 * filter, and manage applications. This is the primary entry point for discovering
 * and installing internal tools.
 * 
 * Features:
 * - Grid and list view toggle for different viewing preferences
 * - Status-based filtering (All, Installed, Updates Available, Available)
 * - Real-time app management (install, update, uninstall)
 * - Dynamic counts for installed apps and available updates
 * 
 * User Flow:
 * 1. User lands on marketplace (default route)
 * 2. Sees all available apps in grid or list view
 * 3. Can filter by status to focus on specific app states
 * 4. Can install/update/uninstall apps directly from cards
 * 5. Can click "View Details" to see more information
 * 
 * @component
 * @standalone This is a standalone component (Angular 17+)
 */
type statusType = 'all'|'installed'|'update-available'|'available';
@Component({
  selector: 'app-marketplace',
  // standalone: true,
  imports: [CommonModule, AppCardComponent],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.css'
})
export class MarketplaceComponent implements OnInit {
  /**
   * Apps List Signal
   * 
   * Reactive signal containing the current list of all applications.
   * Updated whenever apps are loaded or modified.
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
   * View Mode Signal
   * 
   * Controls the display format of the app list.
   * - 'grid': Cards displayed in a responsive grid layout
   * - 'list': Cards displayed in a single-column list layout
   */
  viewMode = signal<'grid' | 'list'>('grid');
  
  /**
   * Filter Status Signal
   * 
   * Current filter selection for app status.
   * Values: 'all', 'installed', 'update-available', 'available'
   * Used to filter which apps are displayed.
   */
 
  filterStatus = signal<statusType>('all');

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
   * Loads the initial app data when the component is first rendered.
   */
  ngOnInit(): void {
    this.loadApps();
  }

  /**
   * Load Applications
   * 
   * Fetches all applications from the AppService and updates the component state.
   * Handles loading state and error scenarios.
   * 
   * Flow:
   * 1. Set loading to true (show spinner)
   * 2. Call AppService.getApps()
   * 3. On success: update apps signal and hide loading
   * 4. On error: log error and hide loading
   */
  loadApps(): void {
    this.loading.set(true);
    this.appService.getApps().subscribe({
      next: (apps) => {
        this.apps.set(apps);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load apps', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Handle Install Action
   * 
   * Called when user clicks install button on an app card.
   * Delegates to AppService to perform the installation, then refreshes the app list.
   * 
   * @param {string} appId - The unique identifier of the app to install
   */
  onInstall(appId: string): void {
    this.appService.installApp(appId).subscribe({
      next: () => {
        // Reload apps to reflect the status change
        this.loadApps();
      },
      error: (error) => {
        console.error('Failed to install app', error);
        // In production, show user-friendly error message
      }
    });
  }

  /**
   * Handle Uninstall Action
   * 
   * Called when user clicks uninstall button on an app card.
   * Delegates to AppService to perform the uninstallation, then refreshes the app list.
   * 
   * @param {string} appId - The unique identifier of the app to uninstall
   */
  onUninstall(appId: string): void {
    this.appService.uninstallApp(appId).subscribe({
      next: () => {
        // Reload apps to reflect the status change
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

  /**
   * Toggle View Mode
   * 
   * Switches between grid and list view modes.
   * Provides users with different ways to browse apps based on preference.
   */
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  /**
   * Set Filter Status
   * 
   * Updates the current filter status to show only apps matching the selected status.
   * Used by filter buttons in the template.
   * 
   * @param {string} status - The status to filter by ('all', 'installed', 'update-available', 'available')
   */
  setFilterStatus(status:statusType): void {
    this.filterStatus.set(status);
  }

  /**
   * Filtered Apps Getter
   * 
   * Computed property that returns the apps list filtered by the current filter status.
   * This getter is reactive - Angular will re-evaluate it when filterStatus signal changes.
   * 
   * Filter Logic:
   * - 'all': Returns all apps
   * - Other values: Returns only apps matching that status
   * 
   * @returns {App[]} Filtered array of apps based on current filter selection
   */
  get filteredApps(): App[] {
    const apps = this.apps();
    const filter = this.filterStatus();
    
    if (filter === 'all') {
      return apps;
    }
    
    // Filter apps by status, casting filter string to AppStatus enum
    return apps.filter(app => app.status === filter as AppStatus);
  }

  /**
   * Installed Apps Count Getter
   * 
   * Calculates the number of apps currently installed.
   * Used to display count badges in filter buttons.
   * 
   * @returns {number} Count of apps with 'Installed' status
   */
  get installedCount(): number {
    return this.apps().filter(app => app.status === AppStatus.Installed).length;
  }

  /**
   * Update Available Count Getter
   * 
   * Calculates the number of apps that have updates available.
   * Used to display count badges in filter buttons.
   * 
   * @returns {number} Count of apps with 'UpdateAvailable' status
   */
  get updateAvailableCount(): number {
    return this.apps().filter(app => app.status === AppStatus.UpdateAvailable).length;
  }

  refreshApps(): void {
    // this method uses the AppService's refreshApps method to create a refresh button.
    this.appService.refreshApps();
  }
}

