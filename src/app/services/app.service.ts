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
     * Converts version string to comparable number parts.
     * Example: V10.1.1 -> [10, 1, 1]
     */
    private parseVersion(version: string): number[] {
      return version
        .replace(/^v/i, '')
        .split('.')
        .map(part => Number(part));
    }

    /**
     * Sort versions from newest to oldest.
     */
    private sortVersionsNewestFirst(versions: string[]): string[] {
      return versions.sort((a, b) => {
        const aParts = this.parseVersion(a);
        const bParts = this.parseVersion(b);

        const maxLength = Math.max(aParts.length, bParts.length);

        for (let i = 0; i < maxLength; i++) {
          const aValue = aParts[i] ?? 0;
          const bValue = bParts[i] ?? 0;

          if (aValue !== bValue) {
            return bValue - aValue;
          }
        }

        return 0;
      });
    }

  /**
   * Get All Applications with Status Mapping
   */
  /**
 * Get All Applications with Status Mapping
 */
getApps(): Observable<App[]> {
  return this.http.get<Record<string, any>>(`${this.apiBaseUrl}/fetch-data`).pipe(
    map((backendAppsObject) => {
      const backendApps = Object.entries(backendAppsObject).map(([id, backendApp]) => {
        const extractedVersions = Array.isArray(backendApp.versions)
          ? backendApp.versions
          : backendApp.versions
            ? Object.keys(backendApp.versions)
            : [];

        const sortedVersions = this.sortVersionsNewestFirst(extractedVersions);

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
          id: backendApp.id ?? id,
          versionOrder: sortedVersions,
          version: sortedVersions.length > 0 ? sortedVersions[0] : '',
          status: mappedStatus
        } as App;
      });

      return backendApps;
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
  getAppById(id: string): Observable<App> {
    return this.reloadApp(id);
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

scheduleBackendShutdown(): void {
  const shutdownUrl = `${this.apiBaseUrl}/shutdown/schedule`;

  const sent = navigator.sendBeacon(shutdownUrl);

  if (!sent) {
    fetch(shutdownUrl, {
      method: 'POST',
      keepalive: true,
      mode: 'no-cors'
    }).catch((error) => {
      console.error('Failed to schedule backend shutdown', error);
    });
  }
}

cancelBackendShutdown(): Observable<void> {
  return this.http.post<void>(`${this.apiBaseUrl}/shutdown/cancel`, {});
}

shutdownBackendNow(): Observable<void> {
  return this.http.post<void>(`${this.apiBaseUrl}/shutdown`, {});
}

reloadApp(id: string): Observable<App> {
  return this.http.get<any>(`${this.apiBaseUrl}/fetch-data/${id}`).pipe(
    map((backendApp) => {
      const extractedVersions = Array.isArray(backendApp.versions)
        ? backendApp.versions
        : backendApp.versions
          ? Object.keys(backendApp.versions)
          : [];

      const sortedVersions = this.sortVersionsNewestFirst(extractedVersions);

      let mappedStatus = AppStatus.Available;

      if (backendApp.status === 'installed' || backendApp.status === 'up to date') {
        mappedStatus = AppStatus.Installed;
      } else if (backendApp.status === 'update available') {
        mappedStatus = AppStatus.UpdateAvailable;
      }

      return {
        ...backendApp,
        id: String(backendApp.id ?? id),
        versionOrder: sortedVersions,
        version: sortedVersions.length > 0 ? sortedVersions[0] : '',
        status: mappedStatus
      } as App;
    }),
    tap((updatedApp: App) => {
      const currentApps = this.apps();
      const existingIndex = currentApps.findIndex(app => String(app.id) === String(updatedApp.id));

      if (existingIndex >= 0) {
        const updatedApps = [...currentApps];
        updatedApps[existingIndex] = updatedApp;
        this.apps.set(updatedApps);
      }
    })
  );
}

}

