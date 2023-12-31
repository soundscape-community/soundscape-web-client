// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// Bump this when changing schema (e.g. adding an index)
const dbVersion = 1;
const dbName = 'TielCache';
const maxAgeMilliseconds = 604800000; // 1 week

// Function to open the IndexedDB database
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create object stores if not present
      if (!db.objectStoreNames.contains("urls")) {
        db.createObjectStore('urls', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains("features")) {
        db.createObjectStore('features', { keyPath: 'id', autoIncrement: true });
      }
      // Create feature indexes (should be harmless if they already exist)
      var objectStore = event.currentTarget.transaction.objectStore("features");
      objectStore.createIndex('tile', 'tile', { unique: false });
      objectStore.createIndex("osm_ids", "osm_ids", { multiEntry: true });
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(`Error opening database: ${event.target.error}`);
    };
  });
}

function clearObjectStore(objectStoreName) {
  var request = indexedDB.open(dbName);

  request.onsuccess = function (event) {
    var db = event.target.result;
    var transaction = db.transaction([objectStoreName], 'readwrite');
    var objectStore = transaction.objectStore(objectStoreName);

    // Clear all data in the object store
    var clearRequest = objectStore.clear();

    clearRequest.onsuccess = function () {
      console.log('Data cleared successfully.');
    };

    clearRequest.onerror = function (error) {
      console.error('Error clearing data:', error);
    };
  };

  request.onerror = function (error) {
    console.error('Error opening database:', error);
  };
}

const cache = {
  db: null, // to be populated on first request

  clear: function() {
    return clearObjectStore('features');
    return clearObjectStore('urls');
  },

  // Function to fetch a URL only if it hasn't been fetched for a certain duration
  fetch: function(url) {
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['urls'], 'readwrite');
      const objectStore = transaction.objectStore('urls');

      // Check if the URL is in the cache
      const getRequest = objectStore.get(url);

      getRequest.onsuccess = async (event) => {
        const result = event.target.result;

        if (result) {
          // Check if the cached entry is still valid based on maxAgeMilliseconds
          const currentTime = new Date().getTime();
          const lastFetchTime = result.lastFetchTime || 0;

          if (currentTime - lastFetchTime < maxAgeMilliseconds) {
            // URL is still fresh, resolve with the cached data
            console.log("HIT: ", url);
            // Assume data has already been handled when it was first cached
            //resolve(result.cachedData);
            return;
          }
        }

        // Fetch the URL since it's not in the cache or has expired
        console.log("MISS: ", url);
        try {
          const response = await fetch(url);
          const data = await response.json();

          const newTransaction = cache.db.transaction(['urls'], 'readwrite');
          const newObjectStore = newTransaction.objectStore('urls');

          // Update or add the URL in the cache with the current timestamp
          const putRequest = newObjectStore.put({
            url: url,
            lastFetchTime: new Date().getTime(),
            // No need to keep the data (the individual features should be
            // loaded into their own object store on first fetch)
            //cachedData: data,
          });

          putRequest.onsuccess = () => {
              console.log("Fetched: ", url)
              resolve(data);
          };

          putRequest.onerror = (event) => {
            reject(`Error updating cache: ${event.target.error}`);
          };
        } catch (error) {
          reject(`Error fetching URL: ${error}`);
        }
      };

      getRequest.onerror = (event) => {
        reject(`Error checking cache: ${event.target.error}`);
      };
    });
  },

  // Function to add GeoJSON feature to the cache
  addFeature: function(feature, tile) {
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['features'], 'readwrite');
      const objectStore = transaction.objectStore('features');

      // Add the tile information to the feature before storing it
      feature.tile = tile;

      const request = objectStore.add(feature);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  },

  getFeatures: async function(tile) {
    return new Promise(async (resolve, reject) => {
      if (!cache.db) {
        cache.db = await openDatabase();
      }
      const transaction = cache.db.transaction(['features'], 'readonly');
      const objectStore = transaction.objectStore('features');
      const tileIndex = objectStore.index('tile');

      const range = IDBKeyRange.only(tile.key);
      const request = tileIndex.openCursor(range);

      const features = [];

      request.onsuccess = function (event) {
        const cursor = event.target.result;

        if (cursor) {
          features.push(cursor.value);
          cursor.continue();
        } else {
          resolve(features);
        }
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }
}

export default cache;