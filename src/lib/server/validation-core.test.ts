import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate, isValidStay, isValidVisitDate } from './validation-core';

describe('booking date validation', () => {
  it('accepts real ISO dates and rejects impossible calendar dates', () => {
    assert.equal(isValidDate('2028-02-29'), true);
    assert.equal(isValidDate('2027-02-29'), false);
    assert.equal(isValidDate('2027-13-01'), false);
    assert.equal(isValidDate('01/02/2027'), false);
  });

  it('requires checkout to be later than check-in', () => {
    assert.equal(isValidStay('2027-01-05', '2027-01-06'), true);
    assert.equal(isValidStay('2027-01-05', '2027-01-05'), false);
    assert.equal(isValidStay('2027-01-06', '2027-01-05'), false);
  });

  it('rejects past visit dates using the hotel timezone', () => {
    assert.equal(isValidVisitDate('2000-01-01'), false);
    assert.equal(isValidVisitDate('invalid'), false);
  });
});
