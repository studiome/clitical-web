import { TestBed } from '@angular/core/testing';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IntendedUseService } from './intended-use';

@Component({ template: '' })
class ServiceHost {
  readonly service = inject(IntendedUseService);
}

function createStorageMock(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('IntendedUseService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts unacknowledged when the version is missing', () => {
    const service = TestBed.inject(IntendedUseService);
    expect(service.isAcknowledged()).toBe(false);
    expect(service.currentVersion).toBe('2026-08');
  });

  it('persists acknowledgement with a web-namespaced key', () => {
    const storage = createStorageMock();
    vi.stubGlobal('localStorage', storage);
    const service = TestBed.inject(IntendedUseService);

    service.acknowledge();

    expect(service.isAcknowledged()).toBe(true);
    expect(storage.getItem('clitical.web.intended-use-disclaimer-version')).toBe('2026-08');
  });

  it('recognises only the current notice version after the first browser render', async () => {
    vi.stubGlobal(
      'localStorage',
      createStorageMock({
        'clitical.web.intended-use-disclaimer-version': '2026-08',
      }),
    );
    const fixture = TestBed.createComponent(ServiceHost);
    await fixture.whenStable();
    expect(fixture.componentInstance.service.isAcknowledged()).toBe(true);
  });

  it('does not accept an acknowledgement of older wording', async () => {
    vi.stubGlobal(
      'localStorage',
      createStorageMock({
        'clitical.web.intended-use-disclaimer-version': '2026-07',
      }),
    );
    const fixture = TestBed.createComponent(ServiceHost);
    await fixture.whenStable();
    expect(fixture.componentInstance.service.isAcknowledged()).toBe(false);
  });

  it('stays safely unacknowledged when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    const service = TestBed.inject(IntendedUseService);
    expect(service.isAcknowledged()).toBe(false);
    expect(() => service.acknowledge()).not.toThrow();
  });

  it('never reads browser storage during server rendering', () => {
    const getItem = vi.fn();
    vi.stubGlobal('localStorage', { ...createStorageMock(), getItem });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(IntendedUseService);

    expect(service.isAcknowledged()).toBe(false);
    expect(getItem).not.toHaveBeenCalled();
  });
});
