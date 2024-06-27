import express from "express";
import morgan from "morgan";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 8080;

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log all requested URLs to the console.
app.use(morgan('dev'))

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Proxy handler
const proxyHandler = async (req, res) => {
  try {
    const targetUrl = `https://tiles.soundscape.services${req.originalUrl}`;

    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "soundscape-web-client/0.1 (dev server)",
      },
      responseType: "arraybuffer",
    });

    res.set({
      ...response.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(500).send("Proxy error");
  }
};

// Route for /tiles
app.use("/tiles/*", proxyHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
