import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { IoAdd, IoCheckmark, IoChevronDown, IoChevronForward, IoListOutline } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import { eventHeadline, invitationApi, isCoupleEvent } from 'util/invitation';
import {
  MAX_TASKS, MAX_TASK_LABEL, TASK_LINKS, TASK_SECTIONS, daysLeft, dueText, eventDay, starterTasks, taskHint, taskSections,
} from 'util/checklist';
import { fromVnWallClock, vnWallClock } from 'util/date';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './Checklist.module.scss';

/** "2027-01-16" for a date input, in Vietnam. */
const dateField = due => (due ? dayjs(vnWallClock(due)).format('YYYY-MM-DD') : '');
/** Noon in Vietnam on the day picked in a date input, or null. */
const fromDateField = value => (value ? fromVnWallClock(new Date(`${value}T12:00:00`)).toISOString() : null);

/** Renames, re-dates or removes a task. */
function TaskDialog({ task, onClose, onSave, onRemove }) {
  const [label, setLabel] = useState(task.label);
  const [due, setDue] = useState(dateField(task.due));
  const [isSaving, setIsSaving] = useState(false);

  async function run(action) {
    setIsSaving(true);
    try {
      await action();
    } catch (err) {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs" disableRestoreFocus>
      <form onSubmit={e => {
        e.preventDefault();
        if (label.trim()) {
          run(() => onSave({ label: label.trim(), due: fromDateField(due) }));
        }
      }}
      >
        <DialogTitle>Sửa việc</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TextField fullWidth autoFocus label="Việc cần làm" value={label} inputProps={{ maxLength: MAX_TASK_LABEL }} onChange={e => setLabel(e.target.value)} />
          <TextField
            fullWidth
            type="date"
            label="Hạn"
            value={due}
            onChange={e => setDue(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Để trống nếu không cần hạn"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" onClick={() => run(onRemove)} disabled={isSaving} sx={{ mr: 'auto' }}>Xoá</Button>
          <Button onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSaving} disabled={!label.trim()}>Lưu</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function TaskRow({ task, event, now, onToggle, onEdit }) {
  const link = task.link && TASK_LINKS[task.link];
  const hint = !task.done && taskHint(task, event);
  const late = !task.done && task.due && daysLeft(task.due, now) < 0;
  return (
    <li className={clsx(styles.task, task.done && styles.done)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={Boolean(task.done)}
        aria-label={task.label}
        className={styles.check}
        onClick={() => onToggle(task)}
      >
        {task.done && <IoCheckmark aria-hidden />}
      </button>
      <button type="button" className={styles.body} onClick={() => onEdit(task)}>
        <strong>{task.label}</strong>
        <span className={clsx(late && styles.late)}>
          {[task.done ? `Xong ${dayjs(vnWallClock(task.doneAt ?? Date.now())).format('DD/MM')}` : dueText(task.due, now), hint]
            .filter(Boolean).join(' · ')}
        </span>
      </button>
      {link && !task.done && (
        <Link className={styles.go} to={link.to(event._id)}>
          {link.label} <IoChevronForward aria-hidden />
        </Link>
      )}
    </li>
  );
}

/**
 * Việc cần làm: what to do from months before the day to the thank-yous
 * after it, each task due by a date counted from the event and, where the
 * site has a tool for it, a shortcut there.
 */
export default function Checklist() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDue, setNewDue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const now = Date.now();

  useEffect(() => {
    window.scrollTo(0, 0);
    invitationApi.hostGet(eventId)
      .then(({ invitation }) => {
        setPageMeta({ title: `Việc cần làm · ${invitation.title}` });
        setEvent(invitation);
      })
      .catch(() => navigate('/events'));
  }, [eventId, navigate]);

  const tasks = useMemo(() => event?.checklist ?? [], [event]);
  const sections = useMemo(() => taskSections(tasks, now), [tasks, now]);
  const setTasks = update => setEvent(e => ({ ...e, checklist: update(e.checklist ?? []) }));
  const replace = saved => setTasks(list => list.map(t => (t._id === saved._id ? saved : t)));

  async function toggle(task) {
    const done = !task.done;
    // Ticks at once; put back if the server says no
    replace({ ...task, done, doneAt: done ? new Date().toISOString() : undefined });
    try {
      replace(await invitationApi.updateTask(eventId, task._id, { done }));
      if (done) {
        track('task_done', { link: task.link ?? 'none' });
      }
    } catch (err) {
      replace(task);
    }
  }

  async function start() {
    setIsStarting(true);
    try {
      const added = await invitationApi.addTasks(eventId, starterTasks(event.type, event.startAt));
      setTasks(list => [...list, ...added]);
      track('checklist_started', { type: event.type });
    } finally {
      setIsStarting(false);
    }
  }

  async function add(e) {
    e.preventDefault();
    if (!newLabel.trim()) {
      return;
    }
    setIsAdding(true);
    try {
      const due = fromDateField(newDue);
      const added = await invitationApi.addTasks(eventId, [{ label: newLabel.trim(), ...(due ? { due } : {}) }]);
      setTasks(list => [...list, ...added]);
      setNewLabel('');
      setNewDue('');
      toast.success(`Đã thêm: ${added[0].label}`);
    } finally {
      setIsAdding(false);
    }
  }

  if (!event) {
    return <OvalLoading />;
  }

  const doneCount = sections.done.length;
  const daysToEvent = daysLeft(eventDay(event.startAt), now);
  const what = isCoupleEvent(event.type) ? 'ngày cưới' : 'ngày tiệc';
  return (
    <div className={`container page ${styles.page}`}>
      <ArticleHeader back={{ to: `/events/${eventId}`, label: event.title }} eyebrow="Việc cần làm" title={eventHeadline(event)} />

      <section className={styles.hero} aria-label="Tiến độ">
        <div>
          <strong>{daysToEvent > 0 ? `Còn ${daysToEvent} ngày` : daysToEvent === 0 ? 'Hôm nay' : `Đã qua ${-daysToEvent} ngày`}</strong>
          <span>{daysToEvent >= 0 ? `tới ${what}` : `từ ${what}`} · {dayjs(vnWallClock(event.startAt)).format('DD/MM/YYYY')}</span>
        </div>
        {tasks.length > 0 && (
          <div className={styles.progress}>
            <span><b>{doneCount}</b>/{tasks.length} việc đã xong</span>
            <div
              className={styles.bar}
              role="progressbar"
              aria-label="Việc đã xong"
              aria-valuemin={0}
              aria-valuemax={tasks.length}
              aria-valuenow={doneCount}
            >
              <i style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
            </div>
          </div>
        )}
      </section>

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <p>
            Một danh sách việc theo mốc thời gian, từ đặt nhà hàng, gửi thiệp, xếp bàn tới ghi sổ mừng và cảm ơn khách.
            Hạn mỗi việc tính theo {what} của bạn; nhiều việc có lối tắt tới đúng công cụ.
          </p>
          <LoadingButton variant="contained" startIcon={<IoListOutline />} loading={isStarting} loadingPosition="start" onClick={start}>
            Tạo danh sách gợi ý
          </LoadingButton>
        </div>
      ) : (
        TASK_SECTIONS.filter(([key]) => key !== 'done' && sections[key].length > 0).map(([key, title]) => (
          <section key={key} className={styles.section} aria-labelledby={`tasks-${key}`}>
            <h2 id={`tasks-${key}`} className={clsx(key === 'late' && styles.lateTitle)}>
              {title} <span>{sections[key].length}</span>
            </h2>
            <ul className={styles.tasks}>
              {sections[key].map(task => (
                <TaskRow key={task._id} task={task} event={event} now={now} onToggle={toggle} onEdit={setEditing} />
              ))}
            </ul>
          </section>
        ))
      )}

      {tasks.length > 0 && doneCount === tasks.length && (
        <p className={styles.allDone}>Xong hết rồi! 🎉</p>
      )}

      {doneCount > 0 && (
        <section className={styles.section}>
          <button type="button" className={styles.doneToggle} aria-expanded={showDone} onClick={() => setShowDone(v => !v)}>
            Đã xong <span>{doneCount}</span>
            <IoChevronDown aria-hidden className={clsx(showDone && styles.flip)} />
          </button>
          {showDone && (
            <ul className={styles.tasks}>
              {sections.done.map(task => (
                <TaskRow key={task._id} task={task} event={event} now={now} onToggle={toggle} onEdit={setEditing} />
              ))}
            </ul>
          )}
        </section>
      )}

      {(tasks.length > 0 || !isStarting) && tasks.length < MAX_TASKS && (
        <form className={styles.add} onSubmit={add}>
          <TextField
            className={styles.addLabel}
            size="small"
            label="Thêm việc"
            placeholder="VD: Thử váy lần 2"
            value={newLabel}
            inputProps={{ maxLength: MAX_TASK_LABEL }}
            onChange={e => setNewLabel(e.target.value)}
          />
          <TextField
            className={styles.addDue}
            size="small"
            type="date"
            label="Hạn"
            value={newDue}
            onChange={e => setNewDue(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <LoadingButton type="submit" variant="outlined" startIcon={<IoAdd />} loading={isAdding} disabled={!newLabel.trim()}>
            Thêm
          </LoadingButton>
        </form>
      )}

      {editing && (
        <TaskDialog
          key={editing._id}
          task={editing}
          onClose={() => setEditing(null)}
          onSave={async values => {
            replace(await invitationApi.updateTask(eventId, editing._id, values));
            setEditing(null);
          }}
          onRemove={async () => {
            await invitationApi.removeTask(eventId, editing._id);
            setTasks(list => list.filter(t => t._id !== editing._id));
            toast.success(`Đã xoá: ${editing.label}`);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
