# Soundscape Web Client

Experimenting with porting Soundscape functionality to JavaScript, to run in a Web browser.

## Live Demo

https://soundscape-community.github.io/soundscape-web-client/

To use a location other than what's reported by your device, include the latitude, longitude, and compass heading (degrees from north) in the URL, e.g. https://soundscape-community.github.io/soundscape-web-client/?lon=-77.006156&lat=38.897600&heading=0.0 will place you near Union Station in Washington, D.C.

## Running locally

1. Launch a Soundscape-compatible tile server, such as [Overscape](https://github.com/soundscape-community/overscape-server).
    a. The server needs to include the proper [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) to allow API calls from other domains (Overscape does this by default).
2. Run a web server, such as live-server, in the working directory. Make sure you specify a port that doesn't conflict with the tile server.
    ```
    $ npm install live-server
    $ live-server --port=8081 .
    ```