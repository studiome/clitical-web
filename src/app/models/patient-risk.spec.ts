import { describe, expect, test } from 'vitest';

import { createPatientData, PatientData } from './patient-data';
import {
  calculatePatientRisk,
  GnriRisk,
  OsRisk,
  RiskCalculationError,
} from './patient-risk';

interface Want {
  gnri: string;
  gnriRisk: GnriRisk | null;
  predictedOS: string;
  predictedAFS: string;
  osRisk: OsRisk | null;
  predicted30DDorA: string;
  predicted30DMALE: string;
}

function expectRisk(pd: PatientData, want: Want): void {
  const pr = calculatePatientRisk(pd);
  expect(pr.gnri.toFixed(1)).toBe(want.gnri);
  expect(pr.gnriRisk).toBe(want.gnriRisk);
  expect(pr.predictedOS.toFixed(2)).toBe(want.predictedOS);
  expect(pr.predictedAFS.toFixed(2)).toBe(want.predictedAFS);
  expect(pr.osRisk).toBe(want.osRisk);
  expect(pr.predicted30DDeathOrAmputation.toFixed(3)).toBe(
    want.predicted30DDorA,
  );
  expect(pr.predicted30DMALE.toFixed(3)).toBe(want.predicted30DMALE);
}

describe('calculatePatientRisk', () => {
  test('null case: throws when numeric fields are missing', () => {
    expect(() => calculatePatientRisk(createPatientData())).toThrow(
      RiskCalculationError,
    );
    try {
      calculatePatientRisk(createPatientData());
    } catch (e) {
      expect((e as RiskCalculationError).source).toBe('NumberForm');
    }
  });

  test('lesion case: throws when no occlusive lesion is selected', () => {
    const pd: PatientData = {
      ...createPatientData(),
      age: 65,
      weight: 50.0,
      height: 1.5,
      alb: 4.0,
      hasAILesion: false,
      hasFPLesion: false,
      hasBKLesion: false,
    };
    try {
      calculatePatientRisk(pd);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RiskCalculationError);
      expect((e as RiskCalculationError).source).toBe('LesionChoice');
    }
  });

  test('normal case', () => {
    const pd: PatientData = {
      ...createPatientData(),
      age: 65,
      weight: 50.0,
      height: 1.5,
      alb: 4.0,
    };
    expectRisk(pd, {
      gnri: '101.3',
      gnriRisk: 'noRisk',
      predictedOS: '0.92',
      predictedAFS: '0.88',
      osRisk: 'low',
      predicted30DDorA: '0.013',
      predicted30DMALE: '0.032',
    });
  });

  test('error case: zero height yields NaN results', () => {
    const pd: PatientData = {
      ...createPatientData(),
      sex: 'male',
      age: 70,
      height: 0.0,
      weight: 50.0,
      alb: 3.0,
      activity: 'wheelchair',
    };
    expectRisk(pd, {
      gnri: 'NaN',
      gnriRisk: null,
      predictedOS: 'NaN',
      predictedAFS: 'NaN',
      osRisk: null,
      predicted30DDorA: 'NaN',
      predicted30DMALE: 'NaN',
    });
  });

  test('low risk case', () => {
    const pd: PatientData = {
      ...createPatientData(),
      sex: 'male',
      age: 50,
      height: 1.65,
      weight: 60.0,
      alb: 4.0,
      activity: 'ambulatory',
      hasCHF: false,
      hasCVD: true,
      ckd: 'g3',
      malignant: 'no',
      hasAILesion: false,
      hasFPLesion: true,
      hasBKLesion: false,
      isUrgent: true,
      hasFever: true,
      hasAbnormalWBC: true,
      hasLocalInfection: true,
      hasCAD: true,
      hasDyslipidemia: false,
      isSmoking: true,
      hasContraLateralLesion: false,
      hasOtherVD: true,
      rutherford: 'class4',
    };
    expectRisk(pd, {
      gnri: '101.3',
      gnriRisk: 'noRisk',
      predictedOS: '0.91',
      predictedAFS: '0.64',
      osRisk: 'low',
      predicted30DDorA: '0.088',
      predicted30DMALE: '0.152',
    });
  });

  test('medium risk case', () => {
    const pd: PatientData = {
      ...createPatientData(),
      sex: 'female',
      age: 70,
      height: 1.53,
      weight: 55.0,
      alb: 3.5,
      activity: 'wheelchair',
      hasCHF: true,
      hasCVD: true,
      ckd: 'g4',
      malignant: 'pastHistory',
      hasAILesion: false,
      hasFPLesion: true,
      hasBKLesion: true,
      isUrgent: true,
      hasFever: true,
      hasAbnormalWBC: true,
      hasLocalInfection: true,
      hasCAD: false,
      hasDyslipidemia: true,
      isSmoking: false,
      hasContraLateralLesion: true,
      hasOtherVD: false,
      rutherford: 'class5',
    };
    expectRisk(pd, {
      gnri: '93.8',
      gnriRisk: 'low',
      predictedOS: '0.67',
      predictedAFS: '0.25',
      osRisk: 'medium',
      predicted30DDorA: '0.170',
      predicted30DMALE: '0.175',
    });
  });

  test('high risk case', () => {
    const pd: PatientData = {
      ...createPatientData(),
      sex: 'male',
      age: 85,
      height: 1.75,
      weight: 55.1,
      alb: 3.5,
      activity: 'immobile',
      hasCHF: false,
      hasCVD: false,
      ckd: 'g5',
      malignant: 'underTreatment',
      hasAILesion: false,
      hasFPLesion: false,
      hasBKLesion: true,
      isUrgent: true,
      hasFever: false,
      hasAbnormalWBC: true,
      hasLocalInfection: false,
      hasCAD: true,
      hasDyslipidemia: true,
      isSmoking: true,
      hasContraLateralLesion: true,
      hasOtherVD: false,
      rutherford: 'class5',
    };
    expectRisk(pd, {
      gnri: '86.2',
      gnriRisk: 'moderate',
      predictedOS: '0.08',
      predictedAFS: '0.03',
      osRisk: 'high',
      predicted30DDorA: '0.100',
      predicted30DMALE: '0.043',
    });
  });

  test('high risk case 2', () => {
    const pd: PatientData = {
      ...createPatientData(),
      sex: 'female',
      age: 90,
      height: 1.55,
      weight: 30.0,
      alb: 3.2,
      activity: 'immobile',
      hasCHF: true,
      hasCVD: true,
      ckd: 'g5D',
      malignant: 'underTreatment',
      hasAILesion: false,
      hasFPLesion: false,
      hasBKLesion: true,
      isUrgent: true,
      hasFever: true,
      hasAbnormalWBC: true,
      hasLocalInfection: true,
      hasCAD: true,
      hasDyslipidemia: true,
      isSmoking: true,
      hasContraLateralLesion: false,
      hasOtherVD: true,
      rutherford: 'class6',
    };
    expectRisk(pd, {
      gnri: '71.3',
      gnriRisk: 'major',
      predictedOS: '0.00',
      predictedAFS: '0.00',
      osRisk: 'high',
      predicted30DDorA: '0.370',
      predicted30DMALE: '0.122',
    });
  });
});
