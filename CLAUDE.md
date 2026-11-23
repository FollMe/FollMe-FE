# FollMe

FollMe is Sum's engineering blog: notes on payments and e-wallets in Vietnam (`/fintech`), a blog and stories. The wedding tools (`/cuoi-hoi`, invitations, `/fortune`) still work but live in a small corner of the menu.

## Writing rules (fintech pages, blog copy, UI text)

These also apply to anything written to Sum's Notion.

- **Do not translate technical terms into Vietnamese.** Keep them in English: source of truth, ledger, position, settlement, reconciliation, liquidity, safeguarding account, hold, release, debit, credit, refund, payout, cash-in, callback, event, inquiry, retry, backoff, timeout, deadline, idempotent, dedup, compensation, orchestrator, state machine, scenario, limit… Write "partner là source of truth cho units", not "nguồn sự thật".
- **Write like a person, not a spec.** Short sentences, plain Vietnamese around the English terms, "mình" for the author. Say why, not only what. Avoid stacks of bold, colon chains, "Đây là…" openers and lists where a sentence would do.
- Real system, partner and bank names from Sum's job stay out. Pages describe the general pattern.

## Code

- Content for a flow lives in `src/fintech/<flow>.js`; the sequence player, money map and state machine draw from it. `src/util/stateMachine.test.js` checks scenarios and steps against the transitions.
- Design tokens are in `src/index.css` (keep `src/theme.js` in sync). Guest-facing invitation cards use `--font-elegant`.
- Check with `CI=true npm run build` and `CI=true npx react-scripts test --watchAll=false`.
