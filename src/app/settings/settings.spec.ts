import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TranslationService } from '../services/translation';
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
      providers: [provideNoopAnimations(), provideRouter([])],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders language and about sections with English legal links', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent!;
    expect(text).toContain('Language');
    expect(text).toContain('About');
    expect(text).toContain('日本語');
    expect(text).toContain('English');

    const links = [
      ...host.querySelectorAll<HTMLAnchorElement>('a.legal-link'),
    ];
    expect(links.map((link) => link.querySelector('span')?.textContent)).toEqual([
      'Terms of Service',
      'Privacy Policy',
      'Support',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://studiome.github.io/clitical-legal/terms/en/',
      'https://studiome.github.io/clitical-legal/privacy/en/',
      'https://studiome.github.io/clitical-legal/support/en/',
    ]);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
    expect(host.querySelector('.language-group a')).toBeNull();
  });

  it('uses Japanese legal links when the locale is Japanese', async () => {
    const translation = TestBed.inject(TranslationService);
    translation.setLocale('ja');
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const links = [...host.querySelectorAll<HTMLAnchorElement>('a.legal-link')];

    expect(links.map((link) => link.querySelector('span')?.textContent)).toEqual([
      '利用規約',
      'プライバシーポリシー',
      'サポート',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://studiome.github.io/clitical-legal/terms/ja/',
      'https://studiome.github.io/clitical-legal/privacy/ja/',
      'https://studiome.github.io/clitical-legal/support/ja/',
    ]);
  });

  it('renders official mobile app store badges with the supplied links', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const links = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        'a.store-badge-link',
      ),
    ];

    expect(links.map((link) => link.href)).toEqual([
      'https://apps.apple.com/app/id1660733252',
      'https://play.google.com/store/apps/details?id=org.studiomexx.clitical_android',
    ]);
    expect(links.map((link) => link.querySelector('img')?.alt)).toEqual([
      'Download CLiTICAL on the App Store',
      'Get CLiTICAL on Google Play',
    ]);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });

  it('places the mobile app download links at the bottom of the settings page', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const sections = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('section'),
    ];

    expect(sections.at(-1)?.getAttribute('aria-labelledby')).toBe('mobile-app-heading');
  });

  it('localizes the mobile app store badge labels in Japanese', async () => {
    TestBed.inject(TranslationService).setLocale('ja');
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const badges = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLImageElement>(
        'img.store-badge',
      ),
    ];

    expect(badges.map((badge) => badge.alt)).toEqual([
      'App StoreからCLiTICALをダウンロード',
      'Google PlayでCLiTICALを手に入れよう',
    ]);
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
    expect(text).toContain('2.1.1');
    expect(text).toContain('JSVS');
  });

  it('links the app information row to the detailed About screen', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a.about',
    );
    expect(link?.getAttribute('href')).toBe('/settings/about');
  });
});
