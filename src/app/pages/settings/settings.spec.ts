import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_VERSION } from '../../app-version';
import { TranslationService } from '../../services/translation';
import { Settings } from './settings';

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('Settings', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    TestBed.configureTestingModule({
      imports: [Settings],
      providers: [provideNoopAnimations()],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders language, about section and terms link', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent!;
    expect(text).toContain('Language');
    expect(text).toContain('About');
    expect(text).toContain('日本語');
    expect(text).toContain('English');

    const terms = host.querySelector<HTMLAnchorElement>('a.terms-link');
    expect(terms?.getAttribute('href')).toBe('https://studiome.github.io/clti_risk/');
    expect(terms?.getAttribute('target')).toBe('_blank');
    expect(terms?.getAttribute('rel')).toContain('noopener');
  });

  it('checks the radio for the current locale', async () => {
    TestBed.inject(TranslationService).setLocale('en');
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const checked = host.querySelector<HTMLInputElement>(
      'input[type="radio"]:checked',
    );
    expect(checked?.value).toBe('en');
  });

  it('switches the app locale when another language is chosen', async () => {
    const translation = TestBed.inject(TranslationService);
    translation.setLocale('en');
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const ja = host.querySelector<HTMLInputElement>(
      'input[type="radio"][value="ja"]',
    )!;
    ja.click();
    await fixture.whenStable();
    expect(translation.locale()).toBe('ja');
  });

  it('shows the app version and legalese', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain(APP_VERSION);
    expect(text).toContain('JSVS');
  });
});
