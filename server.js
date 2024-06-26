import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 8080;

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Proxy handler
const proxyHandler = async (req, res) => {
  try {
    const targetUrl = `https://tiles.soundscape.services${req.originalUrl}`;

    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "YourNewUserAgent",
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

// Fallback to serve the index.html for single-page applications
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
