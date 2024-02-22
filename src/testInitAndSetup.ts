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

async function initTestFromFiles(filePaths: string[]) {
    for (const filePath of filePaths) {
        const absolutePath = path.resolve(filePath);
        const fileContents = await fs.readFile(absolutePath, "utf8");
        const testData = JSON.parse(fileContents);

        // Assuming you have a function like this to handle the test data
        await initTest(testData.FunctionalityID, testData);
    }
}

// Assuming process.argv[2] and process.argv[3] are the paths to your JSON files
const filePaths = process.argv.slice(2);
initTestFromFiles(filePaths).catch(console.error);

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

// Example usage with sh script
/*
#!/bin/bash
echo "Starting script execution..."

# Write the JSON data to temporary files
echo '{"FunctionalityID":"1-APPLICATION-STARTUP","TestFileLocation":"./tests/startup.test.ts","ExpectedTestOutput":"Application starts successfully","TestFrequency":"On Commit","Priority":"High","Notes":"Critical for application functionality"}' > testInitData1.json
echo '{"FunctionalityID":"2-HEALTHCHECK-URL","TestFileLocation":"./tests/healthCheck.test.ts","ExpectedTestOutput":"Health check endpoint returns 200 OK","Dependencies":["Express server running"],"TestFrequency":"On Commit","Priority":"High","Notes":"Ensures the health check endpoint is responsive"}' > testInitData2.json

# Check JSON format in temporary files
if ! jq empty testInitData1.json || ! jq empty testInitData2.json; then
  echo "JSON formatting error detected in temporary files."
  exit 1
else
  echo "JSON files formatted correctly."
fi

# Execute the TypeScript script with the file paths
ts-node src/testInitAndSetup.ts ./testInitData1.json ./testInitData2.json

echo "Printing the contents of the functionality tracker file..."
cat src/functionalityTracker.json
echo "Check above for new entries. Script execution completed successfully."
*/
