import { FLOWS } from 'fintech/savingsFund';
import { BILLPAY_FLOWS } from 'fintech/billpay';
import { canTransition, layoutFlow, nextStates, nodesOverlap, sampleEdge, validateFlow } from './stateMachine';

describe.each([...Object.values(FLOWS), ...Object.values(BILLPAY_FLOWS)])('$key flow', flow => {
  it('agrees with itself: scenarios and steps only take allowed moves', () => {
    expect(validateFlow(flow)).toEqual([]);
  });

  it('lays out nodes without overlaps', () => {
    const { nodes } = layoutFlow(flow);
    const list = Object.values(nodes);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        expect([list[i].id, list[j].id, nodesOverlap(list[i], list[j])]).toEqual([list[i].id, list[j].id, false]);
      }
    }
  });

  it('routes no edge through a state it does not touch', () => {
    const { nodes, edges } = layoutFlow(flow);
    const crossings = [];
    edges.forEach(e => {
      Object.values(nodes)
        .filter(n => n.id !== e.from && n.id !== e.to)
        .forEach(n => {
          const hit = sampleEdge(e).some(([x, y]) => Math.abs(x - n.x) < n.w / 2 + 2 && Math.abs(y - n.y) < n.h / 2 + 2);
          if (hit) crossings.push(`${e.id} crosses ${n.id}`);
        });
    });
    expect(crossings).toEqual([]);
  });

  it('draws one path per transition', () => {
    const { edges } = layoutFlow(flow);
    expect(edges).toHaveLength(flow.transitions.length);
    edges.forEach(e => expect(e.d).toMatch(/^M [\d.-]+ [\d.-]+ Q /));
  });

  it('starts the sequence at the initial state and ends it in success', () => {
    expect(flow.steps[0].state).toBe(flow.initial ?? 'ORDER_RECEIVED');
    expect(flow.steps[flow.steps.length - 1].state).toBe(flow.success ?? 'COMPLETED');
  });
});

describe('the rules the notes insist on', () => {
  const { deposit, withdraw } = FLOWS;

  it('deposit: a partner rejection only releases the hold', () => {
    expect(canTransition(deposit, 'WALLET_HELD', 'FAILED')).toBe(true);
  });

  it('deposit: after the cash left, a partner ERROR is a dispute, never a refund', () => {
    expect(nextStates(deposit, 'PAYOUT_SUCCEEDED').sort()).toEqual(['COMPLETED', 'DISPUTED']);
    expect(canTransition(deposit, 'PAYOUT_SUCCEEDED', 'REFUND_REQUESTED')).toBe(false);
  });

  it('deposit: refund only after the partner acked the cancel', () => {
    expect(canTransition(deposit, 'PAYOUT_FAILED', 'REFUND_REQUESTED')).toBe(false);
    expect(canTransition(deposit, 'PARTNER_CANCELLED', 'REFUND_REQUESTED')).toBe(true);
  });

  it('withdraw: the user is credited only from a bank-confirmed pocket', () => {
    const intoCompleted = withdraw.transitions.filter(([, b]) => b === 'COMPLETED').map(([a]) => a);
    expect(intoCompleted).toEqual(['POCKET_CREDITED']);
    expect(canTransition(withdraw, 'PARTNER_SENT', 'COMPLETED')).toBe(false);
  });

  it('withdraw: partner "failed" after "sent" is not a move', () => {
    expect(canTransition(withdraw, 'PARTNER_SENT', 'PARTNER_FAILED')).toBe(false);
  });

  it('billpay: the partner is called only after Core confirmed the payment', () => {
    Object.values(BILLPAY_FLOWS).forEach(flow => {
      const into = flow.transitions.filter(([, b]) => b === 'partner_processing').map(([a]) => a);
      expect(into).toEqual(['pending_payment']);
      expect(flow.transitions.filter(([, b]) => b === 'success').map(([a]) => a)).toEqual(['partner_processing']);
    });
  });

  it('billpay: money moves only after the user confirmed at the payment screen', () => {
    Object.values(BILLPAY_FLOWS).forEach(flow => {
      const first = flow.steps.findIndex(s => s.moneyMoves);
      expect(flow.steps[first]).toMatchObject({ from: 'app', to: 'core' });
    });
  });

  it('flags a scenario that skips a step', () => {
    const broken = { ...deposit, scenarios: [{ id: 'x', path: [['ORDER_RECEIVED'], ['WALLET_DEBITED'], ['COMPLETED']] }] };
    expect(validateFlow(broken)).toEqual(expect.arrayContaining([
      'scenario x: ORDER_RECEIVED → WALLET_DEBITED is not a transition',
    ]));
  });
});
