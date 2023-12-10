import { useState, useRef, useCallback, useMemo, Fragment } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Divider from '@mui/material/Divider';
import { getCursorXY } from "util/cursorHelper";


export default function TagPopup({ inputElement, users, onClickProfile, focusIndex }) {
  const [selfHeight, setSelfHeight] = useState(0);
  const resizeObserver = useRef(null);
  const position = useMemo(
    () => inputElement ? getCursorXY(inputElement) : { x: 0, y: 0 },
    [inputElement.innerHTML]
  )


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
        left: position.x
      }}
    >
      {
        users.map((user, index) => (
          <Fragment key={user._id}>
            <ListItem
              onClick={() => onClickProfile(user.name ?? user.slEmail)}
              sx={{
                cursor: 'pointer',
                "&:hover": {
                  backgroundColor: '#f0f2f5'
                },
                backgroundColor: index === focusIndex ? '#f0f2f5' : 'none',
              }}
              onKeyDown={e => {
                console.log(e);
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
            {
              index !== users.length - 1 && <Divider variant="inset" component="li" />
            }
          </Fragment>
        ))
      }
    </List>
  );
}