/**
 * Helpers over a flow definition (see fintech/savingsFund.js): which moves are
 * allowed, a check that the data agrees with itself, and the geometry used to
 * draw the state machine.
 */

export function stateById(flow, id) {
  return flow.states.find(s => s.id === id);
}

export function canTransition(flow, from, to) {
  return flow.transitions.some(([a, b]) => a === from && b === to);
}

export function nextStates(flow, id) {
  return flow.transitions.filter(([a]) => a === id).map(([, b]) => b);
}

/**
 * Every problem in a flow definition, as readable strings (empty = all good).
 * Catches a scenario or a sequence step that takes a move the state machine
 * does not allow, a state without an owner or a deadline action, and a
 * terminal state with a way out.
 */
export function validateFlow(flow) {
  const errors = [];
  const ids = new Set(flow.states.map(s => s.id));

  if (ids.size !== flow.states.length) {
    errors.push('duplicate state id');
  }

  flow.transitions.forEach(([a, b]) => {
    if (!ids.has(a)) errors.push(`transition from unknown state ${a}`);
    if (!ids.has(b)) errors.push(`transition to unknown state ${b}`);
  });

  flow.states.forEach(s => {
    const out = nextStates(flow, s.id);
    if (s.terminal) {
      if (out.length) errors.push(`terminal ${s.id} has outgoing transitions`);
    } else {
      if (!out.length) errors.push(`${s.id} is not terminal but has no way out`);
      if (!s.actor) errors.push(`${s.id} has no next actor`);
      if (!s.deadline) errors.push(`${s.id} has no deadline action`);
    }
  });

  const walk = (label, path) => {
    for (let i = 1; i < path.length; i++) {
      const [a, b] = [path[i - 1], path[i]];
      if (a !== b && !canTransition(flow, a, b)) {
        errors.push(`${label}: ${a} → ${b} is not a transition`);
      }
    }
  };

  flow.scenarios.forEach(sc => {
    const path = sc.path.map(([id]) => id);
    if (path[0] !== 'ORDER_RECEIVED') errors.push(`scenario ${sc.id} does not start at ORDER_RECEIVED`);
    if (!stateById(flow, path[path.length - 1])?.terminal) errors.push(`scenario ${sc.id} does not end in a terminal state`);
    walk(`scenario ${sc.id}`, path);
  });

  const stepStates = flow.steps.map(s => s.state);
  stepStates.forEach(id => {
    if (!ids.has(id)) errors.push(`step uses unknown state ${id}`);
  });
  walk('sequence', stepStates);

  const participants = new Set(flow.participants.map(p => p.id));
  flow.steps.forEach((s, i) => {
    if (!participants.has(s.from) || !participants.has(s.to)) {
      errors.push(`step ${i + 1} uses an unknown participant`);
    }
  });

  return errors;
}

/** The point where a line leaving the centre of a box crosses its border. */
function clipToBox(cx, cy, hw, hh, towardX, towardY, gap = 4) {
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (!dx && !dy) {
    return [cx, cy];
  }
  const t = Math.min(dx ? (hw + gap) / Math.abs(dx) : Infinity, dy ? (hh + gap) / Math.abs(dy) : Infinity);
  return [cx + dx * t, cy + dy * t];
}

const round = n => Math.round(n * 10) / 10;

/**
 * Positions of the nodes (from each state's col/row) and an SVG path per
 * transition: a quadratic curve bent sideways by the transition's optional
 * 4th value, clipped to the node borders.
 */
export function layoutFlow(flow, { nodeW = 196, nodeH = 44, colGap = 280, rowGap = 78, pad = 24 } = {}) {
  const cols = flow.states.map(s => s.col);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const maxRow = Math.max(...flow.states.map(s => s.row));

  const nodes = {};
  flow.states.forEach(s => {
    nodes[s.id] = {
      ...s,
      x: pad + nodeW / 2 + (s.col - minCol) * colGap,
      y: pad + nodeH / 2 + s.row * rowGap,
      w: nodeW,
      h: nodeH,
    };
  });

  const edges = flow.transitions.map(([from, to, label, bend = 0]) => {
    const a = nodes[from];
    const b = nodes[to];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    // Unit normal to the straight line from a to b
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const c = [mx + nx * bend, my + ny * bend];
    const s = clipToBox(a.x, a.y, a.w / 2, a.h / 2, c[0], c[1]);
    const e = clipToBox(b.x, b.y, b.w / 2, b.h / 2, c[0], c[1], 7);
    const labelAt = [
      0.25 * s[0] + 0.5 * c[0] + 0.25 * e[0],
      0.25 * s[1] + 0.5 * c[1] + 0.25 * e[1],
    ];
    return {
      id: `${from}->${to}`,
      from,
      to,
      label,
      d: `M ${round(s[0])} ${round(s[1])} Q ${round(c[0])} ${round(c[1])} ${round(e[0])} ${round(e[1])}`,
      labelAt: labelAt.map(round),
    };
  });

  return {
    nodes,
    edges,
    width: pad * 2 + nodeW + (maxCol - minCol) * colGap,
    height: pad * 2 + nodeH + maxRow * rowGap,
  };
}

/** Do two laid-out nodes overlap (with a little breathing room)? */
export function nodesOverlap(a, b, margin = 8) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + margin && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + margin;
}

/** Points along a laid-out edge ("M x y Q cx cy ex ey"). */
export function sampleEdge(edge, count = 24) {
  const [sx, sy, cx, cy, ex, ey] = edge.d.match(/-?[\d.]+/g).map(Number);
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const u = 1 - t;
    return [u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey];
  });
}
