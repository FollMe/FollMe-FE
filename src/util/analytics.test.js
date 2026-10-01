import { track } from './analytics';

it('queues events on window.va and never throws', () => {
  const calls = [];
  window.va = (...args) => calls.push(args);
  track('rsvp_submitted', { status: 'attending' });
  track('compat_checked');
  expect(calls).toEqual([
    ['event', { name: 'rsvp_submitted', data: { status: 'attending' } }],
    ['event', { name: 'compat_checked' }],
  ]);
  window.va = () => { throw new Error('boom'); };
  expect(() => track('x')).not.toThrow();
  delete window.va;
  expect(() => track('x')).not.toThrow();
});
