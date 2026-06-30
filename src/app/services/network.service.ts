import { Injectable, signal, OnDestroy, NgZone } from '@angular/core';
import { Subject, Subscription,Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WSMessage } from '../models/app.model';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class NetworkService implements OnDestroy {
  private socket!: Socket;
  private readonly SERVER_URL = 'http://localhost:5000';
  private connectSubject = new Subject<void>();
  constructor(private zone:NgZone) {
    this.connect()
  }

  private connect(namespace:string = "app-running-status"): void {
    this.socket = io(`${this.SERVER_URL}/${namespace}`, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      //transports: ['websocket'] // WebSocket first, fallback to polling
      transports: ['websocket', 'polling'] // WebSocket first, fallback to polling
    });

    // Lifecycle logging
    this.socket.on('connect', () => {
      console.log('Connected to Server through Socket.io !! id:', this.socket.id);
      this.connectSubject.next();
    });
    this.socket.on('disconnect', (reason) => console.warn('Disconnected from server socket: ', reason));
  }

  public onEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(eventName, (data: T) => {
        observer.next(data);
      });

      // Cleanup logic when subscription is torn down
      return () => {
        this.socket.off(eventName);
      };
    });
  }

  public emitEvent(eventName: string, payload: any): void {
    this.socket.emit(eventName, payload);
  }
  public onConnect(): Observable<void> {
    return this.connectSubject.asObservable();
  }

  public get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // startPolling(): void {
  //   if (this.pollingSubscription) return;
  //   console.log('Starting HTTP polling for app status');
  //   this.pollingSubscription = timer(5000, 5000).pipe(
  //     switchMap(() => this.http.get<{ appId: string; type: 'app-running' | 'app-stopped' }[]>(
  //       `${this.apiBaseUrl}/running-apps`
  //     ).pipe(
  //       catchError(() => of([]))
  //     ))
  //   ).subscribe({
  //     next: (apps) => {
  //       apps.forEach(app => {
  //         this.messages$.next({ type: app.type, appId: app.appId });
  //       });
  //     }
  //   });
  // }

  // private stopPolling(): void {
  //   if (this.pollingSubscription) {
  //     this.pollingSubscription.unsubscribe();
  //     this.pollingSubscription = null;
  //   }
  // }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
