import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { App, AppStatus } from '../models/app.model';

/**
 * App Service
 * 
 * Central service for managing application data and operations in the Connectivity Toolbox.
 * This service acts as the single source of truth for app state and provides methods
 * for installing, updating, and uninstalling apps.
 * 
 * Architecture Notes:
 * - Uses Angular signals for reactive state management
 * - Simulates API calls with Observable patterns and delays
 * - Persists state to localStorage for demonstration purposes
 * - In a production environment, this would make HTTP calls to a backend API
 * 
 * @injectable Provided at root level for singleton behavior across the application
 */
@Injectable({
  providedIn: 'root'
})
export class AppService {
  /**
   * Mock Application Data
   * 
   * Sample applications for demonstration purposes. In a production environment,
   * this data would be fetched from a backend API endpoint.
   * 
   * The mock data includes various app statuses to demonstrate all functionality:
   * - Installed apps (with and without updates)
   * - Available apps (not yet installed)
   * - Apps with updates available
   */
  private mockApps: App[] = [
    {
      id: '1',
      name: 'Network Analyzer',
      version: '2.1.0',
      description: 'Advanced network analysis tool for troubleshooting connectivity issues.',
      status: AppStatus.Installed,
      installedVersion: '2.0.5',
    },
    {
      id: '2',
      name: 'API Gateway Manager',
      version: '1.5.2',
      description: 'Manage and monitor API gateway configurations and endpoints.',
      status: AppStatus.Available,
    },
    {
      id: '3',
      name: 'Database Monitor',
      version: '3.0.0',
      description: 'Real-time database performance monitoring and query analysis.',
      status: AppStatus.UpdateAvailable,
      installedVersion: '2.9.1',
     
    },
    {
      id: '4',
      name: 'Log Aggregator',
      version: '1.2.3',
      description: 'Centralized log collection and analysis across all services.',
      status: AppStatus.Installed,
      installedVersion: '1.2.3',
    },
    {
      id: '5',
      name: 'Security Scanner',
      version: '2.3.1',
      description: 'Automated security vulnerability scanning and reporting.',
      status: AppStatus.Available,
    },
    {
      id: '6',
      name: 'Performance Profiler',
      version: '1.8.0',
      description: 'Application performance profiling and bottleneck identification.',
      status: AppStatus.Installed,
      installedVersion: '1.8.0',
    }

    ,
{
  id: '7',
  name: 'Cache Manager',
  version: '2.4.0',
  description: 'Manage distributed cache settings and monitor cache health.',
  status: AppStatus.Available,
},

{
  id: '8',
  name: 'Release Dashboard',
  version: '1.9.2',
  description: 'Track deployments, release readiness, and version rollout status.',
  status: AppStatus.Installed,
  installedVersion: '1.9.2',
}
  ];

  /**
   * Reactive State Signal
   * 
   * Angular signal containing the current list of all applications.
   * Signals provide reactive updates - components can reactively respond to changes.
   * 
   * Using signals instead of BehaviorSubject provides:
   * - Better integration with Angular's change detection
   * - Simpler API for reading/writing values
   * - Automatic dependency tracking
   */
  private apps = signal<App[]>(this.mockApps);

  /**
   * Constructor
   * 
   * Initializes the service and attempts to load persisted app state from localStorage.
   * This simulates persistence across page refreshes. In production, this would
   * typically fetch initial data from an API endpoint.
   */
  constructor() {
    // Load apps from localStorage if available (persistence simulation)
    // This allows the app state to persist across browser sessions
    const savedApps = localStorage.getItem('connectivity-toolbox-apps');
    if (savedApps) {
      try {
        this.apps.set(JSON.parse(savedApps));
      } catch (e) {
        // If localStorage data is corrupted, fall back to mock data
        console.error('Failed to load apps from localStorage', e);
      }
    }
  }

  /**
   * Get All Applications
   * 
   * Retrieves the complete list of applications from the service.
   * Returns an Observable to simulate an async API call.
   * 
   * @returns {Observable<App[]>} Observable that emits the array of all apps
   * 
   * Usage:
   * ```typescript
   * this.appService.getApps().subscribe(apps => {
   *   // Handle apps array
   * });
   * ```
   */
  getApps(): Observable<App[]> {
    // Simulate network delay (300ms) to mimic real API behavior
    return of(this.apps()).pipe(delay(300));
  }

  /**
   * Get Application by ID
   * 
   * Retrieves a single application by its unique identifier.
   * Useful for detail views and operations on specific apps.
   * 
   * @param {string} id - The unique identifier of the app to retrieve
   * @returns {Observable<App | undefined>} Observable that emits the app if found, or undefined
   * 
   * Usage:
   * ```typescript
   * this.appService.getAppById('1').subscribe(app => {
   *   if (app) {
   *     // App found
   *   }
   * });
   * ```
   */
  getAppById(id: string): Observable<App | undefined> {
    const app = this.apps().find(a => a.id === id);
    // Simulate shorter delay for single-item fetch
    return of(app).pipe(delay(200));
  }

