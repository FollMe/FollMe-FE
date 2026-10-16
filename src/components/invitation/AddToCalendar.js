import { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { IoCalendarOutline, IoLogoGoogle, IoLogoApple } from 'react-icons/io5';
import { googleCalendarUrl, icsFile, openIcs } from 'util/calendar';
import { isAwayFromVietnam } from 'util/date';
import { programMoment, programText } from 'util/program';
import { track } from 'util/analytics';

// Calendars get a three-hour slot for the party
const DURATION_MS = 3 * 60 * 60 * 1000;

/** "Lưu vào lịch": Google Calendar, or an .ics for iPhone and Outlook. */
export default function AddToCalendar({ event }) {
  const [anchor, setAnchor] = useState(null);
  const program = event.program ?? [];
  const start = new Date(event.startAt);
  // Long enough for the whole program too
  const lastMoment = program.length ? programMoment(program[program.length - 1].time, event.startAt) : 0;
  const end = new Date(Math.max(start.getTime() + DURATION_MS, lastMoment + DURATION_MS / 3));
  const url = window.location.href.split('#')[0];
  const info = { title: event.title, start, end, location: event.location };
  const details = [
    program.length > 0 && `Chương trình${isAwayFromVietnam() ? ' (giờ Việt Nam)' : ''}: ${programText(program)}`,
    `Thiệp mời: ${url}`,
  ].filter(Boolean).join('\n');

  function saveIcs() {
    openIcs('thiep-moi.ics', icsFile({
      ...info,
      uid: `${event._id ?? 'demo'}@follme`,
      description: details,
      url,
    }));
    track('calendar_added', { to: 'ics' });
    setAnchor(null);
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<IoCalendarOutline />}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={e => setAnchor(e.currentTarget)}
      >
        Lưu vào lịch
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          component="a"
          href={googleCalendarUrl({ ...info, details })}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            track('calendar_added', { to: 'google' });
            setAnchor(null);
          }}
        >
          <ListItemIcon><IoLogoGoogle /></ListItemIcon>Google Calendar
        </MenuItem>
        <MenuItem onClick={saveIcs}>
          <ListItemIcon><IoLogoApple /></ListItemIcon>Lịch iPhone, Outlook
        </MenuItem>
      </Menu>
    </>
  );
}
