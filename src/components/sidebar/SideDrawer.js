import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { IoNewspaper } from "react-icons/io5";
import { IoLibrary } from "react-icons/io5";
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

    return (
        <Drawer
            PaperProps={{ sx: { top: isMobile ? 0 : 61, zIndex: 1 } }}
            open={isOpenSideDrawer}
            variant={isMobile ? "temporary" : "permanent"}
            onClose={toggleDrawer}
        >
            <List>
                <ListItem key='story' disablePadding sx={{ display: 'block', mb: '4px' }}>
                    <ListItemButton
                        sx={{
                            minHeight: 50,
                            justifyContent: isOpenSideDrawer ? 'initial' : 'center',
                            px: 2.5,
                            mt: 1,
                            borderRadius: '8px'
                        }}
                        onClick={() => navigate('stories')}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: isOpenSideDrawer ? 1.5 : 'auto',
                                justifyContent: 'center',
                                fontSize: 28,
                                color: 'rgb(99 102 241)'
                            }}
                        >
                            <IoLibrary />
                        </ListItemIcon>
                        <ListItemText className='txtTitleSideBar'
                            primary='Story' sx={{ opacity: isOpenSideDrawer ? 1 : 0 }} primaryTypographyProps={{ sx: {fontSize: '1.4rem'}}}
                        />
                    </ListItemButton>
                </ListItem>
                <ListItem key='Blog' disablePadding sx={{ display: 'block', mb: '4px' }}>
                    <ListItemButton
                        sx={{
                            minHeight: 50,
                            justifyContent: isOpenSideDrawer ? 'initial' : 'center',
                            px: 2.5,
                            borderRadius: '8px'
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: isOpenSideDrawer ? 1.5 : 'auto',
                                justifyContent: 'center',
                                fontSize: 28,
                                color: '#ec4899'
                            }}
                        >
                            <IoNewspaper />
                        </ListItemIcon>
                        <ListItemText className='txtTitleSideBar'
                            primary='Blog' sx={{ opacity: isOpenSideDrawer ? 1 : 0, fontSize: 20 }} primaryTypographyProps={{ sx: {fontSize: '1.4rem'}}}
                        />
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    );
}
