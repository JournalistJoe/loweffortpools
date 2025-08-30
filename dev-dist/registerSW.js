if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/dev-sw.js?dev-sw', { scope: '/', type: 'classic' })
    .then(registration => {
      console.log('Service Worker registered successfully:', registration);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}