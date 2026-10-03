import { Observable, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Emits `source()` now and again every polling interval, so the console stays live. */
export function poll<T>(source: () => Observable<T>, intervalMs = environment.pollingIntervalMs): Observable<T> {
  return timer(0, intervalMs).pipe(switchMap(source));
}
