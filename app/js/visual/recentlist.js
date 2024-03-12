// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createBeacon } from '../audio/notabeacon.js';

const maxRecentCount = 25;

function createRecentCalloutList(locationProvider, audioQueue) {
  let activeBeacon = null;

  const beaconControls = {
    init: (parentElem) => {
      //<p><button id="toggleBeacon">⏸</button> <span id="currentBeacon">...</span></p>
      const p = document.createElement('p');
      const toggleBeacon = document.createElement('button');
      toggleBeacon.setAttribute('id', 'toggleBeacon');
      toggleBeacon.innerText = '⏸';
      p.appendChild(toggleBeacon);
      const span = document.createElement('span');
      span.setAttribute('id', 'currentBeacon');
      p.appendChild(span);
      parentElem.insertBefore(p, parentElem.firstChild);

      toggleBeacon.addEventListener('click', (e) => {
        if (e.target.innerText == '⏸') {
          activeBeacon.stop();
          e.target.innerText = '▶';
        } else {
          activeBeacon.start();
          e.target.innerText = '⏸';
        }
      });
    },

    update: (text) => {
      document.getElementById('currentBeacon').innerText = ' ' + text;
      document.getElementById('toggleBeacon').innerText = '⏸';
    },
  }

  const recentCalloutsList = {
    elem: document.getElementById("recentCalloutsList"),

    clear: function() {
      recentCalloutsList.elem.innerHTML = '';
    },

    add: function(text, latitude, longitude) {
      // Construct new list item
      const newCallout = document.createElement('li');
      newCallout.innerHTML = ' ' + text;
      const beaconLink = document.createElement('button');
      beaconLink.innerHTML = '🔊';
      beaconLink.title = 'Start beacon';
      beaconLink.classList.add('beacon-button');
      newCallout.insertBefore(beaconLink, newCallout.firstChild);

      beaconLink.addEventListener('click', () => {
        if (activeBeacon) {
          activeBeacon.stop();
        } else {
          beaconControls.init(document.getElementById('recentCalloutsArea'));
        }
        activeBeacon = createBeacon(latitude, longitude, locationProvider, audioQueue);
        activeBeacon.start();
        beaconControls.update(text);
      })

      // Insert at top of list
      recentCalloutsList.elem.insertBefore(newCallout, recentCalloutsList.elem.firstChild);
      // Keep the list to no more than maxRecentCount recent callouts
      if (recentCalloutsList.elem.children.length > maxRecentCount) {
        recentCalloutsList.elem.removeChild(recentCalloutsList.elem.lastChild);
      }
    }
  };

  return recentCalloutsList;
}

export default createRecentCalloutList;