import * as path from "path";
import { promises as fs } from "fs";
// import { generateAndTrackFunctionList } from "../generateAndTrackFunctionList";

// Mock data directory path
const mockDataDirPath = path.join(__dirname, "mockData");
const currentFunctionsListPath = path.join(
    mockDataDirPath,
    "currentFunctionsList.json"
);
const functionsListHistoryPath = path.join(
    mockDataDirPath,
    "functionsListHistory.json"
);

// Helper function to read JSON files
async function readJsonFile(filePath: string) {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
}

describe("generateAndTrackFunctionList", () => {
    beforeAll(async () => {
        // Setup: Clear any existing mock data files
        await fs.writeFile(
            currentFunctionsListPath,
            JSON.stringify([]),
            "utf8"
        );
        await fs.writeFile(
            functionsListHistoryPath,
            JSON.stringify([]),
            "utf8"
        );
    });

    it("should generate a list of named functions from the codebase", async () => {
        // Act: Run the script with the mock data directory
        await generateAndTrackFunctionList(mockDataDirPath);

        // Assert: Check if the currentFunctionsList.json file is populated
        const currentFunctionsList = await readJsonFile(
            currentFunctionsListPath
        );
        expect(currentFunctionsList).not.toHaveLength(0);
        expect(currentFunctionsList).toContain("exampleFunction"); // Replace 'exampleFunction' with actual function names expected
    });

    it("should update the functions list history correctly", async () => {
        // Act: Run the script a second time to trigger history update
        await generateAndTrackFunctionList(mockDataDirPath);

        // Assert: Check if the functionsListHistory.json file contains history
        const functionsListHistory = await readJsonFile(
            functionsListHistoryPath
        );
        expect(functionsListHistory).not.toHaveLength(0);
        expect(functionsListHistory[0]).toHaveProperty("timestamp");
        expect(functionsListHistory[0]).toHaveProperty("added");
        expect(functionsListHistory[0]).toHaveProperty("removed");
    });

    // Add more tests as needed for edge cases and other functionality
});
