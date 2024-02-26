import { promises as fs } from "fs";
import * as path from "path";
import * as ts from "typescript";

async function getAllFiles(
    dirPath: string,
    arrayOfFiles: string[] = []
): Promise<string[]> {
    try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            if ((await fs.stat(fullPath)).isDirectory()) {
                arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        }
        return arrayOfFiles;
    } catch (error) {
        throw new Error(
            `Error while reading files in directory ${dirPath}: ${error}`
        );
    }
}

async function extractNamedFunctionsFromSource(
    sourceCode: string
): Promise<Set<string>> {
    try {
        const namedFunctions = new Set<string>();
        const sourceFile = ts.createSourceFile(
            "temp.ts",
            sourceCode,
            ts.ScriptTarget.Latest
        );

        function visit(node: ts.Node) {
            try {
                if (!node) {
                    console.log("Encountered undefined node");
                    return;
                }

                // console.log("Visiting node of type:", ts.SyntaxKind[node.kind]);

                if (
                    ts.isFunctionDeclaration(node) &&
                    node.name &&
                    ts.isIdentifier(node.name)
                ) {
                    namedFunctions.add(node.name.getText(sourceFile));
                } else if (
                    ts.isVariableDeclaration(node) &&
                    node.name &&
                    ts.isIdentifier(node.name)
                ) {
                    if (
                        node.initializer &&
                        ts.isArrowFunction(node.initializer)
                    ) {
                        namedFunctions.add(node.name.getText(sourceFile));
                    }
                }
                ts.forEachChild(node, visit);
            } catch (error) {
                console.error("Error while visiting node:", error);
            }
        }

        ts.forEachChild(sourceFile, visit);
        return namedFunctions;
    } catch (error) {
        throw new Error(`Error while extracting named functions: ${error}`);
    }
}





async function generateFunctionListForCodebase(
    directoryPath: string
): Promise<Set<string>> {
    try {
        let allNamedFunctions = new Set<string>();
        const allFiles = await getAllFiles(directoryPath);

        for (const file of allFiles) {
            if (file.endsWith(".ts")) {
                const content = await fs.readFile(file, "utf8");
                const fileFunctions = await extractNamedFunctionsFromSource(
                    content
                );
                fileFunctions.forEach((fnName) =>
                    allNamedFunctions.add(fnName)
                );
            }
        }

        return allNamedFunctions;
    } catch (error) {
        throw new Error(
            `Error while generating function list for codebase: ${error}`
        );
    }
}

async function updateFunctionsListHistory(
    newFunctionsList: Set<string>,
    currentPath: string,
    historyPath: string
): Promise<void> {
    try {
        let previousList: string[] = [];
        try {
            const currentContent = await fs.readFile(currentPath, "utf8");
            previousList = JSON.parse(currentContent);
        } catch (error) {
            console.log(
                "No previous functions list found. Assuming this is the first run."
            );
        }

        const added = Array.from(newFunctionsList).filter(
            (fn) => !previousList.includes(fn)
        );
        const removed = previousList.filter((fn) => !newFunctionsList.has(fn));

        if (added.length === 0 && removed.length === 0) {
            console.log("No changes in named functions detected.");
            return; // Exit if there are no changes to avoid unnecessary history entries
        }

        const changes = {
            timestamp: new Date().toISOString(),
            added,
            removed,
        };

        let history = [];
        try {
            history = JSON.parse(await fs.readFile(historyPath, "utf8"));
        } catch (error) {
            console.log("Creating a new history file.");
        }

        history.push(changes);
        await fs.writeFile(
            historyPath,
            JSON.stringify(history, null, 2),
            "utf8"
        );
    } catch (error) {
        throw new Error(
            `Error while updating functions list history: ${error}`
        );
    }
}

async function writeFunctionsListToFile(
    functionsList: Set<string>,
    filePath: string
): Promise<void> {
    try {
        // Convert the set to an array and sort it alphabetically
        const sortedFunctions = Array.from(functionsList).sort();

        // Write the sorted functions list to the file
        await fs.writeFile(
            filePath,
            JSON.stringify(sortedFunctions, null, 2),
            "utf8"
        );
    } catch (error) {
        throw new Error(`Error while writing functions list to file: ${error}`);
    }
}

// The main function that orchestrates generating the functions list and updating history
async function generateAndTrackFunctionList(codebasePath: string) {
    try {
        const currentFunctionsListPath = path.join(
            codebasePath,
            "src/",
            "currentFunctionsList.json"
        );
        const functionsListHistoryPath = path.join(
            codebasePath,
            "src/",
            "functionsListHistory.json"
        );

        const allNamedFunctions = await generateFunctionListForCodebase(
            codebasePath
        );
        await updateFunctionsListHistory(
            allNamedFunctions,
            currentFunctionsListPath,
            functionsListHistoryPath
        );
        await writeFunctionsListToFile(
            allNamedFunctions,
            currentFunctionsListPath
        );
        console.log("Named functions list and history updated.");
    } catch (error) {
        console.error("Error:", error);
    }
}

// Example usage
const codebasePath =
    "/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test"; // Real path to your codebase
generateAndTrackFunctionList(codebasePath)
    .then(() => console.log("Function list generation and tracking completed."))
    .catch((error) => console.error("Error:", error));
