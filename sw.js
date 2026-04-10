// Service Worker – Ügyeleti Beosztó
// Stratégia: Network-first (mindig friss adat Firebase-ből),
// de az app shell (HTML/CSS/JS) cachelve van offline használathoz.

const CACHE = ‘ugyelet-v1’;
const SHELL = [
‘/ugyelet/’,
‘/ugyelet/index.html’,
‘/ugyelet/manifest.json’,
‘https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap’,
‘https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js’,
];

self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
);
});

self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
).then(() => self.clients.claim())
);
});

self.addEventListener(‘fetch’, e => {
const url = new URL(e.request.url);

// Firebase requests: always network, no cache
if (url.hostname.includes(‘firestore.googleapis.com’) ||
url.hostname.includes(‘firebase’) ||
url.hostname.includes(‘google.com’)) {
return;
}

// App shell: cache-first, fall back to network
e.respondWith(
caches.match(e.request).then(cached => {
const networkFetch = fetch(e.request).then(response => {
if (response.ok) {
const clone = response.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
}
return response;
});
return cached || networkFetch;
})
);
});

// Listen for SKIP_WAITING message from app (for update handling)
self.addEventListener(‘message’, e => {
if (e.data === ‘SKIP_WAITING’) self.skipWaiting();
});