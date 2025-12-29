// Service Worker for VSLA App - Offline Capabilities
const CACHE_NAME = 'vsla-app-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline use
const urlsToCache = [
  '/',
  '/offline.html',
  '/api/member-session', // Cache the main dashboard API
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SW: Install complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activate complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('SW: Serving from cache:', event.request.url);
          return response;
        }

        // For API requests, try network first then cache
        if (event.request.url.includes('/api/')) {
          return fetch(event.request)
            .then((response) => {
              // Clone the response
              const responseToCache = response.clone();
              
              // Cache successful API responses
              if (response.status === 200) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            })
            .catch(() => {
              // Return cached API response if network fails
              return caches.match(event.request);
            });
        }

        // For non-API requests, try network then cache
        return fetch(event.request)
          .then((response) => {
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for form submissions when online
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'submit-savings') {
    event.waitUntil(processPendingSavings());
  } else if (event.tag === 'submit-loan') {
    event.waitUntil(processPendingLoans());
  }
});

// Process pending savings when back online
async function processPendingSavings() {
  try {
    const db = await openIndexedDB();
    const pendingData = await getAllPendingData(db, 'pendingSavings');
    
    for (const data of pendingData) {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.payload)
        });
        
        // Remove from pending after successful submission
        await deletePendingData(db, 'pendingSavings', data.id);
        console.log('SW: Savings submitted successfully');
      } catch (error) {
        console.log('SW: Failed to submit savings:', error);
      }
    }
  } catch (error) {
    console.log('SW: Background sync failed:', error);
  }
}

// Process pending loan applications when back online
async function processPendingLoans() {
  try {
    const db = await openIndexedDB();
    const pendingData = await getAllPendingData(db, 'pendingLoans');
    
    for (const data of pendingData) {
      try {
        await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.payload)
        });
        
        // Remove from pending after successful submission
        await deletePendingData(db, 'pendingLoans', data.id);
        console.log('SW: Loan application submitted successfully');
      } catch (error) {
        console.log('SW: Failed to submit loan application:', error);
      }
    }
  } catch (error) {
    console.log('SW: Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VSLA-OfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('pendingSavings')) {
        db.createObjectStore('pendingSavings', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingLoans')) {
        db.createObjectStore('pendingLoans', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingData(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingData(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}