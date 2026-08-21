import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TranslationService } from './translation';

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

describe('TranslationService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('defaults to English when no preference is stored', () => {
    const service = TestBed.inject(TranslationService);
    expect(service.locale()).toBe('en');
    expect(service.t().questionSexTitle).toBe('Sex');
  });

  it('defaults to Japanese when the browser language is Japanese', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('ja-JP');

    const service = TestBed.inject(TranslationService);

    expect(service.locale()).toBe('ja');
    expect(document.documentElement.lang).toBe('ja');
  });

  it('defaults to English when the browser language is not Japanese', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR');

    const service = TestBed.inject(TranslationService);

    expect(service.locale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches messages when locale changes', () => {
    const service = TestBed.inject(TranslationService);
    service.setLocale('ja');
    expect(service.locale()).toBe('ja');
    expect(service.t().questionSexTitle).toBe('性別');
    expect(service.t().predictRisks).toBe('リスク予測');
  });

  it('persists the selected locale', () => {
    const service = TestBed.inject(TranslationService);
    service.setLocale('ja');
    expect(localStorage.getItem('clitical.locale')).toBe('ja');
  });

  it('restores a stored locale on creation', () => {
    localStorage.setItem('clitical.locale', 'ja');
    const service = TestBed.inject(TranslationService);
    expect(service.locale()).toBe('ja');
  });

  it('provides both catalogs with identical keys', () => {
    const service = TestBed.inject(TranslationService);
    const enKeys = Object.keys(service.t()).sort();
    service.setLocale('ja');
    const jaKeys = Object.keys(service.t()).sort();
    expect(jaKeys).toEqual(enKeys);
  });

  it('sets the document lang attribute on creation', () => {
    TestBed.inject(TranslationService);
    expect(document.documentElement.lang).toBe('en');
  });

  it('updates the document lang attribute when the locale changes', () => {
    const service = TestBed.inject(TranslationService);
    service.setLocale('ja');
    expect(document.documentElement.lang).toBe('ja');
  });
});
