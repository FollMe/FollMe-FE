import { useState, useRef, useCallback } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import { getCursorXY } from "util/cursorHelper";

export default function TagPopup({ inputElement, users, onClickProfile, focusIndex }) {
  const [selfHeight, setSelfHeight] = useState(0);
  const resizeObserver = useRef(null);
  const position = inputElement ? getCursorXY(inputElement) : { x: 0, y: 0 };


  const measuredSelfHeightRef = useCallback(node => {
    if (!node) {
      return resizeObserver.current.disconnect()
    }
    resizeObserver.current = new ResizeObserver(() => {
      setSelfHeight(node?.clientHeight ?? 0)
    });
    resizeObserver.current.observe(node);
  }, []);

  return (
    <List
      ref={measuredSelfHeightRef}
      sx={{
        position: 'fixed',
        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 3px',
        padding: 0,
        top: position.y - selfHeight,
        left: window.innerWidth - position.x >= 376
          ? position.x
          : window.innerWidth > 360
            ? (window.innerWidth - 360) / 2
            : 0
      }}
    >
      {
        users.map((user, index) => (
          <ListItem
            key={user._id}
            onClick={e => {
              e.preventDefault();
              onClickProfile(user.name ?? user.slEmail)
            }}
            sx={{
              cursor: 'pointer',
              "&:hover": {
                backgroundColor: '#f0f2f5'
              },
              backgroundColor: index === focusIndex ? '#f0f2f5' : 'unset',
              borderRadius: '8px'
            }}
          >
            <ListItemAvatar>
              <img src={user.avatar?.link ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = "/imgs/user.svg";
                }}
              />
            </ListItemAvatar>
            <ListItemText primary={user.name ?? user.slEmail} sx={{ fontWeight: 500 }} />
          </ListItem>
        ))
      }
    </List>
  );
}