import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import {
  IoAdd, IoChevronForward, IoDownloadOutline, IoListOutline, IoLockClosedOutline, IoPencil,
} from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import { eventHeadline, invitationApi } from 'util/invitation';
import { formatVnd, giftSummary, parseAmount, shortVnd } from 'util/gifts';
import {
  BUDGET_TABS, EXPENSE_CATEGORIES, MAX_EXPENSES, MAX_EXPENSE_LABEL, MAX_EXPENSE_NOTE, balanceText, budgetRows,
  budgetSummary, categoryOf, expenseStatus, starterExpenses,
} from 'util/budget';
import { downloadCsv } from 'util/csv';
import { vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './Budget.module.scss';

/** "150.000.000 đ" that never breaks before the đ. */
const money = amount => formatVnd(amount).replace(' ', '\u00a0');

/** "500.000" for an amount field, '' for none. */
const amountField = amount => (amount ? formatVnd(amount).replace(' đ', '') : '');

/** An amount typed by the host: "150tr", "5.000.000". `text` empty is none (null). */
function useAmount(initial) {
  const [text, setText] = useState(amountField(initial));
  const amount = parseAmount(text);
  const unreadable = text.trim() !== '' && amount === null;
  return { text, setText, amount, unreadable };
}

function AmountField({ label, field, placeholder, helper, autoFocus }) {
  return (
    <TextField
      fullWidth
      autoFocus={autoFocus}
      label={label}
      placeholder={placeholder}
      value={field.text}
      error={field.unreadable}
      autoComplete="off"
      inputProps={{ inputMode: 'text', enterKeyHint: 'done' }}
      onChange={e => field.setText(e.target.value)}
      helperText={field.unreadable ? 'Chưa hiểu số tiền, thử 150tr hoặc 5.000.000' : field.amount ? `= ${formatVnd(field.amount)}` : helper}
      FormHelperTextProps={{ className: clsx(field.amount && styles.parsed) }}
    />
  );
}

/** Writes a line of the budget, new (`expense` null) or existing. */
function ExpenseDialog({ expense, onClose, onSave, onRemove }) {
  const [category, setCategory] = useState(expense?.category ?? 'venue');
  const [label, setLabel] = useState(expense?.label ?? '');
  const [note, setNote] = useState(expense?.note ?? '');
  const amount = useAmount(expense?.amount);
  const paid = useAmount(expense?.paid);
  const [isSaving, setIsSaving] = useState(false);
  const canSave = label.trim() && !amount.unreadable && !paid.unreadable;
  const placeholder = starterExpenses('wedding').find(s => s.category === category)?.label ?? 'Khoản chi';

  async function save(e) {
    e.preventDefault();
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        label: label.trim(),
        category,
        // null clears what was there; a new line just leaves them out
        amount: amount.amount ?? (expense ? null : undefined),
        paid: paid.amount ?? (expense ? null : undefined),
        note: note.trim() || (expense ? null : undefined),
      });
    } catch (err) {
      setIsSaving(false);
    }
  }

  async function remove() {
    setIsSaving(true);
    try {
      await onRemove();
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs" disableRestoreFocus>
      <form onSubmit={save}>
        <DialogTitle>{expense ? 'Sửa khoản chi' : 'Thêm khoản chi'}</DialogTitle>
        <DialogContent sx={{ pt: '4px !important', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TextField
            select
            fullWidth
            label="Nhóm chi"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {EXPENSE_CATEGORIES.map(c => (
              <MenuItem key={c.value} value={c.value}>
                <span className={styles.option} aria-hidden>{c.emoji}</span> {c.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            autoFocus={!expense}
            label="Khoản chi"
            placeholder={`VD: ${placeholder}`}
            value={label}
            inputProps={{ maxLength: MAX_EXPENSE_LABEL }}
            onChange={e => setLabel(e.target.value)}
          />
          <AmountField
            label="Chi phí"
            field={amount}
            placeholder="VD: 150tr"
            helper="Để trống nếu chưa chốt giá"
            autoFocus={Boolean(expense) && !expense.amount}
          />
          <div>
            <AmountField label="Đã trả" field={paid} placeholder="VD: 30tr (tiền cọc)" helper="Tiền cọc hoặc số đã trả" />
            <div className={styles.quick} role="group" aria-label="Chọn nhanh số đã trả">
              <button type="button" aria-pressed={!paid.amount} className={clsx(!paid.amount && styles.on)} onClick={() => paid.setText('')}>
                Chưa trả
              </button>
              {amount.amount > 0 && (
                <button
                  type="button"
                  aria-pressed={paid.amount === amount.amount}
                  className={clsx(paid.amount === amount.amount && styles.on)}
                  onClick={() => paid.setText(amountField(amount.amount))}
                >
                  Trả đủ
                </button>
              )}
            </div>
          </div>
          <TextField
            fullWidth
            label="Ghi chú"
            placeholder="Hạn trả, số điện thoại bên dịch vụ..."
            value={note}
            inputProps={{ maxLength: MAX_EXPENSE_NOTE }}
            onChange={e => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {expense && (
            <Button color="error" onClick={remove} disabled={isSaving} sx={{ mr: 'auto' }}>Xoá</Button>
          )}
          <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={!canSave}>Lưu</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/** The planned total for the whole event; empty removes it. */
function BudgetDialog({ budget, onClose, onSave }) {
  const field = useAmount(budget);
  const [isSaving, setIsSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (field.unreadable) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(field.amount ?? null);
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs" disableRestoreFocus>
      <form onSubmit={save}>
        <DialogTitle>Ngân sách dự kiến</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <AmountField label="Tổng ngân sách" field={field} placeholder="VD: 300tr" helper="Để trống để bỏ ngân sách" autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={field.unreadable}>Lưu</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

const STATUS_TEXT = {
  paid: () => 'Đã trả đủ',
  deposit: e => `Đã trả ${shortVnd(e.paid)}`,
  unpaid: () => 'Chưa trả',
  unpriced: () => 'Chưa có giá',
};

/**
 * Thu chi: what the host spends on the event, what is paid and what is
 * still owed, next to what the gift ledger says came in. Only the host
 * sees it.
 */
export default function Budget() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tab, setTab] = useState('all');
  // The line being written: an expense, or {} for a new one
  const [editing, setEditing] = useState(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Thu chi · ${invitation.title}` });
        setEvent(invitation);
      })
      .catch(() => navigate('/events'));
  }, [eventId, navigate]);

  const expenses = useMemo(() => event?.expenses ?? [], [event]);
  const gifts = useMemo(() => giftSummary(event?.guests ?? []), [event]);
  const summary = useMemo(
    () => budgetSummary(expenses, { gifts: gifts.total, budget: event?.budget }),
    [expenses, gifts, event],
  );
  const shown = useMemo(() => expenses.filter(BUDGET_TABS.find(([k]) => k === tab)[2]), [expenses, tab]);
  const setExpenses = update => setEvent(e => ({ ...e, expenses: update(e.expenses ?? []) }));

  async function add(values) {
    const saved = await invitationApi.addExpense(eventId, values);
    setExpenses(list => [...list, saved]);
    track('expense_added', { category: values.category, priced: Boolean(values.amount) });
    toast.success(`Đã thêm ${saved.label}`);
    setEditing(null);
  }

  async function update(expense, values) {
    const saved = await invitationApi.updateExpense(eventId, expense._id, values);
    setExpenses(list => list.map(e => (e._id === saved._id ? saved : e)));
    toast.success(`Đã lưu ${saved.label}`);
    setEditing(null);
  }

  async function remove(expense) {
    await invitationApi.removeExpense(eventId, expense._id);
    setExpenses(list => list.filter(e => e._id !== expense._id));
    toast.success(`Đã xoá ${expense.label}`);
    setEditing(null);
  }

  async function saveBudget(budget) {
    await invitationApi.update(eventId, { budget });
    setEvent(e => ({ ...e, budget }));
    setIsEditingBudget(false);
  }

  /** Adds the usual expenses of this kind of event, without prices, in order. */
  async function start() {
    const list = starterExpenses(event.type);
    setStarting({ done: 0, total: list.length });
    const added = [];
    for (const [i, item] of list.entries()) {
      try {
        added.push(await invitationApi.addExpense(eventId, item));
      } catch (err) {
        break;
      }
      setStarting({ done: i + 1, total: list.length });
    }
    setExpenses(current => [...current, ...added]);
    setStarting(null);
    track('budget_started', { added: added.length });
    if (added.length) {
      toast.success(`Đã thêm ${added.length} khoản. Bấm vào từng khoản để ghi giá.`);
    }
  }

  if (!event) {
    return <OvalLoading />;
  }

  const paidShare = summary.total ? Math.min(summary.paid / summary.total, 1) : 0;
  const priced = summary.categories.filter(c => c.total > 0);
  const maxCategory = Math.max(...priced.map(c => c.total), 1);
  return (
    <div className={`container page ${styles.page}`}>
      <ArticleHeader back={{ to: `/events/${eventId}`, label: event.title }} eyebrow="Thu chi" title={eventHeadline(event)} />

      <section className={styles.hero} aria-label="Tổng chi phí">
        <span>Tổng chi phí</span>
        <strong>{formatVnd(summary.total)}</strong>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Đã trả"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(paidShare * 100)}
        >
          <i style={{ width: `${paidShare * 100}%` }} />
        </div>
        <p>
          Đã trả <b>{formatVnd(summary.paid)}</b> · Còn phải trả <b>{formatVnd(summary.owed)}</b>
          {summary.unpriced > 0 && ` · ${summary.unpriced} khoản chưa có giá`}
        </p>
      </section>

      <div className={styles.cards}>
        <Link to={`/events/${eventId}/so-mung`} className={styles.card}>
          <span>Tiền mừng</span>
          <strong>{money(gifts.total)}</strong>
          <small>{gifts.count > 0 ? `${gifts.count} người mừng` : 'Ghi ở Sổ mừng'} <IoChevronForward aria-hidden /></small>
        </Link>
        <button type="button" className={styles.card} onClick={() => setIsEditingBudget(true)}>
          <span>Ngân sách</span>
          <strong>{summary.budget ? money(summary.budget) : 'Chưa đặt'}</strong>
          <small>
            {summary.budget ? `Đã dùng ${Math.round(summary.budgetUsed * 100)}%` : 'Đặt ngân sách'} <IoPencil aria-hidden />
          </small>
        </button>
      </div>
      {summary.budget > 0 && summary.total > summary.budget && (
        <p className={clsx(styles.balance, styles.short)}>Chi phí đã vượt ngân sách {formatVnd(summary.total - summary.budget)}.</p>
      )}
      {balanceText(summary, formatVnd) && (
        <p className={clsx(styles.balance, summary.gifts > 0 && (summary.balance >= 0 ? styles.even : styles.short))}>
          {balanceText(summary, formatVnd)}
        </p>
      )}

      {priced.length > 1 && (
        <section className={styles.breakdown} aria-labelledby="by-category">
          <h2 id="by-category">Theo nhóm</h2>
          <ul>
            {priced.map(c => (
              <li key={c.category}>
                <span className={styles.what}><span aria-hidden>{categoryOf(c.category).emoji}</span> {categoryOf(c.category).label}</span>
                <span className={styles.track} aria-hidden><i style={{ width: `${(c.total / maxCategory) * 100}%` }} /></span>
                <strong>{formatVnd(c.total)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.private}>
        <IoLockClosedOutline aria-hidden /> Chỉ bạn xem được trang thu chi.
      </p>

      {expenses.length === 0 ? (
        <div className={styles.empty}>
          <p>
            Ghi lại từng khoản chi để biết đã chi bao nhiêu, còn phải trả ai bao nhiêu, và tiền mừng bù được bao nhiêu.
          </p>
          <LoadingButton
            variant="contained"
            startIcon={<IoListOutline />}
            loading={Boolean(starting)}
            loadingPosition="start"
            onClick={start}
          >
            {starting ? `Đang thêm ${starting.done}/${starting.total}…` : 'Bắt đầu với danh sách gợi ý'}
          </LoadingButton>
          <Button startIcon={<IoAdd />} onClick={() => setEditing({})} disabled={Boolean(starting)}>Tự thêm từng khoản</Button>
        </div>
      ) : (
        <>
          <div className={styles.chips} role="tablist" aria-label="Lọc khoản chi">
            {BUDGET_TABS.map(([k, label, test]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={clsx(tab === k && styles.on)} onClick={() => setTab(k)}>
                {label} <span>{expenses.filter(test).length}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className={styles.none}>{tab === 'owed' ? 'Không còn khoản nào phải trả.' : 'Khoản nào cũng đã có giá.'}</p>
          ) : (
            <ul className={styles.rows}>
              {shown.map(expense => {
                const status = expenseStatus(expense);
                const category = categoryOf(expense.category);
                return (
                  <li key={expense._id}>
                    <button type="button" className={styles.row} onClick={() => setEditing(expense)}>
                      <span className={styles.icon} aria-hidden>{category.emoji}</span>
                      <span className={styles.what}>
                        <strong>{expense.label}</strong>
                        <span>{[category.label, expense.note].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className={styles.money}>
                        <strong>{expense.amount ? formatVnd(expense.amount) : '—'}</strong>
                        <span className={styles[status]}>{STATUS_TEXT[status](expense)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={styles.actions}>
            <Button
              variant="contained"
              startIcon={<IoAdd />}
              onClick={() => setEditing({})}
              disabled={expenses.length >= MAX_EXPENSES}
            >
              Thêm khoản chi
            </Button>
            <Button
              startIcon={<IoDownloadOutline />}
              onClick={() => {
                downloadCsv(`thu-chi-${dayjs(vnWallClock(event.startAt)).format('YYYY-MM-DD')}.csv`, budgetRows(expenses));
                track('budget_exported');
              }}
            >
              Tải Excel
            </Button>
          </div>
        </>
      )}

      {editing && (
        <ExpenseDialog
          key={editing._id ?? 'new'}
          expense={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={values => (editing._id ? update(editing, values) : add(values))}
          onRemove={() => remove(editing)}
        />
      )}
      {isEditingBudget && (
        <BudgetDialog budget={event.budget} onClose={() => setIsEditingBudget(false)} onSave={saveBudget} />
      )}
    </div>
  );
}
