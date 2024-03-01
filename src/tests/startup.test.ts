import fs from "fs";
import path from "path";
import axios from "axios";

const TEST_PORT = 3111; // Use the port your test server is running on
const baseURL = `http://localhost:${TEST_PORT}`;

describe("1-APPLICATION-STARTUP", () => {
    // Verify essential routes are registered
    it("Health check endpoint is accessible", async () => {
        const response = await axios.get(`${baseURL}/health`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("status", "ok");
    });

    // Check for the existence and content length of functionalityTracker.json
    it("functionalityTracker.json exists and is not empty", () => {
        const trackerPath = path.join(
            __dirname,
            "../functionalityTracker.json"
        );
        expect(fs.existsSync(trackerPath)).toBe(true);
        const trackerContent = fs.readFileSync(trackerPath, "utf8");
        expect(trackerContent.length).toBeGreaterThan(0);
    });

    // Check for the existence and content length of testHistory.json
    it("testHistory.json exists and is not empty", () => {
        const historyPath = path.join(__dirname, "../testHistory.json");
        expect(fs.existsSync(historyPath)).toBe(true);
        const historyContent = fs.readFileSync(historyPath, "utf8");
        expect(historyContent.length).toBeGreaterThan(0);
    });
});
