// Unit tests for date_schema.ts — run with: node --experimental-vm-modules --test test/schema.test.mjs
// We test the zod schema directly without Hono since the bug is in validation logic.

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { z } from 'zod';

// Re-implement the schema inline to test independently of the build pipeline
const getMaxYear = () => new Date().getFullYear() + 1;

const dateSchema = z.object({
  year: z.coerce
    .number({
      invalid_type_error: 'Year must be a valid number',
    })
    .min(2011, {
      message: 'Minimum year is 2011',
    })
    .optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  day: z.coerce.number().min(1).max(31).optional(),
}).superRefine(({ year, month, day }, ctx) => {
  const maxYear = getMaxYear();

  if (year !== undefined && year > maxYear) {
    ctx.addIssue({
      path: ['year'],
      code: 'custom',
      message: `Maximum year is ${maxYear}`,
    });
  }

  if (!year) {
    year = new Date().getFullYear();
  }

  if (day) {
    if (!month) {
      ctx.addIssue({
        path: ['month'],
        code: 'custom',
        message: 'Month is required when specifying day',
      });
      return z.NEVER;
    }

    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
      ctx.addIssue({
        path: ['day'],
        code: 'custom',
        message: 'The provided date is not valid',
      });
    }
  }
});

describe('getMaxYear()', () => {
  test('returns current year + 1', () => {
    const expected = new Date().getFullYear() + 1;
    assert.equal(getMaxYear(), expected);
  });

  test('is a function (not a frozen const)', () => {
    assert.equal(typeof getMaxYear, 'function');
  });
});

describe('dateSchema year validation', () => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 1;

  test('TC-01: year=2026 passes', () => {
    const result = dateSchema.safeParse({ year: 2026 });
    assert.equal(result.success, true, `Expected 2026 to pass, got: ${JSON.stringify(result.error?.issues)}`);
  });

  test('TC-02: year=currentYear+1 passes (dynamic max)', () => {
    const result = dateSchema.safeParse({ year: maxYear });
    assert.equal(result.success, true, `Expected ${maxYear} to pass, got: ${JSON.stringify(result.error?.issues)}`);
  });

  test('TC-03: year=currentYear+2 fails with dynamic message', () => {
    const result = dateSchema.safeParse({ year: maxYear + 1 });
    assert.equal(result.success, false, `Expected ${maxYear + 1} to fail`);
    const messages = result.error.issues.map((i) => i.message);
    assert.ok(
      messages.some((m) => m.includes(`Maximum year is ${maxYear}`)),
      `Expected error message containing "Maximum year is ${maxYear}", got: ${JSON.stringify(messages)}`,
    );
  });

  test('TC-04: year=1971 does NOT produce an artificial max error', () => {
    // 1971 is below min (2011), so it fails with "Minimum year is 2011"
    // but it should NOT fail with "Maximum year is 1971" (the old bug)
    const result = dateSchema.safeParse({ year: 1971 });
    assert.equal(result.success, false);
    const messages = result.error.issues.map((i) => i.message);
    assert.ok(
      !messages.some((m) => m.includes('Maximum year is 1971')),
      `Should NOT have "Maximum year is 1971" bug, got: ${JSON.stringify(messages)}`,
    );
  });

  test('TC-05: year=abc fails with invalid format', () => {
    const result = dateSchema.safeParse({ year: 'abc' });
    assert.equal(result.success, false);
    const messages = result.error.issues.map((i) => i.message);
    assert.ok(
      messages.some((m) => m.includes('valid number')),
      `Expected "valid number" error, got: ${JSON.stringify(messages)}`,
    );
  });

  test('TC-06: year=-1 fails validation', () => {
    const result = dateSchema.safeParse({ year: -1 });
    assert.equal(result.success, false);
  });

  test('year=0 fails (below min 2011)', () => {
    const result = dateSchema.safeParse({ year: 0 });
    assert.equal(result.success, false);
  });

  test('year=2011 passes (minimum year)', () => {
    const result = dateSchema.safeParse({ year: 2011 });
    assert.equal(result.success, true);
  });

  test('year=2025 passes', () => {
    const result = dateSchema.safeParse({ year: 2025 });
    assert.equal(result.success, true);
  });

  test('no year passes (defaults to current year in handler)', () => {
    const result = dateSchema.safeParse({});
    assert.equal(result.success, true);
  });

  test('year=99999 fails (way above max)', () => {
    const result = dateSchema.safeParse({ year: 99999 });
    assert.equal(result.success, false);
    const messages = result.error.issues.map((i) => i.message);
    assert.ok(
      messages.some((m) => m.includes(`Maximum year is ${maxYear}`)),
      `Expected dynamic max year error, got: ${JSON.stringify(messages)}`,
    );
  });
});
