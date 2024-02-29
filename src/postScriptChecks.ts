import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { generateAndTrackFunctionList } from "./generateAndTrackFunctionList";
import { runJestTests } from "./runTestsAndUpdate";

const execAsync = promisify(exec);

async function readJsonFile(filePath: string) {
    try {
        const data = await fs.readFile(filePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading JSON file at ${filePath}:`, error);
        throw new Error(`Failed to read JSON file at ${filePath}`);
    }
}

async function performPostScriptChecks(basePath: string) {
    // Step 1: Ensure all new functions have tests and functionality IDs
    const functionHasTestsAndIds = await ensureFunctionTestsAndIDs(basePath);

    // Step 2: Run new tests introduced by the script execution
    const newTestResults = await runNewTests(basePath);

    // Step 3: Validate existing functionality tests
    const existingTestResults = await validateExistingFunctionalityTests(
        basePath
    );

    // Combine and return the results
    return {
        functionHasTestsAndIds,
        newTestResults,
        existingTestResults,
    };
}

async function ensureFunctionTestsAndIDs(basePath: string) {
    // First, update the current functions list with the latest state of the codebase
    await generateAndTrackFunctionList(basePath);

    // Paths to the necessary JSON files
    const currentFunctionsListPath = path.join(
        basePath,
        "currentFunctionsList.json"
    );
    const functionalityTrackerPath = path.join(
        basePath,
        "functionalityTracker.json"
    );

    // Read and parse the updated lists
    const currentFunctions = await readJsonFile(currentFunctionsListPath);
    const functionalityTracker = await readJsonFile(functionalityTrackerPath);

    // Initialize structures to capture the status of checks
    let missingFunctionalityIDs = [];
    let missingTests = [];

    // Iterate over current functions to ensure each has a functionalityID and associated tests
    for (const functionName in currentFunctions) {
        const functionEntry = currentFunctions[functionName];
        if (!functionEntry.functionalityID) {
            missingFunctionalityIDs.push(functionName);
            continue;
        }

        const functionalityEntry =
            functionalityTracker[functionEntry.functionalityID];
        if (
            !functionalityEntry ||
            !functionalityEntry.tests ||
            functionalityEntry.tests.length === 0
        ) {
            missingTests.push(functionName);
        }
    }

    // Compile and return the check results
    let checkResults = {
        success:
            missingFunctionalityIDs.length === 0 && missingTests.length === 0,
        missingFunctionalityIDs: missingFunctionalityIDs,
        missingTests: missingTests,
    };

    return checkResults;
}

async function runNewTests(basePath: string) {
    // Placeholder for running new tests logic, possibly leveraging runJestTests from runTestsAndUpdate.ts
    const testResults = await runJestTests();
    return testResults; // Adjust as needed based on the actual return structure of runJestTests
}

async function validateExistingFunctionalityTests(basePath: string) {
    // Placeholder for logic to validate existing tests, can also leverage runJestTests with a filtered set of tests
    const testResults = await runJestTests(); // You might need to adjust runJestTests to accept parameters for specific tests
    return testResults; // Adjust based on actual return structure
}

export { performPostScriptChecks };
