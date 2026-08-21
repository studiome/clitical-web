import { describe, expect, it } from 'vitest';

import { calculateBatchRows } from './batch-calculation';

const VALID_ROW = {
  caseId: 'CASE-0001',
  sex: 'female',
  age: 65,
  heightCm: 150,
  weight: 50,
  alb: 4,
  activity: 'ambulatory',
  hasCHF: false,
  hasCVD: false,
  ckd: 'normal',
  malignant: 'no',
  hasAILesion: true,
  hasFPLesion: false,
  hasBKLesion: false,
  isUrgent: false,
  hasFever: false,
  hasAbnormalWBC: false,
  hasLocalInfection: false,
  hasDyslipidemia: false,
  isSmoking: false,
  hasCAD: false,
  hasContraLateralLesion: false,
  hasOtherVD: false,
  rutherford: 'class4',
};

describe('calculateBatchRows', () => {
  it('calculates a valid row with the same risk model as the single-patient flow', () => {
    const [result] = calculateBatchRows([VALID_ROW]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.caseId).toBe('CASE-0001');
    expect(result.risk.gnri.toFixed(1)).toBe('101.3');
    expect(result.risk.predictedOS.toFixed(2)).toBe('0.92');
  });

  it('reports row errors without preventing valid rows from being calculated', () => {
    const results = calculateBatchRows([
      VALID_ROW,
      { ...VALID_ROW, caseId: 'CASE-0002', heightCm: 0 },
    ]);

    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
    if (results[1].ok) return;
    expect(results[1].errors).toContainEqual(
      expect.objectContaining({ field: 'heightCm', code: 'OUT_OF_RANGE' }),
    );
  });

  it('accepts common Excel boolean values and assigns a missing ID from its row', () => {
    const [result] = calculateBatchRows([
      {
        ...VALID_ROW,
        caseId: '',
        hasCHF: 'yes',
        hasCVD: 'なし',
        hasAILesion: 1,
        hasFPLesion: 0,
      },
    ]);

    expect(result.caseId).toBe('CASE-0001');
    expect(result.ok).toBe(true);
  });

  it('rejects unknown categorical values and a row without any lesion', () => {
    const [result] = calculateBatchRows([
      {
        ...VALID_ROW,
        sex: 'unknown',
        hasAILesion: false,
        hasFPLesion: false,
        hasBKLesion: false,
      },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['INVALID_CHOICE', 'LESION_REQUIRED']),
    );
  });
});
