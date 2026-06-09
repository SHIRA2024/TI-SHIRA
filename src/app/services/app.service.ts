import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of, catchError, timer, Subscription, switchMap} from 'rxjs';
import { App, AppStatus } from '../models/app.model';
import { NotificationService } from './notification.service';

/**
 * App Service
 * 
 */
@Injectable({
  providedIn: 'root'
})
export class AppService {
  /**
   * Backend base URL
   */
  private readonly apiBaseUrl = 'http://localhost:5000/api';
  private apps = signal<App[]>([]);

  // Stores a list of all currently running apps
  runningApps = signal<{id: string, name: string}[]>([]);

  // Helper function to check if a specific app ID is currently running
  isAppRunning(id: string): boolean {
    return this.runningApps().some(app => app.id === id);
  }

  private statusSubscription: Subscription | null = null; // The subscription reference for the status polling observable

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  /**
   * Get All Applications with Status Mapping
   */
  getApps(): Observable<App[]> {
    // Fetch the raw JSON object from Python
    return this.http.get<any>(`${this.apiBaseUrl}/fetch-data`).pipe(
      map(backendData => {
        
        // Convert the Python dictionary { "1": {...} } into a standard array [{...}]
        const backendAppsArray = Object.values(backendData);

        // Loop through the array and map each item to match the Angular App interface
        return backendAppsArray.map((backendApp: any) => {
          
          // 🚀 THE FIX: Directly use the array sent by the backend, or default to an empty array if null
          const sortedVersions = backendApp.versions || [];

          // Translate Python status strings into Angular AppStatus Enums
          let mappedStatus = AppStatus.Available; 
          if (backendApp.status === 'installed' || backendApp.status === 'up to date') {
            mappedStatus = AppStatus.Installed;
          } else if (backendApp.status === 'update available') {
            mappedStatus = AppStatus.UpdateAvailable;
          } else {
            mappedStatus = AppStatus.Available; 
          }

          // Construct and return the final App object
          return {
            ...backendApp,
            id: String(backendApp.id),
            versionOrder: sortedVersions,
            version: sortedVersions.length > 0 ? sortedVersions[0] : '',
            status: mappedStatus,
            iconPath: backendApp.iconPath ? `${this.apiBaseUrl.replace('/api', '')}/api/icons/${backendApp.id}/${backendApp.iconPath}` : null          } as App;
        });
      }),
      tap((apps: App[]) => {
        // Save the perfectly mapped array into the global cache
        this.apps.set(apps);
        console.log('Mapped apps ready for UI:', apps);
      })
    );
  }

    // Adds an app to the running list when launched
  addRunningApp(id: string, name: string) {
    // Check if it already exists to prevent duplicates
    if (!this.isAppRunning(id)) {
      this.runningApps.update(apps => [...apps, { id, name }]);
    }
  }

  // Removes an app from the running list when closed
  removeRunningApp(id: string) {
    this.runningApps.update(apps => apps.filter(app => app.id !== id));
  }
  /**
   * Get Application by ID (Network First, Fallback to Cache)
   */
  getAppById(id: string): Observable<App> {
    
    return this.http.get<any>(`${this.apiBaseUrl}/fetch-data/${id}`).pipe(
      map(backendApp => {
        
        // Directly use the array sent by the backend, or default to an empty array if null
        const sortedVersions = backendApp.versions || [];

        let mappedStatus = AppStatus.Available; 
        if (backendApp.status === 'installed' || backendApp.status === 'up to date') {
          mappedStatus = AppStatus.Installed;
        } else if (backendApp.status === 'update available') {
          mappedStatus = AppStatus.UpdateAvailable;
        } else {
          mappedStatus = AppStatus.Available;
        }

        return {
          ...backendApp,
          id: String(backendApp.id),
          versionOrder: sortedVersions,
          version: sortedVersions.length > 0 ? sortedVersions[0] : '',
          status: mappedStatus,
          iconPath: backendApp.iconPath ? `${this.apiBaseUrl.replace('/api', '')}/api/icons/${backendApp.id}/${backendApp.iconPath}` : null
        } as App;
      }),
      tap((mappedApp: App) => {
        // Update our local cache with this fresh data behind the scenes
        const currentApps = this.apps();
        const existingIndex = currentApps.findIndex(a => String(a.id) === String(id));
        
        if (existingIndex >= 0) {
          const newApps = [...currentApps];
          newApps[existingIndex] = mappedApp;
          this.apps.set(newApps);
        } else {
          this.apps.set([...currentApps, mappedApp]);
        }
      }),
      catchError((error) => {
        // NETWORK FAILED! (Server offline, bad connection, etc.)
        console.warn(`Network fetch failed for app ${id}. Attempting to use local cache...`);
        
        // Look inside our local signal memory (from the marketplace fetch)
        const cachedApp = this.apps().find(a => String(a.id) === String(id));
        
        if (cachedApp) {
          console.log(`Successfully recovered App ${id} from cache!`);
          // Return the cached data so the UI doesn't break
          return of(cachedApp);
        }
        
        // FATAL ERROR: It's not on the server, and it's not in the cache.
        console.error(`App ${id} is completely missing.`);
        throw error;
      })
    );
  }

