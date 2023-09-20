import * as React from 'react';
import { useNavigate, useMatch, useResolvedPath } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { IoNewspaper, IoTicket, IoLibrary } from "react-icons/io5";
import './SideDrawer.css';

const drawerWidth = 240;
const animationDuration = 200;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: animationDuration,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.easeOut,
    duration: animationDuration,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {})(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);


export default function SideDrawer({ setIsOpenSideDrawer, isOpenSideDrawer, isMobile }) {
  const navigate = useNavigate();

  const toggleDrawer = (event) => {
    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }

    setIsOpenSideDrawer(false);
  };

  const handClickItem = (to) => {
    if (isMobile) {
      setIsOpenSideDrawer(false);
    }
    navigate(to);
  }

  return (
    <Drawer
      PaperProps={{ sx: { top: isMobile ? 0 : 61, zIndex: 1 } }}
      open={isOpenSideDrawer}
      variant={isMobile ? "temporary" : "permanent"}
      onClose={toggleDrawer}
    >
      <List>
        <SideBarItem to='stories' title='Truyện' isOpenSideDrawer={isOpenSideDrawer}
          handClickItem={handClickItem} color='rgb(99 102 241)' children={<IoLibrary />}
        />
        <SideBarItem to='blogs' title='Blog' isOpenSideDrawer={isOpenSideDrawer}
          handClickItem={handClickItem} color='#ec4899' children={<IoNewspaper />}
        />
        <SideBarItem to='invitations' title='Thư mời' isOpenSideDrawer={isOpenSideDrawer}
          handClickItem={handClickItem} color='#f59e0b' children={<IoTicket />}
        />
      </List>
    </Drawer>
  );
}


function SideBarItem({ to, title, isOpenSideDrawer, children, color, handClickItem }) {
  const resolvedPath = useResolvedPath(to);

  const isActive = Boolean(useMatch({ path: resolvedPath.pathname, end: false }));

  return (
    <ListItem key={title} disablePadding sx={{ display: 'block', mb: '4px' }}>
      <ListItemButton
        className={isActive ? "active" : ""}
        sx={{
          minHeight: 50,
          justifyContent: isOpenSideDrawer ? 'initial' : 'center',
          px: 2.5,
          mt: 1,
          borderRadius: '8px'
        }}
        onClick={() => handClickItem(to)}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isOpenSideDrawer ? 1.5 : 'auto',
            justifyContent: 'center',
            fontSize: 28,
            color: color
          }}
        >
          {children}
        </ListItemIcon>
        <ListItemText className='txtTitleSideBar'
          primary={title} sx={{ opacity: isOpenSideDrawer ? 1 : 0 }} primaryTypographyProps={{ sx: { fontSize: '1.4rem' } }}
        />
      </ListItemButton>
    </ListItem>
  )
}