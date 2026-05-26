import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of, catchError } from 'rxjs';
import { App, AppStatus } from '../models/app.model';

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

  constructor(private http: HttpClient) {}

  /**
   * Get All Applications with Status Mapping
   */
  getApps(): Observable<App[]> {
    // Fetch the raw JSON object from Python
    return this.http.get<any>(`${this.apiBaseUrl}/fetch-data`).pipe(
      map(backendData => {
        
        // Convert the Python dictionary { "1": {...} } into a standard array [{...}]
        const backendAppsArray = Object.values(backendData);

        //  Loop through the array and map each item to match the Angular App interface
        return backendAppsArray.map((backendApp: any) => {
          
          // handle 'null' versions from the lightweight marketplace fetch
          const extractedVersions = backendApp.versions ? Object.keys(backendApp.versions) : [];
          const sortedVersions = extractedVersions.reverse();

          // Translate Python status strings into Angular AppStatus Enums
          let mappedStatus = AppStatus.Available; 
          if (backendApp.status === 'installed' || backendApp.status === 'up to date') {
            mappedStatus = AppStatus.Installed;
          } else if (backendApp.status === 'update available') {
            mappedStatus = AppStatus.UpdateAvailable;
          } else {
            mappedStatus = AppStatus.Available; 
          }

          //  Construct and return the final App object
          return {
            ...backendApp,
            id: String(backendApp.id),
            versionOrder: sortedVersions,
            version: sortedVersions.length > 0 ? sortedVersions[0] : '',
            status: mappedStatus
          } as App;
        });
      }),
      tap((apps: App[]) => {
        // Save the perfectly mapped array into the global cache
        this.apps.set(apps);
        console.log('Mapped apps ready for UI:', apps);
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

  /**
   * Get Application by ID (Network First, Fallback to Cache)
   */
  getAppById(id: string): Observable<App> {
    
    return this.http.get<any>(`${this.apiBaseUrl}/fetch-data/${id}`).pipe(
      map(backendApp => {
        // Map the raw Python data into our Angular App model
        const extractedVersions = backendApp.versions ? Object.keys(backendApp.versions) : [];
        const sortedVersions = extractedVersions.reverse();

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
          status: mappedStatus
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
    return this.http.get<void>(`${this.apiBaseUrl}/run-app/${id}`);
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

