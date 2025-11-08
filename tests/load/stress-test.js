// tests/load/stress-test.js
import http from "k6/http";
import { check, sleep } from "k6";

// Get the target URL from an environment variable, with a default for local testing
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Ramp up to 50 users over 1 minute
    { duration: "3m", target: 50 }, // Stay at 50 users for 3 minutes
    { duration: "1m", target: 100 },// Ramp up to 100 users over 1 minute
    { duration: "3m", target: 100 },// Stay at 100 users for 3 minutes
    { duration: "1m", target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    // 95% of requests should complete in under 500ms
    http_req_duration: ["p(95)<500"],
    // Less than 1% of requests should fail
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Test 1: Hit the public homepage
  const homeRes = http.get(BASE_URL);
  check(homeRes, {
    "Homepage is status 200": (r) => r.status === 200,
  });

  sleep(1);

  // Test 2: Hit the health check API endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "Health check is status 200": (r) => r.status === 200,
    "Health check responds with 'healthy'": (r) =>
      r.json("status") === "healthy",
  });

  sleep(1);
  
  // Test 3 (Example): Hit a public tRPC endpoint (health check)
  const trpcHealthRes = http.get(`${BASE_URL}/api/trpc/health`);
  check(trpcHealthRes, {
    "tRPC health check is status 200": (r) => r.status === 200,
  });

  sleep(1);
}
