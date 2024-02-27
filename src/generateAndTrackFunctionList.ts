import { promises as fs } from "fs";
import * as path from "path";
import * as ts from "typescript";

async function getAllFiles(
    dirPath: string,
    arrayOfFiles: string[] = [],
): Promise<string[]> {
    try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            if ((await fs.stat(fullPath)).isDirectory()) {
                // Skip node_modules directory
                if (file === "node_modules") {
                    continue;
                }
                arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        }
        return arrayOfFiles;
    } catch (error) {
        throw new Error(
            `Error while reading files in directory ${dirPath}: ${error}`,
        );
    }
}

interface NamedFunction {
    name: string;
    testFile?: string; // Optional property to store associated test file path
}

async function extractNamedFunctionsFromSource(
    sourceCode: string,
): Promise<Set<NamedFunction>> {
    try {
        const namedFunctions = new Set<NamedFunction>();
        const sourceFile = ts.createSourceFile(
            "temp.ts",
            sourceCode,
            ts.ScriptTarget.Latest,
        );

        function visit(node: ts.Node) {
            try {
                if (!node) {
                    console.log("Encountered undefined node");
                    return;
                }

                let functionName: string | null = null;
                let testFileAssociation: string | null = null;

                if (
                    ts.isFunctionDeclaration(node) &&
                    node.name &&
                    ts.isIdentifier(node.name)
                ) {
                    functionName = node.name.getText(sourceFile);
                } else if (
                    ts.isVariableDeclaration(node) &&
                    node.initializer &&
                    ts.isArrowFunction(node.initializer) &&
                    node.name &&
                    ts.isIdentifier(node.name)
                ) {
                    functionName = node.name.getText(sourceFile);
                }

                if (functionName) {
                    const leadingComments = ts.getLeadingCommentRanges(
                        sourceFile.getFullText(),
                        node.getFullStart(),
                    );
                    if (leadingComments) {
                        testFileAssociation = extractTestFileFromComments(
                            leadingComments,
                            sourceFile.getFullText(),
                        );
                    }
                    namedFunctions.add({
                        name: functionName,
                        ...(testFileAssociation && {
                            testFile: testFileAssociation,
                        }),
                    });
                }

                // Inserting new logic for broader AST parsing
                // New logic for handling method calls within the visit function
                if (
                    ts.isCallExpression(node) &&
                    ts.isPropertyAccessExpression(node.expression)
                ) {
                    const expression = node.expression;
                    const methodName = expression.name.getText(sourceFile);
                    const targetObject = expression.expression.getText(sourceFile);

                    // Example: Identifying Express route handlers (app.get, app.post, etc.)
                    if (
                        targetObject === "app" &&
                        ["get", "post", "put", "delete", "patch"].includes(
                            methodName,
                        )
                    ) {
                        let routePath = "";
                        if (
                            node.arguments.length > 0 &&
                            ts.isStringLiteral(node.arguments[0])
                        ) {
                            routePath = node.arguments[0].getText(sourceFile);
                        }
                        const handlerName = `${methodName.toUpperCase()}_handler_${routePath.replace(/\//g, "_")}`;

                        // Check for direct function (named or anonymous) as a handler
                        if (
                            node.arguments.length > 1 &&
                            (ts.isFunctionExpression(node.arguments[1]) ||
                                ts.isArrowFunction(node.arguments[1]))
                        ) {
                            namedFunctions.add({ name: handlerName }); // Or generate a unique name based on context
                        }
                    }
                }
                // End of new logic insertion
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

function extractTestFileFromComments(
    commentRanges: ts.CommentRange[],
    text: string,
): string | null {
    for (const range of commentRanges) {
        const commentText = text.substring(range.pos, range.end);
        const testFileMatch = commentText.match(/@tests: ([\S]+)/);
        if (testFileMatch) {
            return testFileMatch[1];
        }
    }
    return null;
}

async function generateFunctionListForCodebase(
    directoryPath: string,
): Promise<Set<NamedFunction>> {
    try {
        let allNamedFunctions = new Set<NamedFunction>();
        const allFiles = await getAllFiles(directoryPath);

        for (const file of allFiles) {
            if (file.endsWith(".ts")) {
                const content = await fs.readFile(file, "utf8");
                const fileFunctions =
                    await extractNamedFunctionsFromSource(content);
                fileFunctions.forEach((fnName) =>
                    allNamedFunctions.add(fnName),
                );
            }
        }

        return allNamedFunctions;
    } catch (error) {
        throw new Error(
            `Error while generating function list for codebase: ${error}`,
        );
    }
}

async function updateFunctionsListHistory(
    newFunctionsList: Set<NamedFunction>,
    currentPath: string,
    historyPath: string
): Promise<void> {
    try {
        let previousList: NamedFunction[] = [];
        try {
            const currentContent = await fs.readFile(currentPath, "utf8");
            previousList = JSON.parse(currentContent);
        } catch (error) {
            console.log(
                "No previous functions list found. Assuming this is the first run."
            );
        }

        // Convert the newFunctionsList set to an array to enable comparison
        const newFunctionArray = Array.from(newFunctionsList);

        // Filter out functions that exist both in previous and new function lists
        const added = newFunctionArray.filter(
            (fn) => !previousList.some((prevFn) => prevFn.name === fn.name)
        );
        const removed = previousList.filter(
            (prevFn) => !newFunctionArray.some((fn) => fn.name === prevFn.name)
        );

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
    functionsList: Set<NamedFunction>,
    filePath: string,
): Promise<void> {
    try {
        // Convert the set to an array and sort it alphabetically
        const sortedFunctions = Array.from(functionsList).sort();

        // Write the sorted functions list to the file
        await fs.writeFile(
            filePath,
            JSON.stringify(sortedFunctions, null, 2),
            "utf8",
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
            // "src/",
            "currentFunctionsList.json",
        );
        const functionsListHistoryPath = path.join(
            codebasePath,
            // "src/",
            "functionsListHistory.json",
        );

        const allNamedFunctions =
            await generateFunctionListForCodebase(codebasePath);
        await updateFunctionsListHistory(
            allNamedFunctions,
            currentFunctionsListPath,
            functionsListHistoryPath,
        );
        await writeFunctionsListToFile(
            allNamedFunctions,
            currentFunctionsListPath,
        );
        console.log("Named functions list and history updated.");
    } catch (error) {
        console.error("Error:", error);
    }
}

// Example usage
// Make sure the path used here correctly targets the src/ directory
const codebasePath =
    "/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test/src"; // Real path to your codebase
generateAndTrackFunctionList(codebasePath)
    .then(() => console.log("Function list generation and tracking completed."))
    .catch((error) => console.error("Error:", error));
