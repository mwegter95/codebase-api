"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path = require("path");
var parser = require("@babel/parser");
var traverse_1 = require("@babel/traverse");
function getAllFiles(dirPath, arrayOfFiles) {
    if (arrayOfFiles === void 0) { arrayOfFiles = []; }
    return __awaiter(this, void 0, void 0, function () {
        var files, _i, files_1, file, fullPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.readdir(dirPath)];
                case 1:
                    files = _a.sent();
                    _i = 0, files_1 = files;
                    _a.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 7];
                    file = files_1[_i];
                    fullPath = path.join(dirPath, file);
                    return [4 /*yield*/, fs_1.promises.stat(fullPath)];
                case 3:
                    if (!(_a.sent()).isDirectory()) return [3 /*break*/, 5];
                    return [4 /*yield*/, getAllFiles(fullPath, arrayOfFiles)];
                case 4:
                    arrayOfFiles = _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    arrayOfFiles.push(fullPath);
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, arrayOfFiles];
            }
        });
    });
}
function extractNamedFunctionsFromSource(sourceCode) {
    return __awaiter(this, void 0, void 0, function () {
        var namedFunctions, ast;
        return __generator(this, function (_a) {
            namedFunctions = new Set();
            ast = parser.parse(sourceCode, {
                sourceType: "module",
                plugins: ["typescript", "classProperties", "decorators-legacy", "jsx"],
            });
            (0, traverse_1.default)(ast, {
                FunctionDeclaration: function (path) {
                    if (path.node.id) {
                        namedFunctions.add(path.node.id.name);
                    }
                },
                VariableDeclaration: function (path) {
                    path.node.declarations.forEach(function (declaration) {
                        var _a;
                        if (declaration.id.type === "Identifier" &&
                            ((_a = declaration.init) === null || _a === void 0 ? void 0 : _a.type) === "ArrowFunctionExpression") {
                            namedFunctions.add(declaration.id.name);
                        }
                    });
                },
                // Add more visitors as needed
            });
            return [2 /*return*/, namedFunctions];
        });
    });
}
function generateFunctionListForCodebase(directoryPath) {
    return __awaiter(this, void 0, void 0, function () {
        var allNamedFunctions, allFiles, _i, allFiles_1, file, content, fileFunctions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allNamedFunctions = new Set();
                    return [4 /*yield*/, getAllFiles(directoryPath)];
                case 1:
                    allFiles = _a.sent();
                    _i = 0, allFiles_1 = allFiles;
                    _a.label = 2;
                case 2:
                    if (!(_i < allFiles_1.length)) return [3 /*break*/, 6];
                    file = allFiles_1[_i];
                    if (!(file.endsWith(".js") || file.endsWith(".ts"))) return [3 /*break*/, 5];
                    return [4 /*yield*/, fs_1.promises.readFile(file, "utf8")];
                case 3:
                    content = _a.sent();
                    return [4 /*yield*/, extractNamedFunctionsFromSource(content)];
                case 4:
                    fileFunctions = _a.sent();
                    fileFunctions.forEach(function (fnName) { return allNamedFunctions.add(fnName); });
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, allNamedFunctions];
            }
        });
    });
}
function updateFunctionsListHistory(newFunctionsList, currentPath, historyPath) {
    return __awaiter(this, void 0, void 0, function () {
        var previousList, currentContent, error_1, added, removed, changes, history, _a, _b, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    previousList = [];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs_1.promises.readFile(currentPath, "utf8")];
                case 2:
                    currentContent = _c.sent();
                    previousList = JSON.parse(currentContent);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.log("No previous functions list found. Assuming this is the first run.");
                    return [3 /*break*/, 4];
                case 4:
                    added = Array.from(newFunctionsList).filter(function (fn) { return !previousList.includes(fn); });
                    removed = previousList.filter(function (fn) { return !newFunctionsList.has(fn); });
                    if (added.length === 0 && removed.length === 0) {
                        console.log("No changes in named functions detected.");
                        return [2 /*return*/]; // Exit if there are no changes to avoid unnecessary history entries
                    }
                    changes = {
                        timestamp: new Date().toISOString(),
                        added: added,
                        removed: removed,
                    };
                    history = [];
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs_1.promises.readFile(historyPath, "utf8")];
                case 6:
                    history = _b.apply(_a, [_c.sent()]);
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _c.sent();
                    console.log("Creating a new history file.");
                    return [3 /*break*/, 8];
                case 8:
                    history.push(changes);
                    return [4 /*yield*/, fs_1.promises.writeFile(historyPath, JSON.stringify(history, null, 2), "utf8")];
                case 9:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function writeFunctionsListToFile(functionsList, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.writeFile(filePath, JSON.stringify(Array.from(functionsList), null, 2), "utf8")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// The main function that orchestrates generating the functions list and updating history
function generateAndTrackFunctionList(codebasePath) {
    return __awaiter(this, void 0, void 0, function () {
        var currentFunctionsListPath, functionsListHistoryPath, allNamedFunctions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentFunctionsListPath = path.join(codebasePath, "currentFunctionsList.json");
                    functionsListHistoryPath = path.join(codebasePath, "functionsListHistory.json");
                    return [4 /*yield*/, generateFunctionListForCodebase(codebasePath)];
                case 1:
                    allNamedFunctions = _a.sent();
                    return [4 /*yield*/, updateFunctionsListHistory(allNamedFunctions, currentFunctionsListPath, functionsListHistoryPath)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, writeFunctionsListToFile(allNamedFunctions, currentFunctionsListPath)];
                case 3:
                    _a.sent();
                    console.log("Named functions list and history updated.");
                    return [2 /*return*/];
            }
        });
    });
}
// Example usage
var codebasePath = "/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test"; // Real path to your codebase
generateAndTrackFunctionList(codebasePath)
    .then(function () { return console.log("Function list generation and tracking completed."); })
    .catch(function (error) { return console.error("Error:", error); });
