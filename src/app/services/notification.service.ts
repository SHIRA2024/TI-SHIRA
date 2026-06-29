import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  message: string;
  type: 'error' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  currentToast = signal<ToastMessage | null>(null);

  showError(message: string) {
    this.currentToast.set({ message, type: 'error' });
    
    // Automatically hide the popup after 4 seconds
    setTimeout(() => {
      this.currentToast.set(null);
    }, 4000);
  }

  clearToast() {
    this.currentToast.set(null);
  }
}