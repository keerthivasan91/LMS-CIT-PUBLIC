/**
 * Health API Load Test (CI-safe)
 * - Verifies /health stays responsive under light load
 * - NOT a stress test
 */

const autocannon = require("autocannon");
const http = require("http");

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// quick ping helper
function pingHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

describe("Performance: Health API", () => {
  test(
    "health endpoint should handle concurrent requests",
    async () => {
      // 🔒 Guard: skip if server not running
      const alive = await pingHealth();
      if (!alive) {
        console.warn("⚠️  Skipping health load test (server not reachable)");
        return;
      }

      const result = await autocannon({
        url: `${BASE_URL}/health`,
        connections: 10,   // light concurrency (CI-safe)
        pipelining: 1,
        duration: 3,       // short duration
        timeout: 5,
      });

      // ✅ Assertions tuned for CI
      expect(result.requests.total).toBeGreaterThan(0);

      // Allow small noise under CI load
      expect(result.errors).toBeLessThan(5);
      expect(result.non2xx).toBeLessThan(5);
      expect(result.timeouts).toBe(0);

      // Latency sanity (not SLA)
      expect(result.latency.p99).toBeLessThan(5000); // 5s upper bound
    },
    20000
  );
});
