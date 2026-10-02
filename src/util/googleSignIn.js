// Google's sign-in script, loaded by the sign-in and sign-up pages only:
// guests opening an invitation never fetch it (nor ping Google).
const SRC = 'https://accounts.google.com/gsi/client';

let loading = null;

/** Resolves with google.accounts.id once the script is ready. */
export function loadGoogleSignIn() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SRC;
      script.async = true;
      script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('gsi')));
      script.onerror = () => {
        // Let a later visit try again (offline, blocked by an extension...)
        loading = null;
        script.remove();
        reject(new Error('gsi'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}
