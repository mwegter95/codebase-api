import { promises as fs } from "fs";
import * as path from "path";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

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
        const ast = parser.parse(sourceCode, {
            sourceType: "module",
            plugins: [
                "typescript",
                "classProperties",
                "decorators-legacy",
                "jsx",
            ],
        });

        traverse(ast, {
            FunctionDeclaration(path) {
                try {
                    if (path.node.id) {
                        namedFunctions.add(path.node.id.name);
                    }
                } catch (error) {
                    throw new Error(
                        `Error while extracting function name: ${error}`
                    );
                }
            },
            VariableDeclaration(path) {
                try {
                    path.node.declarations.forEach((declaration) => {
                        if (
                            declaration.id.type === "Identifier" &&
                            declaration.init?.type === "ArrowFunctionExpression"
                        ) {
                            namedFunctions.add(declaration.id.name);
                        }
                    });
                } catch (error) {
                    throw new Error(
                        `Error while extracting variable name: ${error}`
                    );
                }
            },
            // Add more visitors as needed
        });

        return namedFunctions;
    } catch (error) {
        throw new Error(`Error while traversing AST: ${error}`);
    }
}


async function generateFunctionListForCodebase(
    directoryPath: string
): Promise<Set<string>> {
    try {
        let allNamedFunctions = new Set<string>();
        const allFiles = await getAllFiles(directoryPath);

        for (const file of allFiles) {
            if (file.endsWith(".js") || file.endsWith(".ts")) {
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
        await fs.writeFile(
            filePath,
            JSON.stringify(Array.from(functionsList), null, 2),
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
