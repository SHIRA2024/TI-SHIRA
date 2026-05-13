import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
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
    return this.http.get<any[]>(`${this.apiBaseUrl}/fetch-data`).pipe(
      map(backendApps => {
        return backendApps.map(backendApp => {
          const extractedVersions = backendApp.versions ? Object.keys(backendApp.versions) : [];
          const sortedVersions = extractedVersions.reverse();

          let mappedStatus = AppStatus.Available; 
          if (backendApp.status === 'installed' || backendApp.status === 'up to date') {
            mappedStatus = AppStatus.Installed;
          } else if (backendApp.status === 'update available') {
            mappedStatus = AppStatus.UpdateAvailable;
          }
          else
          {
            mappedStatus = AppStatus.Available; // Explicitly catch 'not installed'
          }

          return {
            ...backendApp,
            versionOrder: sortedVersions,
            version: sortedVersions.length > 0 ? sortedVersions[0] : '',
            status: mappedStatus
          } as App;
        });
      }),
      tap((apps: App[]) => {
        this.apps.set(apps);
        console.log('Mapped apps ready for UI:', apps);
      })
    );
  }

  /**
   * Internal: Refresh Apps From Backend
   */
  private refreshApps(): void {
    // Fix: Subscribe to getApps() instead of raw http.get 
    // to ensure the mapping logic runs on refreshed data
    this.getApps().subscribe({
      error: (error: unknown) => console.error('Failed to refresh apps', error)
    });
  }

  /**
   * Get Application by ID
   */
  getAppById(id: string): Observable<App | undefined> {
    return this.getApps().pipe(
      map((apps) => apps.find((app) => app.id === id))
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

