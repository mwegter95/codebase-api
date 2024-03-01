import { promises as fs } from "fs";
import path from "path";
import { exec as execCallback } from "child_process";
import { startTestServer } from "./server";
// import axios from "axios";
import { promisify } from "util";
const exec = promisify(execCallback);

const trackerFilePath = path.join(__dirname, "functionalityTracker.json");
const historyFilePath = path.join(__dirname, "testHistory.json");
const TEST_PORT = 3111; // Specify a test-specific port

interface TestResult {
    functionalityID: string;
    status: string;
    message: string;
    duration: number;
}

interface HistoryData {
    [functionalityID: string]: string[];
}

async function readTrackerFile(): Promise<any> {
    try {
        const data = await fs.readFile(trackerFilePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading tracker file:", error);
        return {};
    }
}

async function writeTrackerFile(trackerData: any): Promise<void> {
    await fs.writeFile(
        trackerFilePath,
        JSON.stringify(trackerData, null, 2),
        "utf8"
    );
}

async function ensureHistoryFile(): Promise<HistoryData> {
    try {
        const historyJson = await fs.readFile(historyFilePath, "utf8");
        return JSON.parse(historyJson);
    } catch {
        // If the history file does not exist, initialize and create it
        console.log("History file not found, initializing a new one.");
        const initialData = {};
        await fs.writeFile(
            historyFilePath,
            JSON.stringify(initialData, null, 2),
            "utf8"
        );
        return initialData;
    }
}

async function appendTestHistory(
    functionalityID: string,
    testResult: TestResult
): Promise<void> {
    let historyData: HistoryData = {};
    try {
        const historyJson = await fs.readFile(historyFilePath, "utf8");
        historyData = JSON.parse(historyJson);
    } catch (error) {
        console.log("History file not found, creating a new one.");
    }

    // Initialize regressionDetected as 'No'
    let regressionDetected = "No";

    // Check the last result for this functionalityID, if it exists
    if (
        historyData[functionalityID] &&
        historyData[functionalityID].length > 0
    ) {
        const lastResultString = historyData[functionalityID][0];
        // Assuming the status is always formatted as "Status: passed" or "Status: failed" in the result string
        if (
            lastResultString.includes("Status: passed") &&
            testResult.status === "failed"
        ) {
            regressionDetected = "Yes";
        }
    }

    // Create the result string with all details, including regression detection
    const resultString = `${new Date().toISOString()}: Test '${
        testResult.functionalityID
    }' - Status: ${testResult.status}, Message: '${
        testResult.message
    }', Duration: ${
        testResult.duration
    }ms, Regression detected: ${regressionDetected}`;

    if (!historyData[functionalityID]) {
        historyData[functionalityID] = [];
    }

    // Prepend the new result to the history array
    historyData[functionalityID].unshift(resultString);

    // Write the updated history data back to the file
    await fs.writeFile(
        historyFilePath,
        JSON.stringify(historyData, null, 2),
        "utf8"
    );
}


export async function runJestTests() {
    try {
        // Await the server to start
        const server = await startTestServer(TEST_PORT);
        console.log("Server started, running tests...");
        // const baseURL = `http://localhost:${TEST_PORT}`;
        // let healthResultBeforeTests = await axios.get(`${baseURL}/health`);
        // console.log(healthResultBeforeTests, {healthResultBeforeTests})

        const command = `jest --json --outputFile=testResults.json`;

        // Run Jest tests
        const { stdout, stderr } = await exec(
            `jest --json --verbose --outputFile=testResults.json`
        );
        if (stderr) {
            console.log(stderr);
        }
        if (stdout) {
            console.log(stdout);
        }
        console.log("Jest tests completed");

        let jestResults;
        try {
            jestResults = JSON.parse(
                await fs.readFile("testResults.json", "utf8")
            );
        } catch (parseError) {
            console.error(`Error parsing Jest results: ${parseError}`);
            server.close(); // Ensure the server is closed on parsing error
            process.exit(1); // Exit with non-zero exit code
        }

        // console.log("Jest results:", jestResults);

        const trackerData = await readTrackerFile();

        if (!jestResults || !jestResults.testResults) {
            console.error("No test results found.");
            return;
        }

        for (const testSuite of jestResults.testResults) {
            for (const result of testSuite.assertionResults) {
                console.log("Processing test result:", result);

                const functionalityID = result.fullName.split(" ")[0];
                const testResult: TestResult = {
                    functionalityID,
                    status: result.status,
                    message: result.fullName,
                    duration: result.duration ?? 0,
                };

                const dynamicUpdate = {
                    LastTestResult:
                        testResult.status === "passed" ? "Passed" : "Failed",
                    LastTestTime: new Date().toISOString(),
                    LastTestOutput: testResult.message,
                    LastOutputMatchesExpected:
                        testResult.status === "passed" ? "Yes" : "No",
                    LastUpdated: new Date().toISOString(),
                };

                trackerData[functionalityID] = {
                    ...trackerData[functionalityID],
                    ...dynamicUpdate,
                };

                await appendTestHistory(functionalityID, testResult);
            }
        }

        await writeTrackerFile(trackerData);

        // Cleanup
        server.close(); // Close the server after processing test results
        console.log("Test server stopped.");

        try {
            await fs.unlink("testResults.json");
            console.log("Test results file cleaned up.");
            process.exit(0); // Exit with successful zero exit code
        } catch (cleanupError) {
            console.error(
                "Error during test results file cleanup:",
                cleanupError
            );
            process.exit(1); // Exit with non-zero exit code
        }
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1); // Exit with non-zero exit code
    }
}

runJestTests();
