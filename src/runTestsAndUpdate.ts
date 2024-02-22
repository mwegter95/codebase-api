import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';

const trackerFilePath = path.join(__dirname, 'functionalityTracker.json');
const historyFilePath = path.join(__dirname, 'testHistory.json');

interface TestResult {
    functionalityID: string;
    status: string;
    message: string;
    duration: number;
}

// Define the type for the history data object
interface HistoryData {
    [functionalityID: string]: TestResult[];
}

async function readTrackerFile(): Promise<any> {
    try {
        const data = await fs.readFile(trackerFilePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading tracker file:", error);
        return {}; // Return empty object if file does not exist or cannot be read
    }
}

async function writeTrackerFile(trackerData: any): Promise<void> {
    await fs.writeFile(trackerFilePath, JSON.stringify(trackerData, null, 2), 'utf8');
}

async function appendTestHistory(
    functionalityID: string,
    testResult: TestResult
): Promise<void> {
    try {
        let historyData: HistoryData = {};
        const historyJson = await fs.readFile(historyFilePath, "utf8");
        if (historyJson) {
            historyData = JSON.parse(historyJson);
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
    const outputDirectory = path.join(__dirname, "..", "src"); // Adjust the path as necessary
    const testResultsPath = path.join(outputDirectory, "testResults.json");
    const command = `jest --json --outputFile=${testResultsPath} --outputDirectory=${outputDirectory}`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error("Error executing Jest tests:", stderr);
            return;
        }

        const jestResults = JSON.parse(
            await fs.readFile(testResultsPath, "utf8")
        );

        console.log("Jest results:", jestResults); // Debug console log

        const trackerData = await readTrackerFile();

        console.log("Tracker data:", trackerData); // Debug console log

        if (!jestResults || !jestResults.testResults) {
            console.error("No test results found.");
            return;
        }

        jestResults.testResults.forEach((testSuite: any) => {
            if (!testSuite.testResults) {
                console.error("No test results found for suite:", testSuite);
                return;
            }

            testSuite.testResults.forEach((result: any) => {
                console.log("Processing test result:", result); // Debug console log

                const functionalityID = result.ancestorTitles[0];
                const testResult: TestResult = {
                    functionalityID: functionalityID,
                    status: result.status,
                    message: result.title,
                    duration: result.duration,
                };

                if (!trackerData) {
                    console.error("Tracker data is undefined.");
                    return;
                }

                if (!trackerData[functionalityID]) {
                    trackerData[functionalityID] = {};
                }

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

                appendTestHistory(functionalityID, testResult);
            });
        });

        await writeTrackerFile(trackerData);

        // Optionally, clean up the Jest result file
        await fs.unlink("testResults.json");
    });
}

runJestTests();
