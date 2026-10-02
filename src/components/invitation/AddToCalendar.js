import { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { IoCalendarOutline, IoLogoGoogle, IoLogoApple } from 'react-icons/io5';
import { googleCalendarUrl, icsFile, openIcs } from 'util/calendar';
import { track } from 'util/analytics';

// Calendars get a three-hour slot for the party
const DURATION_MS = 3 * 60 * 60 * 1000;

/** "Lưu vào lịch": Google Calendar, or an .ics for iPhone and Outlook. */
export default function AddToCalendar({ event }) {
  const [anchor, setAnchor] = useState(null);
  const start = new Date(event.startAt);
  const end = new Date(start.getTime() + DURATION_MS);
  const url = window.location.href.split('#')[0];
  const info = { title: event.title, start, end, location: event.location };

  function saveIcs() {
    openIcs('thiep-moi.ics', icsFile({
      ...info,
      uid: `${event._id ?? 'demo'}@follme`,
      description: `Thiệp mời: ${url}`,
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
          href={googleCalendarUrl({ ...info, details: `Thiệp mời: ${url}` })}
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
