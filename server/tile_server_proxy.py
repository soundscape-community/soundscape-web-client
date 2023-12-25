# Copyright (c) Daniel W. Steinbrook.
# with many thanks to ChatGPT

"""
This script runs a server that proxies requests to a tile server. It is
necessary because CORS headers are required by modern browsers to allow
the web client to issue API requests from a different domain.
"""

import aiohttp
from aiohttp import web

async def proxy_handler(request):
    target_url = "https://tiles.soundscape.services"

    # Construct the target URL by appending the path from the original request
    target_url += request.rel_url.path_qs

    async with aiohttp.ClientSession() as session:
        async with session.get(target_url, headers={'User-Agent': 'YourNewUserAgent'}) as response:
            # Read the content from the target server's response
            content = await response.read()

            # Create a new response with the same content but different headers
            proxy_response = web.Response(body=content, status=response.status, headers=response.headers)

            # Add CORS headers to allow requests from any domain
            proxy_response.headers['Access-Control-Allow-Origin'] = '*'
            proxy_response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            proxy_response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

            return proxy_response

app = web.Application()
app.router.add_route('*', '/{path:.*}', proxy_handler)

if __name__ == '__main__':
    web.run_app(app)