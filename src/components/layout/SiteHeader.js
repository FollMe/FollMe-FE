import { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import {
  IoMenu, IoClose, IoHomeOutline, IoNewspaperOutline, IoLibraryOutline, IoTicketOutline, IoCreateOutline,
  IoSparklesOutline, IoSearchOutline, IoHeartOutline, IoCalendarOutline,
} from 'react-icons/io5';
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';
import UserMenu from 'components/UserMenu';
import CommandPalette from 'components/search/CommandPalette';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import styles from './SiteHeader.module.scss';

export const NAV_ITEMS = [
  { to: '/cuoi-hoi', label: 'Cưới hỏi', icon: <IoTicketOutline />, end: true },
  { to: '/fortune/hop-tuoi', label: 'Xem tuổi', icon: <IoHeartOutline /> },
  { to: '/cuoi-hoi/chon-ngay', label: 'Chọn ngày cưới', icon: <IoCalendarOutline /> },
  { to: '/fortune', label: 'Lịch & Tử vi', icon: <IoSparklesOutline /> },
];

// The author's corner: still reachable, no longer in the main menu.
const CORNER_ITEMS = [
  { to: '/blogs', label: 'Blog', icon: <IoNewspaperOutline /> },
  { to: '/stories', label: 'Truyện', icon: <IoLibraryOutline /> },
];

export default function SiteHeader({ isLoggedIn, userInfo }) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRequestLoginDialog, setShowRequestLoginDialog] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

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
    navigate('/events/create?type=wedding');
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
              end={item.end}
              className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              onClick={event => handleClickNav(event, item)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <button type="button" className={styles.searchTrigger} onClick={openSearch} aria-label="Tìm kiếm">
            <IoSearchOutline />
            <span className={styles.searchLabel}>Tìm kiếm…</span>
            <kbd className={styles.searchKbd}>{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
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
                Tạo thiệp
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
              end={item.end}
              className={({ isActive }) => clsx(styles.drawerLink, isActive && styles.active)}
              onClick={event => handleClickNav(event, item)}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          <div className={styles.drawerSection}>Góc nhỏ</div>
          {CORNER_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(styles.drawerLink, styles.drawerMinor, isActive && styles.active)}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.drawerFoot}>
          {isLoggedIn ? (
            <Button fullWidth variant="contained" size="large" startIcon={<IoCreateOutline />} onClick={handleClickWrite}>
              Tạo thiệp cưới
            </Button>
          ) : (
            <Button fullWidth variant="contained" size="large" onClick={() => { setIsMenuOpen(false); navigate('/sign-in'); }}>
              Đăng nhập
            </Button>
          )}
        </div>
      </Drawer>

      <CommandPalette open={isSearchOpen} onOpen={openSearch} onClose={closeSearch} />

      {
        showRequestLoginDialog
        && <RequestSignInDialog open={true} setOpen={setShowRequestLoginDialog} action="tiếp tục" />
      }
    </header>
  )
}
