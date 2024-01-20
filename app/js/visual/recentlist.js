// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const maxRecentCount = 25;

const recentCalloutsList = {
  elem: document.getElementById("recentCalloutsList"),

  clear: function() {
    recentCalloutsList.elem.innerHTML = '';
  },

  add: function(text, latitude, longitude) {
    // Construct new list item
    const newCallout = document.createElement('li');
    newCallout.textContent = text;
    newCallout.setAttribute('data-latitude', latitude);
    newCallout.setAttribute('data-longitude', longitude);

    // Insert at top of list
    recentCalloutsList.elem.insertBefore(newCallout, recentCalloutsList.elem.firstChild);
    // Keep the list to no more than maxRecentCount recent callouts
    if (recentCalloutsList.elem.children.length > maxRecentCount) {
      recentCalloutsList.elem.removeChild(recentCalloutsList.elem.lastChild);
    }
  }
};

export default recentCalloutsList;