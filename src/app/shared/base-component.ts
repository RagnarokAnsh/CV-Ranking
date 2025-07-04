import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Base component class that provides automatic subscription cleanup
 * Extend this class in components that use subscriptions to prevent memory leaks
 */
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}