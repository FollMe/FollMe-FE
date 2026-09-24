import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import { IoCreateOutline, IoTicketOutline, IoLogOutOutline } from 'react-icons/io5';
import { useUserInfo } from 'customHooks/useUserInfo';
import Avatar from 'components/Avatar';
import styles from './UserMenu.module.scss';

export default function UserMenu({ userInfo = {} }) {
    const navigate = useNavigate();
    const [, setUserInfo] = useUserInfo();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const displayName = userInfo.name ?? userInfo.slEmail ?? 'Tài khoản';

    const handleClose = () => {
        setAnchorEl(null);
    };

    const goTo = (path) => {
        handleClose();
        navigate(path);
    };

    const handleSignOut = () => {
        handleClose();
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        if (window.location.pathname !== '/sign-in') {
            setUserInfo({});
            return navigate('/sign-in');
        }
    }

    return (
        <>
            <button
                type="button"
                className={styles.trigger}
                id="user-menu-button"
                aria-label="Tài khoản"
                aria-controls={open ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={event => setAnchorEl(event.currentTarget)}
            >
                <Avatar src={userInfo.avatar?.link} name={displayName} size={36} />
            </button>
            <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                MenuListProps={{ 'aria-labelledby': 'user-menu-button' }}
                PaperProps={{ sx: { mt: 1, minWidth: 220, borderRadius: '14px' } }}
            >
                <div className={styles.head}>
                    <Avatar src={userInfo.avatar?.link} name={displayName} size={40} />
                    <div className={styles.headText}>
                        <div className={styles.name}>{displayName}</div>
                        <div className={styles.sub}>Thành viên FollMe</div>
                    </div>
                </div>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => goTo('/blogs/create')}>
                    <ListItemIcon className={styles.icon}><IoCreateOutline /></ListItemIcon>
                    Viết blog
                </MenuItem>
                <MenuItem onClick={() => goTo('/events')}>
                    <ListItemIcon className={styles.icon}><IoTicketOutline /></ListItemIcon>
                    Thư mời của tôi
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleSignOut}>
                    <ListItemIcon className={styles.icon}><IoLogOutOutline /></ListItemIcon>
                    Đăng xuất
                </MenuItem>
            </Menu>
        </>
    );
}
