export function forceLogin() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  window.sessionStorage.setItem('redirect', window.location.pathname);
}


export function handleCheckLoggedIn(sessionExp) {
  if (!sessionExp) {
    return false;
  }
  if (new Date().getTime() > sessionExp * 1000) {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    return false;
  }
  return true;
}