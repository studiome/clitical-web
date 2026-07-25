import { computed, DOCUMENT, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AppLocale, MESSAGES, Messages } from './messages';

const LOCALE_STORAGE_KEY = 'clitical.locale';

@Service()
export class TranslationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);

  private readonly currentLocale = signal<AppLocale>(this.initialLocale());

  readonly locale = this.currentLocale.asReadonly();

  readonly t = computed<Messages>(() => MESSAGES[this.currentLocale()]);

  constructor() {
    // Not an effect(): the lang attribute must also be correct during SSR
    // (a single render pass, no reactivity) and deterministically in tests.
    this.syncDocumentLang();
  }

  setLocale(locale: AppLocale): void {
    this.currentLocale.set(locale);
    this.storage()?.setItem(LOCALE_STORAGE_KEY, locale);
    this.syncDocumentLang();
  }

  private syncDocumentLang(): void {
    this.document.documentElement.lang = this.currentLocale();
  }

  private initialLocale(): AppLocale {
    if (!this.isBrowser) return 'en';
    const stored = this.storage()?.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ja') return stored;
    return navigator.language.startsWith('ja') ? 'ja' : 'en';
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
