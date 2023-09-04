export function forceLogin() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  window.sessionStorage.setItem('redirect', window.location.pathname);
}