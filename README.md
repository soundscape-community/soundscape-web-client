# Soundscape Web Client

Experimenting with porting Soundscape functionality to JavaScript, to run in a Web browser.

## Live Demo

### GPX replay
Select a local GPX file from your computer, and it will be replayed on a visual map with audio callouts.

https://soundscape-community.github.io/soundscape-web-client/replay_gpx.html

### Places Near Me
Announce points of interest around your actual location.

https://soundscape-community.github.io/soundscape-web-client/

To use a location other than what's reported by your device, include the latitude, longitude, and compass heading (degrees from north) in the URL, e.g. https://soundscape-community.github.io/soundscape-web-client/?lon=-77.006156&lat=38.897600&heading=0.0 will place you near Union Station in Washington, D.C.

#### Gotchas on iOS Safari

If things aren't behaving properly in Safari on iOS:
1. Make sure location services are enabled for Safari, under Settings > Privacy & Security > Location Services > Safari.
2. If you're not using headphones, make sure your device is not set to silent.

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
