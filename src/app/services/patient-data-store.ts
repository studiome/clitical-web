import { Service, signal } from '@angular/core';

import { createPatientData, PatientData } from '../models/patient-data';
import {
  calculatePatientRisk,
  PatientRisk,
  RiskCalculationError,
  RiskErrorSource,
} from '../models/patient-risk';

export interface NumericAnswers {
  age: number | null;
  heightCm: number | null;
  weight: number | null;
  alb: number | null;
}

export type AnalysisResult =
  | { ok: true }
  | { ok: false; source: RiskErrorSource | 'Unknown' };

function createNumericAnswers(): NumericAnswers {
  return { age: null, heightCm: null, weight: null, alb: null };
}

@Service()
export class PatientDataStore {
  // numeric entries are kept apart so a Signal Form can bind to them;
  // the height is entered in cm and converted to m on analysis
  readonly numbers = signal<NumericAnswers>(createNumericAnswers());

  private readonly selections = signal<PatientData>(createPatientData());
  readonly data = this.selections.asReadonly();

  private readonly currentRisk = signal<PatientRisk | null>(null);
  readonly risk = this.currentRisk.asReadonly();

  setField<K extends keyof PatientData>(key: K, value: PatientData[K]): void {
    this.selections.update((data) => ({ ...data, [key]: value }));
  }

  analyze(): AnalysisResult {
    const { age, heightCm, weight, alb } = this.numbers();
    const data: PatientData = {
      ...this.selections(),
      age,
      height: heightCm === null ? null : heightCm / 100.0,
      weight,
      alb,
    };
    try {
      this.currentRisk.set(calculatePatientRisk(data));
      return { ok: true };
    } catch (e) {
      if (e instanceof RiskCalculationError) {
        return { ok: false, source: e.source };
      }
      return { ok: false, source: 'Unknown' };
    }
  }

  reset(): void {
    this.numbers.set(createNumericAnswers());
    this.selections.set(createPatientData());
    this.currentRisk.set(null);
  }
}
