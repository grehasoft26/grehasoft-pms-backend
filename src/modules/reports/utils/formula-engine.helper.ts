import { BadRequestException } from '@nestjs/common';

export function evaluateFormula(formula: string, variables: Record<string, number>): number {
  if (!formula) return 0;

  // Tokenize: numbers, variables (A-Z, underscores), operators (+, -, *, /), and parentheses
  const tokens = formula.match(/[A-Z_]+|[0-9]+(?:\.[0-9]+)?|[\+\-\*\/\(\)]/g) || [];

  const outputQueue: string[] = [];
  const operatorStack: string[] = [];
  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  for (const token of tokens) {
    if (/^[A-Z_]+$/.test(token)) {
      // Variable replacement from context dictionary
      const val = variables[token] !== undefined ? variables[token] : 0;
      outputQueue.push(val.toString());
    } else if (/^[0-9]+(?:\.[0-9]+)?$/.test(token)) {
      // Numeric value
      outputQueue.push(token);
    } else if (token in precedence) {
      // Math Operator
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '('
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) {
        throw new BadRequestException(`Mismatched parentheses in formula: ${formula}`);
      }
      operatorStack.pop(); // Pop '('
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op === '(' || op === ')') {
      throw new BadRequestException(`Mismatched parentheses in formula: ${formula}`);
    }
    outputQueue.push(op);
  }

  // Evaluate postfix stack
  const stack: number[] = [];
  for (const token of outputQueue) {
    if (token === '+' || token === '-' || token === '*' || token === '/') {
      const b = stack.pop() ?? 0;
      const a = stack.pop() ?? 0;
      let result = 0;

      if (token === '+') result = a + b;
      else if (token === '-') result = a - b;
      else if (token === '*') result = a * b;
      else if (token === '/') result = b !== 0 ? a / b : 0;

      stack.push(result);
    } else {
      stack.push(parseFloat(token));
    }
  }

  return stack[0] ?? 0;
}
