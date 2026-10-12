const axios = require("axios");
const https = require("https");
const { urlAPI } = require("./env");
const { header } = require("./header");

// Keep-alive socket reuse avoids a new TCP+TLS handshake for every Portainer call.
const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const api = axios.create({
  baseURL: urlAPI,
  headers: { ...header, "Accept-Encoding": "gzip, deflate" },
  httpsAgent: agent,
  timeout: 8000,
});

const ENV_TTL = Number(process.env.CACHE_ENV_TTL_MS) || 60_000;
const DATA_TTL = Number(process.env.CACHE_DATA_TTL_MS) || 15_000;
const STALE_MAX = Number(process.env.CACHE_STALE_MAX_MS) || 5 * 60_000;

const store = new Map(); // key -> { value, at }
const inflight = new Map(); // key -> Promise

/**
 * Cache with in-flight de-duplication: concurrent callers for the same key
 * share one upstream request. If the upstream fails, a previous value that is
 * younger than STALE_MAX is served instead of an error.
 */
const cached = async (key, ttl, loader) => {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;

  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, at: Date.now() });
      return value;
    } catch (err) {
      if (hit && Date.now() - hit.at < STALE_MAX) return hit.value;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
};

const getEndpoints = () =>
  cached("endpoints", ENV_TTL, async () => (await api.get("/endpoints")).data);

module.exports = { api, agent, cached, getEndpoints, DATA_TTL };
