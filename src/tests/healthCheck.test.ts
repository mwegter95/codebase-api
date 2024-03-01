import axios from "axios";

const TEST_PORT = process.env.TEST_PORT || 3111; // Fallback to a default test port if not set
const baseURL = `http://localhost:${TEST_PORT}`;

describe("2-HEALTHCHECK-URL", () => {
    it("Health check endpoint returns 200 OK", async () => {
        const response = await axios.get(`${baseURL}/health`);
        expect(response.status).toBe(200);
        // Optionally, verify the response body if your health check returns specific data
        expect(response.data).toHaveProperty('status', 'ok');
    });
});
