# Soundscape Web Client

All your favorite features of the Soundscape app for iOS, running in the browser of your choice.

Try it for yourself! https://soundscape-community.github.io/soundscape-web-client/

![Screenshot of Soundscape web client](screenshots/main_view.png)

## Tools for development and debugging

### Activity simulator

![Screenshot of GPX file replay view](screenshots/gpx_replay_view.png)

Select a local GPX file from your computer, and it will be replayed on a visual map with audio callouts.

https://soundscape-community.github.io/soundscape-web-client/replay_gpx.html

### Location override
To use a location other than what's reported by your device, include the latitude, longitude, and compass heading (degrees from north) in the URL, e.g. https://soundscape-community.github.io/soundscape-web-client/?lon=-77.006156&lat=38.897600&heading=0.0 will place you near Union Station in Washington, D.C.

## Running locally
1. Install the Python dependencies, and run the tile server proxy.
    ```
    $ cd server
    $ python -m venv env
    $ . env/bin/activate
    $ pip install -r requirements.txt
    $ python tile_server_proxy.py
    ```
2. Run a web server, such as live-server, in the working directory. Make sure you specify a port that doesn't conflict with the tile server proxy.
    ```
    $ npm install live-server
    $ live-server --port=8081 .
    ```

## Third-party libraries used
1. [Turf.js](https://turfjs.org/) (for GeoJSON processingand geospatial calculations)
2. [Leaflet](https://leafletjs.com/) (provides OpenStreetMap widget)
3. [unmute](https://github.com/swevans/unmute) (improved web audio behavior on iOS)
