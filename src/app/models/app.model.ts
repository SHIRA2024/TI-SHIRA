/**
 * App Status Enumeration
 * 
 * Defines the possible states an application can be in within the Connectivity Toolbox.
 * This enum ensures type safety and consistency across the application when checking app status.
 * 
 * @enum {string}
 * @property {string} Available - App is available for installation but not yet installed
 * @property {string} Installed - App is currently installed and up-to-date
 * @property {string} UpdateAvailable - App is installed but a newer version is available
 */
export enum AppStatus {
  Available = 'available',
  Installed = 'installed',
  UpdateAvailable = 'update-available'
}

/**
 * App Interface
 * 
 * Represents the metadata structure for an application in the Connectivity Toolbox.
 * This interface defines the contract for app data throughout the application.
 * 
 * The design is intentionally generic to support any type of internal tool without
 * requiring changes to the core application structure.
 * 
 * @interface App
 * @property {string} id - Unique identifier for the app (required)
 * @property {string} name - Display name of the application (required)
 * @property {string} description - Human-readable description of what the app does (required)
 * @property {string} version - Current/latest version of the app (required)
 * @property {AppStatus} status - Current installation status of the app (required)
 * @property {string} [installedVersion] - Optional version string of the currently installed version
 * @property {string} [icon] - Optional URL or path to app icon/logo
 * 
 * @property {string[]} versionOrder - Ordered list of versions (latest first, up to 30 versions)
 * 
 * @property {Object.<string, string[]>} versions - Mapping between version and supported OS
 * Example:

 */
export interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  versionOrder: string[];
  versions: string[] | null;
  status: AppStatus;
  installedVersion?: string;
  iconPath?: string | null;
}

