if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  const installButton = document.querySelector('#install-app');
  if (installButton) installButton.hidden = false;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  const installButton = document.querySelector('#install-app');
  if (installButton) installButton.hidden = true;
});

const installButton = document.querySelector('#install-app');
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    installButton.hidden = true;
  });
}
