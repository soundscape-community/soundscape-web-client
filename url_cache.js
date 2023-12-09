// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// Function to open the IndexedDB database
function openURLCache() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('URLCache', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('urls', { keyPath: 'url' });
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

// Function to fetch a URL only if it hasn't been fetched for a certain duration
async function fetchUrlIfNotCached(url, maxAgeInMilliseconds) {
  const db = await openURLCache();

  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction(['urls'], 'readwrite');
    const objectStore = transaction.objectStore('urls');

    // Check if the URL is in the cache
    const getRequest = objectStore.get(url);

    getRequest.onsuccess = async (event) => {
      const result = event.target.result;

      if (result) {
        // Check if the cached entry is still valid based on maxAgeInMilliseconds
        const currentTime = new Date().getTime();
        const lastFetchTime = result.lastFetchTime || 0;

        if (currentTime - lastFetchTime < maxAgeInMilliseconds) {
          // URL is still fresh, resolve with the cached data
          console.log("HIT: ", url);
          //resolve(result.cachedData);
          return;
        }
      }

      // Fetch the URL since it's not in the cache or has expired
      console.log("MISS: ", url);
      try {
        const response = await fetch(url);
        const data = await response.json();

        const newTransaction = db.transaction(['urls'], 'readwrite');
        const newObjectStore = newTransaction.objectStore('urls');

        // Update or add the URL in the cache with the current timestamp
        const putRequest = newObjectStore.put({
          url: url,
          lastFetchTime: new Date().getTime(),
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
}

function clearURLCache() {
  return cleanDatabase('URLCache', 'urls');
}

function cleanDatabase(dbName, objectStoreName) {
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