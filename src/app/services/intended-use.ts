import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/** Versioned acknowledgement for the intended-use notice shown on first launch. */
@Injectable({ providedIn: 'root' })
export class IntendedUseService {
  static readonly storageKey = 'clitical.web.intended-use-disclaimer-version';
  static readonly currentVersion = '2026-08';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  // Always start in the safe state. Reading localStorage during construction
  // would make the browser's first render differ from SSR HTML and can break
  // hydration. The browser value is applied after the first render instead.
  private readonly acknowledged = signal(false);

  readonly isAcknowledged = this.acknowledged.asReadonly();
  readonly currentVersion = IntendedUseService.currentVersion;

  constructor() {
    if (this.isBrowser) {
      afterNextRender(() => this.acknowledged.set(this.readAcknowledgement()));
    }
  }

  acknowledge(): void {
    this.acknowledged.set(true);
    this.storage()?.setItem(IntendedUseService.storageKey, IntendedUseService.currentVersion);
  }

  private readAcknowledgement(): boolean {
    if (!this.isBrowser) return false;
    return (
      this.storage()?.getItem(IntendedUseService.storageKey) === IntendedUseService.currentVersion
    );
  }

  private storage(): Storage | null {
    if (!this.isBrowser) return null;
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
