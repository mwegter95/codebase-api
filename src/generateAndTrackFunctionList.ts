import { promises as fs } from "fs";
import * as path from "path";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

async function getAllFiles(
    dirPath: string,
    arrayOfFiles: string[] = []
): Promise<string[]> {
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
}

async function extractNamedFunctionsFromSource(
    sourceCode: string
): Promise<Set<string>> {
    const namedFunctions = new Set<string>();
    const ast = parser.parse(sourceCode, {
        sourceType: "module",
        plugins: ["typescript", "classProperties", "decorators-legacy", "jsx"],
    });

    traverse(ast, {
        FunctionDeclaration(path) {
            if (path.node.id) {
                namedFunctions.add(path.node.id.name);
            }
        },
        VariableDeclaration(path) {
            path.node.declarations.forEach((declaration) => {
                if (
                    declaration.id.type === "Identifier" &&
                    declaration.init?.type === "ArrowFunctionExpression"
                ) {
                    namedFunctions.add(declaration.id.name);
                }
            });
        },
        // Add more visitors as needed
    });

    return namedFunctions;
}

async function generateFunctionListForCodebase(
    directoryPath: string
): Promise<Set<string>> {
    let allNamedFunctions = new Set<string>();
    const allFiles = await getAllFiles(directoryPath);

    for (const file of allFiles) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
            const content = await fs.readFile(file, "utf8");
            const fileFunctions = await extractNamedFunctionsFromSource(
                content
            );
            fileFunctions.forEach((fnName) => allNamedFunctions.add(fnName));
        }
    }

    return allNamedFunctions;
}

async function updateFunctionsListHistory(
    newFunctionsList: Set<string>,
    currentPath: string,
    historyPath: string
): Promise<void> {
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
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2), "utf8");
}

async function writeFunctionsListToFile(
    functionsList: Set<string>,
    filePath: string
): Promise<void> {
    await fs.writeFile(
        filePath,
        JSON.stringify(Array.from(functionsList), null, 2),
        "utf8"
    );
}

// The main function that orchestrates generating the functions list and updating history
async function generateAndTrackFunctionList(codebasePath: string) {
    const currentFunctionsListPath = path.join(
        codebasePath,
        "currentFunctionsList.json"
    );
    const functionsListHistoryPath = path.join(
        codebasePath,
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
    await writeFunctionsListToFile(allNamedFunctions, currentFunctionsListPath);
    console.log("Named functions list and history updated.");
}

// Example usage
const codebasePath =
    "/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test"; // Real path to your codebase
generateAndTrackFunctionList(codebasePath)
    .then(() => console.log("Function list generation and tracking completed."))
    .catch((error) => console.error("Error:", error));
