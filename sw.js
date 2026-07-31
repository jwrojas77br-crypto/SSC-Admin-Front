// Producción: versión de caché fija para probar actualizaciones
const CACHE = "ssc-admin-v20";

self.addEventListener("install", e => {
	// Permite que el SW nuevo tome control sin esperar al viejo
	self.skipWaiting();
	e.waitUntil(
		caches.open(CACHE).then(cache => {
			// Precache los assets principales con rutas relativas al SW
			return cache.addAll([
				"./",
				"./index.html",
				"./styles.css",
				"./app.js",
				"./manifest.json",

				"./Config/config.js",
				"./Api/api.client.js",

				"./Login/login.css",
				"./Login/login.api.js",
				"./Login/login.view.js",
				"./Login/login.controller.js",

				"./Session/session.storage.js",
				"./Session/session.api.js",
				"./Session/session.service.js",

				"./Authenticator/authenticator.api.js",
				"./Authenticator/authenticator.service.js",
				"./Authenticator/authenticator.view.js",
				"./Authenticator/authenticator.css",
				"./Authenticator/authenticator.controller.js",

				"./Vendor/qrcode.min.js",
				"./Authenticator/qr.generator.js",

				"./icons/icon.png",
			]);
		})
	);
});

// Limpiar cachés antiguos cuando se activa el nuevo SW
self.addEventListener("activate", e => {
	e.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(
				names.map(name => {
					if (name !== CACHE) {
						console.log("Borrando caché antiguo:", name);
						return caches.delete(name);
					}
				})
			);
			// Hace que el SW tome control de las páginas abiertas
			await self.clients.claim();
		})()
	);
});


// Cache-first para assets; fallback a index.html en navegaciones offline
self.addEventListener("fetch", e => {
	const req = e.request;
	// Si es navegación (HTML), intenta red y si falla, sirve el index
	if (req.mode === "navigate") {
		e.respondWith(
			fetch(req).catch(() => caches.match("./index.html"))
		);
		return;
	}
	// Para otros recursos, cache-first
	e.respondWith(
		caches.match(req).then(res => res || fetch(req))
	);
});