  /**
   * Refresh Apps From Backend
   */
  private refreshApps(): void {
    this.getApps().subscribe({
      error: (error: unknown) => console.error('Failed to refresh apps', error)
    });
  }


  installApp(id: string): Observable<void> {
    const app = this.apps().find((a) => a.id === id);

    if (!app) {
      throw new Error('App not found');
    }

    return this.installAppVersion(id, app.version, '');
  }

  installAppVersion(id: string, targetVersion: string, targetOS: string): Observable<void> {
    return this.http.get<void>(
      `${this.apiBaseUrl}/install-app/${id}/${targetVersion}`,
      {}
    ).pipe(
      tap(() => this.refreshApps())
    );
  }

  openApp(id: string): Observable<void> {
    // Turn ON the running indicator
    this.addRunningApp(id, this.apps().find(a => String(a.id) === String(id))?.name || '');

    return this.http.get<void>(`${this.apiBaseUrl}/run-app/${id}`).pipe(
      tap(() => {
        //  Once the app successfully starts, begin polling the server!
        this.startMonitoringProcess(id);
      }),
      catchError((error) => {
        // Turn OFF the running indicator if it fails, and show error
        this.removeRunningApp(id);
        this.notificationService.showError('Error: Could not run the application.');
        throw error;
      })
    );
  }

  // This polls the Python server every 2 seconds
  private startMonitoringProcess(id: string) {
    // Clear any old monitors just in case
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }

    // Ping the server every 2000 milliseconds (2 seconds)
    this.statusSubscription = timer(0, 2000).pipe(
      // Asking Python: "Is it still running?" (Expecting the "running" key from your controller)
      switchMap(() => this.http.get<{success: boolean, message: string, running: boolean}>(`${this.apiBaseUrl}/run-status/${id}`))
    ).subscribe({
      next: (response) => {
        if (!response.running) {
          // The app was closed on the computer! Hide the running man immediately.
          this.removeRunningApp(id);
          this.statusSubscription?.unsubscribe();
        }
      },
      error: () => {
        // If the server disconnects, turn off the UI indicator
        this.removeRunningApp(id);
        this.statusSubscription?.unsubscribe();
      }
    });
  }

  // Add this helper function right below startMonitoringProcess
  stopRunning() {
    this.runningApps.set([]);
    // Stop the polling timer if we manually close the UI window
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
  
  uninstallApp(id: string): Observable<void> {
    return this.http.get<void>(
      `${this.apiBaseUrl}/uninstall-app/${id}`,
      {}
    ).pipe(
      tap(() => this.refreshApps())
    );
  }


  updateApp(id: string): Observable<void> {
    const app = this.apps().find((a) => a.id === id);

    if (!app) {
      throw new Error('App not found');
    }

    return this.updateAppToVersion(id, app.version, '');
  }


  updateAppToVersion(id: string, targetVersion: string, targetOS: string): Observable<void> {
    return this.http.get<void>(
      `${this.apiBaseUrl}/update-app/${id}/${targetVersion}`,
      {}
    ).pipe(
      tap(() => this.refreshApps())
    );
  }

  /**
   * Get Apps Signal (Read-Only)
   * 
   * Returns a read-only signal reference to the apps array.
   */
  getAppsSignal() {
    return this.apps.asReadonly();
  }

}

