import { ACTIONS, INITIAL, health, liabilities, runAction } from './safeguarding';

it('moving money between holders leaves liabilities and cash alone', () => {
  const s = runAction(INITIAL, 'deposit');
  expect(liabilities(s)).toBe(liabilities(INITIAL));
  expect(s.cash).toBe(INITIAL.cash);
  expect(health(s)).toBe('ok');
});

it('a clean payout moves liabilities and cash together', () => {
  const s = runAction(runAction(INITIAL, 'deposit'), 'payout');
  expect(s.cash - liabilities(s)).toBeCloseTo(INITIAL.cash - liabilities(INITIAL));
  expect(health(s)).toBe('ok');
});

it('a pocket debit without the bank leg is flagged even though cash covers it', () => {
  const s = runAction(runAction(INITIAL, 'deposit'), 'brokenPayout');
  expect(s.cash).toBeGreaterThan(liabilities(s));
  expect(health(s)).toBe('drift');
});

it('covering a partner from safeguarding breaks the rule once the buffer is gone', () => {
  expect(health(runAction(INITIAL, 'front'))).toBe('breach');
});

it('a top-up posts to the bank before the ledger', () => {
  expect(ACTIONS.topup.phases.map(p => p.layer)).toEqual(['bank', 'ledger']);
});