  /**
   * Install Application
   * 
   * Installs an application by updating its status to 'Installed' and setting
   * the installedVersion to match the current version.
   * 
   * Business Logic:
   * - Changes app status from 'Available' to 'Installed'
   * - Records the installed version for future update detection
   * - Persists the change to localStorage
   * 
   * @param {string} id - The unique identifier of the app to install
   * @returns {Observable<App>} Observable that emits the updated app on success
   * @throws {Error} If the app is not found
   * 
   * Usage:
   * ```typescript
   * this.appService.installApp('1').subscribe({
   *   next: (app) => console.log('Installed:', app.name),
   *   error: (err) => console.error('Installation failed:', err)
   * });
   * ```
   */
  installApp(id: string): Observable<void> {
    return new Observable(observer => {
      // Simulate installation process delay (500ms)
      setTimeout(() => {
        const app = this.apps().find(a => a.id === id);
        if (app) {
          // Create updated app object with new status
          const updatedApp: App = {
            ...app,
            status: AppStatus.Installed,
            installedVersion: app.version // Record the version being installed
          };
          this.updateAppInArray(updatedApp);
          this.saveToLocalStorage();
          observer.next();
          observer.complete();
        } else {
          observer.error(new Error('App not found'));
        }
      }, 500);
    });
  }

  /**
   * Uninstall Application
   * 
   * Removes an installed application by resetting its status to 'Available'
   * and clearing the installedVersion field.
   * 
   * Business Logic:
   * - Changes app status from 'Installed' to 'Available'
   * - Removes installedVersion to indicate no installation
   * - Persists the change to localStorage
   * 
   * @param {string} id - The unique identifier of the app to uninstall
   * @returns {Observable<void>} Observable that completes on success
   * @throws {Error} If the app is not found
   * 
   * Usage:
   * ```typescript
   * this.appService.uninstallApp('1').subscribe({
   *   next: () => console.log('Uninstalled successfully'),
   *   error: (err) => console.error('Uninstallation failed:', err)
   * });
   * ```
   */
  uninstallApp(id: string): Observable<void> {
    return new Observable(observer => {
      // Simulate uninstallation process delay (400ms)
      setTimeout(() => {
        const app = this.apps().find(a => a.id === id);
        if (app) {
          // Reset app to available state
          const updatedApp: App = {
            ...app,
            status: AppStatus.Available,
            installedVersion: undefined // Clear installed version
          };
          this.updateAppInArray(updatedApp);
          this.saveToLocalStorage();
          observer.next();
          observer.complete();
        } else {
          observer.error(new Error('App not found'));
        }
      }, 400);
    });
  }

  /**
   * Update Application to Latest Version
   * 
   * Updates an installed application to the latest available version.
   * Only works for apps with status 'UpdateAvailable'.
   * 
   * Business Logic:
   * - Validates that the app has an update available
   * - Updates status from 'UpdateAvailable' to 'Installed'
   * - Updates installedVersion to match the current version
   * - Persists the change to localStorage
   * 
   * @param {string} id - The unique identifier of the app to update
   * @returns {Observable<App>} Observable that emits the updated app on success
   * @throws {Error} If the app is not found or update is not available
   * 
   * Usage:
   * ```typescript
   * this.appService.updateApp('1').subscribe({
   *   next: (app) => console.log('Updated to:', app.version),
   *   error: (err) => console.error('Update failed:', err)
   * });
   * ```
   */
  updateApp(id: string): Observable<void> {
    return new Observable(observer => {
      // Simulate update process delay (600ms - typically longer than install)
      setTimeout(() => {
        const app = this.apps().find(a => a.id === id);
        // Only allow updates for apps with UpdateAvailable status
        if (app && app.status === AppStatus.UpdateAvailable) {
          const updatedApp: App = {
            ...app,
            status: AppStatus.Installed,
            installedVersion: app.version // Update to latest version
          };
          this.updateAppInArray(updatedApp);
          this.saveToLocalStorage();
          observer.next();
          observer.complete();
        } else {
          observer.error(new Error('App update not available'));
        }
      }, 600);
    });
  }

  /**
   * Get Apps Signal (Read-Only)
   * 
   * Returns a read-only signal reference to the apps array.
   * This allows components to reactively track changes to the apps list
   * without being able to modify it directly.
   * 
   * Note: Currently not used in the implementation, but provided for
   * potential future reactive patterns using Angular effects.
   * 
   * @returns {ReadonlySignal<App[]>} Read-only signal reference to apps array
   */
  getAppsSignal() {
    return this.apps.asReadonly();
  }

  /**
   * Internal: Update App in Array
   * 
   * Private helper method that updates a specific app in the apps signal.
   * Uses immutable update pattern to ensure Angular change detection works correctly.
   * 
   * Implementation Details:
   * - Creates a new array instead of mutating the existing one
   * - Finds the app by ID and replaces it with the updated version
   * - Updates the signal with the new array reference
   * 
   * @private
   * @param {App} updatedApp - The app object with updated properties
   */
  private updateAppInArray(updatedApp: App): void {
    const currentApps = this.apps();
    const index = currentApps.findIndex(a => a.id === updatedApp.id);
    if (index !== -1) {
      // Immutable update: create new array with updated app
      // todo: change from shallow copy to deep copy
      const newApps = [...currentApps];
      newApps[index] = updatedApp;
      this.apps.set(newApps);
    }
  }

  /**
   * Internal: Persist to LocalStorage
   * 
   * Private helper method that saves the current app state to browser localStorage.
   * This simulates persistence across page refreshes.
   * 
   * Error Handling:
   * - Wraps in try-catch to handle localStorage quota exceeded errors
   * - Logs errors but doesn't throw to prevent breaking the app
   * 
   * @private
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('connectivity-toolbox-apps', JSON.stringify(this.apps()));
    } catch (e) {
      // localStorage might be full or disabled - log but don't break the app
      console.error('Failed to save apps to localStorage', e);
    }
  }
}

