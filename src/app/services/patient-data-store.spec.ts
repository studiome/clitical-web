import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PatientDataStore } from './patient-data-store';

describe('PatientDataStore', () => {
  let store: PatientDataStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PatientDataStore);
  });

  it('starts with default patient data and no risk', () => {
    expect(store.data().sex).toBe('female');
    expect(store.data().hasAILesion).toBe(true);
    expect(store.numbers()).toEqual({
      age: null,
      heightCm: null,
      weight: null,
      alb: null,
    });
    expect(store.risk()).toBeNull();
  });

  it('updates a single field', () => {
    store.setField('sex', 'male');
    store.setField('ckd', 'g4');
    expect(store.data().sex).toBe('male');
    expect(store.data().ckd).toBe('g4');
  });

  it('fails analysis when numeric inputs are missing', () => {
    const result = store.analyze();
    expect(result).toEqual({ ok: false, source: 'NumberForm' });
    expect(store.risk()).toBeNull();
  });

  it('fails analysis when no lesion is selected', () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4.0 });
    store.setField('hasAILesion', false);
    const result = store.analyze();
    expect(result).toEqual({ ok: false, source: 'LesionChoice' });
  });

  it('computes risk from entered values (height in cm)', () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4.0 });
    const result = store.analyze();
    expect(result).toEqual({ ok: true });
    const risk = store.risk();
    expect(risk).not.toBeNull();
    expect(risk!.gnri.toFixed(1)).toBe('101.3');
    expect(risk!.predictedOS.toFixed(2)).toBe('0.92');
  });

  it('reset clears answers and risk', () => {
    store.numbers.set({ age: 65, heightCm: 150, weight: 50, alb: 4.0 });
    store.setField('sex', 'male');
    store.analyze();
    store.reset();
    expect(store.data().sex).toBe('female');
    expect(store.numbers().age).toBeNull();
    expect(store.risk()).toBeNull();
  });
});
