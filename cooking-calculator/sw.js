const CACHE_VERSION = "v1"; // bump this when you want to force a clean cache
const APP_CACHE = `app-${CACHE_VERSION}`;

// List every “page” and key assets you want instantly available.
// Add new calculator pages here as you create them.
const PRECACHE_URLS = [
	"./",
	"./index.html",
	"./microwave.html",
	"./temperature.html",

	"./site.webmanifest",
	"./favicon/32.png",
	"./favicon/192.png",
	"./favicon/512.png",

	"./css/main.css",
	"./js/app.js",
	"./js/persist-form.js",
	"./js/microwave.js"
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
	);
	self.skipWaiting(); // immediate update model
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(
			keys
				.filter((k) => k !== APP_CACHE)
				.map((k) => caches.delete(k))
		);
		await self.clients.claim(); // start controlling pages immediately
	})());
});

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

self.addEventListener("fetch", (event) => {
	const req = event.request;
	if (req.method !== "GET") return;

	const url = new URL(req.url);

	// Only handle same-origin requests (self-hosted assets)
	if (url.origin !== self.location.origin) return;

	// For navigation requests (HTML pages), do cache-first so it’s instant offline.
	if (req.mode === "navigate") {
		event.respondWith(cacheFirst(req));
		return;
	}

	// For static assets, cache-first is fine for your “instant start” requirement.
	event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
	const cache = await caches.open(APP_CACHE);
	const cached = await cache.match(req, { ignoreSearch: true });
	if (cached) return cached;

	const res = await fetch(req);
	// Cache successful responses
	if (res.ok) cache.put(req, res.clone());
	return res;
}
