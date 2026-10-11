const CACHE_NAME = "bars-shell-0.4.0";

// Relative URLs so this works on GitHub Pages under /bars/.
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./ideabrowser.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./fonts/fonts.css",
  "./fonts/big-shoulders-display-latin-variable.woff2",
  "./fonts/spline-sans-latin-variable.woff2",
  "./fonts/spline-sans-mono-latin-variable.woff2"
];

const TIMEOUT_MS = 3000;

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function stripSearch(url) {
  try {
    const u = new URL(url);
    u.search = "";
    return u.href;
  } catch {
    return url;
  }
}

function isShellRequest(url) {
  const normalized = stripSearch(url);
  return SHELL.some((path) => new URL(path, self.location.href).href === normalized);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        SHELL.map((url) => new Request(url, { cache: "reload" }))
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function fetchWithTimeout(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (!isSameOrigin(request.url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(new Request(request, { cache: "reload" }))
        .then((response) => {
          if (!response.ok && response.type !== "opaqueredirect") {
            throw new Error("Navigation response not OK: " + response.status);
          }
          return response;
        })
        .catch(() =>
          caches
            .open(CACHE_NAME)
            .then((cache) =>
              cache.match(new URL("./index.html", self.registration.scope))
            )
            .then((cached) => {
              if (cached) return cached;
              throw new Error("Offline and index.html is not cached");
            })
        )
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const networkResponse = await fetchWithTimeout(
          new Request(request, { cache: "reload" })
        );
        if (networkResponse && networkResponse.status === 200 && isShellRequest(request.url)) {
          const cacheKey = stripSearch(request.url);
          event.waitUntil(cache.put(cacheKey, networkResponse.clone()));
        }
        return networkResponse;
      } catch {
        const cached = await cache.match(stripSearch(request.url), { ignoreSearch: true });
        if (cached) return cached;
        throw new Error("Network and cache both failed for " + request.url);
      }
    })
  );
});
