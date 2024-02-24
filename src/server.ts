import express, { Request, Response } from "express";
// import { exec, spawn } from 'child_process';
import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import morgan from "morgan";
import { Server, createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app = express();
const appTest = express()
appTest.use(app) // make appTest use all the same middleware and endpoints as the app
const port = 3003;
console.log(process.env.CODEBASE_PATH);
const codebasePath =
    process.env.CODEBASE_PATH ||
    "/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test";
const httpServer = createServer(app);
const httpTestServer = createServer(appTest);
const devTestPath =
    "/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test"; // Adjust as necessary

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: "*", // Adjust according to your needs for CORS policy
    },
});

app.use(express.json());
app.use(express.text());
// Middleware to parse plain text body
app.use(express.text({ type: "text/plain" }));
// Morgan for endpoint api logging
app.use(morgan("tiny"));

const exec = promisify(execCallback);

async function executeScript(
    scriptContent: string,
    basePath: string,
    res: Response
) {
    const scriptFileName = `script-${Date.now()}.sh`;
    const scriptPath = path.join(basePath, scriptFileName);

    try {
        // Write the script file
        await fs.writeFile(scriptPath, scriptContent, "utf8");

        // Construct and execute the Docker command
        const dockerCommand = `docker run --rm -v "${basePath}:/app" script-runner:latest /app/${scriptFileName}`;
        const output = await exec(dockerCommand);

        // Send success response
        res.send({ message: "Script executed successfully.", output: output });
    } catch (error) {
        // Handle errors from both fs and execPromise
        console.error((error as Error).message);
        res.status(500).send({ error: (error as Error).message });
    } finally {
        // Clean up by deleting the script file, ignoring errors in cleanup
        try {
            await fs.unlink(scriptPath);
        } catch (error) {
            console.error(
                `Error deleting script file: ${(error as Error).message}`
            );
        }
    }
}

app.use(express.static("public"));
// Original script execution endpoint
app.post("/api/execute/script", async (req: Request, res: Response) => {
    const scriptContent = req.body.output;
    await executeScript(scriptContent, codebasePath, res);
});

// New endpoint for executing scripts in the dev-test repo
app.post("/api/execute/dev-script", async (req: Request, res: Response) => {
    const scriptContent = req.body.output;
    await executeScript(scriptContent, devTestPath, res);
});

// Endpoint for fetching the codebase tree
app.get("/api/codebase/tree", async (req, res) => {
    execCallback(
        `tree ${codebasePath} -I 'node_modules'`,
        { shell: "/bin/bash" },
        (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send({ error: stderr });
            }
            res.send(`<pre>${stdout}</pre>`);
        }
    );
});

// Endpoint for fetching file content
app.get("/api/codebase/file", async (req: Request, res: Response) => {
    const { filePath } = req.query;

    if (typeof filePath !== "string") {
        return res.status(400).send("Invalid file path");
    }

    try {
        const fullPath = path.join(codebasePath, filePath);
        const content = await fs.readFile(fullPath, { encoding: "utf-8" });
        res.type("text/plain").send(content);
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

// Endpoint for fetching git diff
app.get("/api/git/diff", async (req: Request, res: Response) => {
    execCallback(`git -C ${codebasePath} diff`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send({ error: stderr });
        }
        res.type("text/plain").send(stdout);
    });
});

// Placeholder for the functionality tracker endpoint
app.get("/api/functionality/tracker", async (req, res) => {
    res.status(501).send({
        message: "Functionality tracker not implemented yet.",
    });
});

// Updated endpoint to start the dev-test repo with health check and error handling
app.get("/api/dev-repo/start", async (req: Request, res: Response) => {
    const startCommand = "npm start";
    const devTestHealthCheckURL = "http://localhost:3003/health"; // Adjust the port as necessary

    execCallback(
        startCommand,
        { cwd: devTestPath },
        async (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                // Check if the error is due to the port already in use
                if (stderr.includes("EADDRINUSE")) {
                    // Optionally, check if the server is healthy even if the start command failed
                    const isHealthy = await checkHealth(devTestHealthCheckURL);
                    if (isHealthy) {
                        return res.status(200).send({
                            message:
                                "Dev-test repo is already running and healthy.",
                        });
                    }
                }
                return res
                    .status(500)
                    .send({
                        error: `Failed to start dev-test repo: ${stderr}`,
                    });
            }

            // After starting, poll for health check
            const success = await pollHealthCheck(
                devTestHealthCheckURL,
                5,
                2000
            ); // Retry 5 times, 2000ms apart
            if (success) {
                res.send({ message: "Dev-test repo started and is healthy." });
            } else {
                res.status(500).send({
                    error: "Dev-test repo started but failed health check.",
                });
            }
        }
    );
});

// Utility function to poll the health check endpoint
async function pollHealthCheck(
    url: string,
    retries: number,
    interval: number | undefined
) {
    for (let i = 0; i < retries; i++) {
        try {
            await axios.get(url);
            return true; // Server is healthy
        } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }
    return false; // Server did not become healthy in time
}

// Utility function to check health once
async function checkHealth(url: string) {
    try {
        await axios.get(url);
        return true; // Server is healthy
    } catch (error) {
        return false; // Server is not healthy
    }
}
// New endpoint for testing the dev-test repo (placeholder for now)
app.get("/api/dev-repo/test", async (req: Request, res: Response) => {
    // Placeholder: Implement actual test execution logic here
    // Placeholder: Additional simple placeholder added for demonstration purposes.
    res.send({ message: "Test execution not implemented yet." });
});

// Endpoint for checking the health of the dev-test repo
app.get("/api/dev-repo/health", async (req: Request, res: Response) => {
    const devTestHealthCheckURL = "http://localhost:3003/health"; // Adjust the port as necessary
    const isHealthy = await checkHealth(devTestHealthCheckURL);

    if (isHealthy) {
        res.send({ message: "Dev-test repo is healthy." });
    } else {
        res.status(500).send({ error: "Dev-test repo is not healthy." });
    }
});

// Healthcheck endpoint
app.get("/health", (req: Request, res: Response) => {
    res.status(200).send({ status: "ok" });
});

// Listen on the httpServer instead of the Express app directly
httpServer.listen(port, () => {
    console.log(`Server with Websockets running at http://localhost:${port}`);
});

export function startTestServer(testPort: Number): Promise<Server> {
    return new Promise((resolve, reject) => {
        const server = httpTestServer
            .listen(testPort, () => {
                console.log(`Test server started on port ${testPort}`);
                resolve(server);
            })
            .on("error", reject);
    });
}
