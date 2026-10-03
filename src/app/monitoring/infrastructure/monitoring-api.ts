import { Injectable } from '@angular/core';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import { Alert } from '../domain/model/alert.entity';
import { AuditLog, CartEvent } from '../domain/model/cart-event.entity';
import { Cart } from '../domain/model/cart.entity';
import { ShoppingSession } from '../domain/model/shopping-session.entity';
import { SessionStat, Store } from '../domain/model/store.entity';

@Injectable({ providedIn: 'root' })
export class CartsApi extends BaseApiService<Cart> {
  protected readonly resource = 'carts';
}

@Injectable({ providedIn: 'root' })
export class ShoppingSessionsApi extends BaseApiService<ShoppingSession> {
  protected readonly resource = 'shopping-sessions';
}

@Injectable({ providedIn: 'root' })
export class AlertsApi extends BaseApiService<Alert> {
  protected readonly resource = 'alerts';
}

@Injectable({ providedIn: 'root' })
export class CartEventsApi extends BaseApiService<CartEvent> {
  protected readonly resource = 'cart-events';
}

@Injectable({ providedIn: 'root' })
export class AuditLogsApi extends BaseApiService<AuditLog> {
  protected readonly resource = 'audit-logs';
}

@Injectable({ providedIn: 'root' })
export class StoresApi extends BaseApiService<Store> {
  protected readonly resource = 'stores';
}

@Injectable({ providedIn: 'root' })
export class SessionStatsApi extends BaseApiService<SessionStat> {
  protected readonly resource = 'session-stats';
}
