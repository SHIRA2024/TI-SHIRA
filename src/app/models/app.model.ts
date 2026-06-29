/** Possible states an application can be in */
export enum AppStatus {
  UpToDate = 'up to date',
  NotInstalled = 'not installed',
  UpdateAvailable = 'update available'
}

/** Metadata structure for an application */
export interface App {
  id: string;
  name: string;
  description: string;
  latestVersion: string;
  versions: string[] | null;
  status: AppStatus;
  installedVersion: string|null;
  iconUrl: string|null;
}

export type WSMessage={
  type: 'launch' | 'app-running' | 'app-stopped' | 'stop';
  appId: string;
}|{type:'status'}|{type:"running-apps",appIds:string[]}



