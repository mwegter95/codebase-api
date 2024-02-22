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
    const data = await fs.readFile(trackerFilePath, 'utf8');
    return JSON.parse(data);
}

async function writeTrackerFile(trackerData: any): Promise<void> {
    await fs.writeFile(trackerFilePath, JSON.stringify(trackerData, null, 2), 'utf8');
}

async function appendTestHistory(functionalityID: string, testResult: TestResult): Promise<void> {
    // Initialize historyData with the correct type
    let historyData: HistoryData = {};
    try {
        const historyJson = await fs.readFile(historyFilePath, "utf8");
        historyData = JSON.parse(historyJson);
    } catch (error) {
        console.error("Error reading test history file:", error);
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
}

async function runJestTests() {
    exec('jest --json --outputFile=testResults.json', async (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing Jest tests:', stderr);
            return;
        }

        const jestResults = JSON.parse(await fs.readFile('testResults.json', 'utf8'));
        const trackerData = await readTrackerFile();

        jestResults.testResults.forEach((testSuite: any) => {
            testSuite.testResults.forEach((result: any) => {
                const functionalityID = result.ancestorTitles[0];
                const testResult: TestResult = {
                    functionalityID: functionalityID,
                    status: result.status,
                    message: result.title,
                    duration: result.duration,
                };

                if (!trackerData[functionalityID]) {
                    trackerData[functionalityID] = {};
                }

                const dynamicUpdate = {
                    LastTestResult: testResult.status === 'passed' ? 'Passed' : 'Failed',
                    LastTestTime: new Date().toISOString(),
                    LastTestOutput: testResult.message,
                    LastOutputMatchesExpected: testResult.status === 'passed' ? 'Yes' : 'No',
                    LastUpdated: new Date().toISOString(),
                };

                trackerData[functionalityID] = { ...trackerData[functionalityID], ...dynamicUpdate };

                appendTestHistory(functionalityID, testResult);
            });
        });

        await writeTrackerFile(trackerData);

        // Optionally, clean up the Jest result file
        await fs.unlink('testResults.json');
    });
}

runJestTests();
