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
 * requiring changes to the core application structure. New app types can be added
 * by simply adding new App objects with this structure.
 * 
 * @interface App
 * @property {string} id - Unique identifier for the app (required)
 * @property {string} name - Display name of the application (required)
 * @property {string} version - Current/latest version of the app (required)
 * @property {string} description - Human-readable description of what the app does (required)
 * @property {string} businessUnit - The team or department that owns/maintains this app (required)
 * @property {AppStatus} status - Current installation status of the app (required)
 * @property {string} [icon] - Optional URL or path to app icon/logo
 * @property {string} [author] - Optional name of the team or person who created the app
 * @property {string} [releaseDate] - Optional ISO date string when the app was released
 * @property {string} [installedVersion] - Optional version string of the currently installed version
 *                                        (only present when app is installed or has update available)
 */
export interface App {
  id: string;
  name: string;
  version: string;
  description: string;
  businessUnit: string;
  status: AppStatus;
  icon?: string;
  author?: string;
  releaseDate?: string;
  installedVersion?: string;
}


