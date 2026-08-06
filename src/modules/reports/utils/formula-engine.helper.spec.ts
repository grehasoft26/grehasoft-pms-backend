import { evaluateFormula } from './formula-engine.helper';
import { BadRequestException } from '@nestjs/common';

describe('FormulaEngineHelper', () => {
  it('should evaluate simple math addition and subtraction', () => {
    const res = evaluateFormula('10 + 5 - 2', {});
    expect(res).toBe(13);
  });

  it('should evaluate operator precedence multiplication and division', () => {
    const res = evaluateFormula('2 + 3 * 4 / 2', {});
    expect(res).toBe(8);
  });

  it('should handle parentheses correctly', () => {
    const res = evaluateFormula('(2 + 3) * 4', {});
    expect(res).toBe(20);
  });

  it('should replace context variables correctly', () => {
    const variables = { REVENUE: 1000, EXPENSES: 400 };
    const res = evaluateFormula('((REVENUE - EXPENSES) / REVENUE) * 100', variables);
    expect(res).toBe(60);
  });

  it('should fallback missing variables to 0', () => {
    const res = evaluateFormula('REVENUE + 5', {});
    expect(res).toBe(5);
  });

  it('should handle division by zero safely by returning 0', () => {
    const res = evaluateFormula('10 / 0', {});
    expect(res).toBe(0);
  });

  it('should throw BadRequestException on mismatched parentheses', () => {
    expect(() => evaluateFormula('(10 + 5', {})).toThrow(BadRequestException);
  });
});
