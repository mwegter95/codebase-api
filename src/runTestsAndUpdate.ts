import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";

const trackerFilePath = path.join(__dirname, "functionalityTracker.json");
const historyFilePath = path.join(__dirname, "testHistory.json");

interface TestResult {
    functionalityID: string;
    status: string;
    message: string;
    duration: number;
}

interface HistoryData {
    [functionalityID: string]: TestResult[];
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

async function appendTestHistory(
    functionalityID: string,
    testResult: TestResult
): Promise<void> {
    try {
        let historyData: HistoryData = {};
        try {
            const historyJson = await fs.readFile(historyFilePath, "utf8");
            historyData = JSON.parse(historyJson);
        } catch (readError) {
            console.log("History file not found, creating a new one.");
        }

        if (!historyData[functionalityID]) {
            historyData[functionalityID] = [];
        }

        historyData[functionalityID].push(testResult);

        await fs.writeFile(
            historyFilePath,
            JSON.stringify(historyData, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("Error appending test history:", error);
    }
}

async function runJestTests() {
    const command = `jest --json --outputFile=testResults.json`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Jest tests: ${stderr}`);
            return;
        }

        let jestResults;
        try {
            jestResults = JSON.parse(
                await fs.readFile("testResults.json", "utf8")
            );
        } catch (parseError) {
            console.error(`Error parsing Jest results: ${parseError}`);
            return;
        }

        console.log("Jest results:", jestResults);

        const trackerData = await readTrackerFile();
        console.log("Tracker data:", trackerData);

        if (!jestResults || !jestResults.testResults) {
            console.error("No test results found.");
            return;
        }

        jestResults.testResults.forEach((testSuite: any) => {
            if (!testSuite.assertionResults) {
                console.error("No test results found for suite:", testSuite);
                return;
            }

            testSuite.assertionResults.forEach(async (result: any) => {
                console.log("Processing test result:", result);

                const functionalityID = result.fullName.split(" ")[0];
                const testResult: TestResult = {
                    functionalityID,
                    status: result.status,
                    message: result.fullName,
                    duration: result.duration ?? 0,
                };

                if (!trackerData[functionalityID]) {
                    console.error(
                        `Functionality ID ${functionalityID} not found in tracker.`
                    );
                    return;
                }

                // Update tracker data here based on testResult
                // This snippet assumes dynamicUpdate is properly defined elsewhere

                await appendTestHistory(functionalityID, testResult);
            });
        });

        await writeTrackerFile(trackerData);

        try {
            await fs.unlink("testResults.json");
            console.log("Test results file cleaned up.");
        } catch (cleanupError) {
            console.error(
                "Error during test results file cleanup:",
                cleanupError
            );
        }
    });
}

runJestTests();
