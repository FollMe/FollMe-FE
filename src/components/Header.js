import { Link } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import normalStyles from './NormalHeader.module.scss';
import { useUserInfo } from 'customHooks/useUserInfo';
import UserMenu from './UserMenu';


const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      right: -5,
      top: -2,
      fontSize: '1.2rem',
      padding: '0 4px',
    },
}));

export default function Header({ type, setIsOpenSideDrawer }) {
    const [ userInfo ] = useUserInfo();
    let styles = normalStyles;
    return (
        <header>
            <nav className={styles.navbarMe}>
                <IconButton onClick={() => setIsOpenSideDrawer(curr => !curr)}>
                    <MenuIcon />
                </IconButton>
                <Link to="/"><img src="/imgs/follme-logo.png" alt="FollMe Logo" className={styles.navLogo} /></Link>
                <h1>FollMe</h1>
                <div className="user-box">
                    <Tooltip title={<Typography fontSize={"1.3rem"}>Thông báo</Typography>}>
                        <IconButton className={styles.navbarWidget}>
                            <StyledBadge badgeContent={0} color="primary">
                                <NotificationsIcon sx={{width: 20, height: 20, color: "black"}} />
                            </StyledBadge>
                        </IconButton>
                    </Tooltip>
                    {
                        Object.keys(userInfo).length !== 0 ?  <UserMenu picture={userInfo.avatar?.link} /> : <></>
                    }
                </div>
            </nav>
        </header>
    )
}