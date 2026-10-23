import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate, isValidStay, isValidVisitDate } from './validation-core';
import { hasConfiguredPaymentHosts, isApprovedPaymentUrl } from './payment-url';

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

describe('PMS payment URL validation', () => {
  it('accepts HTTPS only for exact PMS-confirmed hosts', () => {
    assert.equal(isApprovedPaymentUrl('https://payments.example/checkout/abc', 'payments.example'), true);
    assert.equal(isApprovedPaymentUrl('https://evil-payments.example/checkout/abc', 'payments.example'), false);
    assert.equal(isApprovedPaymentUrl('http://payments.example/checkout/abc', 'payments.example'), false);
    assert.equal(isApprovedPaymentUrl('https://user@payments.example/checkout/abc', 'payments.example'), false);
    assert.equal(isApprovedPaymentUrl('https://payments.example:8443/checkout/abc', 'payments.example'), false);
  });

  it('fails closed when the PMS host list is missing or malformed', () => {
    assert.equal(isApprovedPaymentUrl('https://payments.example/checkout/abc', ''), false);
    assert.equal(isApprovedPaymentUrl('https://payments.example/checkout/abc', '*.example'), false);
    assert.equal(isApprovedPaymentUrl('https://payments.example/checkout/abc', 'https://payments.example'), false);
    assert.equal(hasConfiguredPaymentHosts(''), false);
    assert.equal(hasConfiguredPaymentHosts('payments.example,other.example'), true);
    assert.equal(hasConfiguredPaymentHosts('payments.example,'), false);
  });
});
