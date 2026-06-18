import { Injectable, signal, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WSMessage } from '../models/app.model';

@Injectable({
  providedIn: 'root'
})
export class NetworkService implements OnDestroy {
  messages$ = new Subject<WSMessage>();
  connectionStatus = signal<'connected' | 'disconnected'>('disconnected');

  private ws$: WebSocketSubject<WSMessage> | null = null;
  private wsSubscription: Subscription | null = null;
  // private pollingSubscription: Subscription | null = null;
  private readonly wsUrl = 'ws://localhost:5100/ws';
  // private readonly apiBaseUrl = 'http://localhost:5000/api';

  constructor() {}

  connect(): void {
    this.disconnect();

    try {
      this.ws$ = webSocket<WSMessage>({
        url: this.wsUrl,
        deserializer: msg => JSON.parse(msg.data) as WSMessage,
        serializer: msg => JSON.stringify(msg),
        openObserver: {
          next: () => {
            console.log('WebSocket connected');
            this.connectionStatus.set('connected');
          }
        },
        closeObserver: {
          next: () => {
            console.log('WebSocket disconnected');
            this.connectionStatus.set('disconnected');
          }
        }
      });

      this.wsSubscription = this.ws$.subscribe({
        next: (msg) => this.messages$.next(msg),
        error: (err) => {
          console.error('WebSocket error', err);
          this.connectionStatus.set('disconnected');
        }
      });
    } catch (e) {
      console.warn('WebSocket connection failed', e);
      this.connectionStatus.set('disconnected');
    }
  }

  disconnect(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    if (this.ws$) {
      this.ws$.complete();
      this.ws$ = null;
    }
    // this.stopPolling();
  }

  send(msg: WSMessage): void {
    if (this.ws$) {
      this.ws$.next(msg);
    }
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
    this.disconnect();
    this.messages$.complete();
  }
}
