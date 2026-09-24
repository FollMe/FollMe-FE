import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import {
  IoMenu, IoClose, IoHomeOutline, IoNewspaperOutline, IoLibraryOutline, IoTicketOutline, IoCreateOutline,
} from 'react-icons/io5';
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';
import UserMenu from 'components/UserMenu';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import styles from './SiteHeader.module.scss';

export const NAV_ITEMS = [
  { to: '/blogs', label: 'Blog', icon: <IoNewspaperOutline /> },
  { to: '/stories', label: 'Truyện', icon: <IoLibraryOutline /> },
  { to: '/events', label: 'Thư mời', icon: <IoTicketOutline />, isProtected: true },
];

export default function SiteHeader({ isLoggedIn, userInfo }) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRequestLoginDialog, setShowRequestLoginDialog] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleClickNav(event, item) {
    setIsMenuOpen(false);
    if (item.isProtected && !isLoggedIn) {
      event.preventDefault();
      setShowRequestLoginDialog(true);
    }
  }

  function handleClickWrite() {
    setIsMenuOpen(false);
    if (!isLoggedIn) {
      setShowRequestLoginDialog(true);
      return;
    }
    navigate('/blogs/create');
  }

  return (
    <header className={clsx(styles.header, isScrolled && styles.scrolled)}>
      <div className={clsx('container', styles.inner)}>
        <BrandLogo />

        <nav className={styles.nav} aria-label="Điều hướng chính">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              onClick={event => handleClickNav(event, item)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Button
                className={styles.desktopOnly}
                variant="outlined"
                size="small"
                startIcon={<IoCreateOutline />}
                onClick={handleClickWrite}
              >
                Viết bài
              </Button>
              <UserMenu userInfo={userInfo} />
            </>
          ) : (
            <Button className={styles.desktopOnly} variant="contained" size="small" onClick={() => navigate('/sign-in')}>
              Đăng nhập
            </Button>
          )}
          <IconButton
            className={styles.menuButton}
            aria-label="Mở menu"
            onClick={() => setIsMenuOpen(true)}
            sx={{ width: 40, height: 40, fontSize: 24 }}
          >
            <IoMenu />
          </IconButton>
        </div>
      </div>

      <Drawer
        anchor="right"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        PaperProps={{ className: styles.drawer }}
      >
        <div className={styles.drawerHead}>
          <BrandLogo onClick={() => setIsMenuOpen(false)} />
          <IconButton aria-label="Đóng menu" onClick={() => setIsMenuOpen(false)} sx={{ fontSize: 24 }}>
            <IoClose />
          </IconButton>
        </div>
        <nav className={styles.drawerNav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => clsx(styles.drawerLink, isActive && styles.active)}
            onClick={() => setIsMenuOpen(false)}
          >
            <IoHomeOutline /> Trang chủ
          </NavLink>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(styles.drawerLink, isActive && styles.active)}
              onClick={event => handleClickNav(event, item)}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.drawerFoot}>
          {isLoggedIn ? (
            <Button fullWidth variant="contained" size="large" startIcon={<IoCreateOutline />} onClick={handleClickWrite}>
              Viết bài mới
            </Button>
          ) : (
            <Button fullWidth variant="contained" size="large" onClick={() => { setIsMenuOpen(false); navigate('/sign-in'); }}>
              Đăng nhập
            </Button>
          )}
        </div>
      </Drawer>

      {
        showRequestLoginDialog
        && <RequestSignInDialog open={true} setOpen={setShowRequestLoginDialog} action="tiếp tục" />
      }
    </header>
  )
}
