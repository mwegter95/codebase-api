import { promises as fs } from "fs";
import path from "path";

const trackerFilePath = path.join(__dirname, "functionalityTracker.json");

interface TestDetail {
    TestFileLocation?: string;
    ExpectedTestOutput?: string;
    Dependencies?: string[];
    TestFrequency?: string;
    Priority?: string;
    Notes?: string;
}

interface TestTracker {
    [key: string]: {
        FunctionalityID: string;
    } & TestDetail;
}

async function initTest(
    functionalityID: string,
    testDetails: TestDetail
): Promise<void> {
    let trackerData: TestTracker;

    try {
        const data = await fs.readFile(trackerFilePath, "utf8");
        trackerData = JSON.parse(data);
    } catch (error) {
        console.error("Could not read tracker file:", error);
        trackerData = {};
    }

    // Initialize if not present or merge with existing details
    const existingDetails = trackerData[functionalityID] || {
        FunctionalityID: functionalityID,
    };
    trackerData[functionalityID] = { ...existingDetails, ...testDetails };

    await fs.writeFile(
        trackerFilePath,
        JSON.stringify(trackerData, null, 2),
        "utf8"
    );
    console.log(`Test details for ${functionalityID} updated.`);
}

async function initTestFromCLI() {
    // The first two arguments are 'node' and the script name, so we skip them
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("No arguments provided.");
        return;
    }

    // Expecting arguments in pairs: [functionalityID, testDetailsPath]
    for (let i = 0; i < args.length; i += 2) {
        const functionalityID = args[i];
        const testDetailsPath = args[i + 1];
        const testDetails = require(path.resolve(testDetailsPath));

        await initTest(functionalityID, testDetails);
    }
}

initTestFromCLI();

// Example usage
// Only the fields you want to add or update need to be specified
/*
initTest("1-APPLICATION-STARTUP", {
    TestFileLocation: "./tests/startup.test.ts",
    ExpectedTestOutput: "Application starts successfully",
});

initTest("2-HEALTHCHECK-URL", {
    Dependencies: ["Express server running"],
    Notes: "Checks if health endpoint responds correctly.",
});
*/

// Example usage with all fields
/*
initTest('1-APPLICATION-STARTUP', {
    FunctionalityID: '1-APPLICATION-STARTUP',
    TestFileLocation: './tests/startup.test.ts',
    ExpectedTestOutput: 'Application starts successfully',
    TestFrequency: 'On Commit',
    Priority: 'High',
    Notes: 'Critical for application functionality',
});

initTest('2-HEALTHCHECK-URL', {
    FunctionalityID: '2-HEALTHCHECK-URL',
    TestFileLocation: './tests/healthCheck.test.ts',
    ExpectedTestOutput: 'Health check endpoint returns 200 OK',
    Dependencies: ['Express server running'],
    TestFrequency: 'On Commit',
    Priority: 'High',
    Notes: 'Ensures the health check endpoint is responsive',
});
*/