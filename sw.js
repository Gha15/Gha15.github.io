const SHELL_CACHE = 'matix-users-shell-v2';
const USERS_SHELL = '/users/index.html';
const FALLBACK_404 = '/404.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => 
      Promise.all([
        cache.add(USERS_SHELL).catch(() => null),
        cache.add(FALLBACK_404).catch(() => null)
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode !== 'navigate') {
    return;
  }

  const url = new URL(request.url);
  
  // Handle /users/* routes
  if (url.pathname.startsWith('/users/')) {
    // Don't intercept the shell itself or known static files
    if (url.pathname === '/users/' || url.pathname === '/users/index.html' || url.pathname === '/users/404.html') {
      return;
    }
    
    // Check if it's a known member folder (has physical index.html)
    const memberFolders = ['ghadi', 'dahlia', 'yara', 'jad', 'marwan', 'mak', 'ghadi-matix'];
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && memberFolders.includes(pathParts[1])) {
      return; // Let member folders handle themselves
    }

    // Serve the users shell for any other /users/* path
    event.respondWith(
      fetch(USERS_SHELL, { cache: 'no-cache' })
        .catch(() => caches.match(USERS_SHELL))
        .catch(() => fetch(request))
    );
  }
});
