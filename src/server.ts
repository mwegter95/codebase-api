import express, { Request, Response } from 'express';
import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan'

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
console.log(process.env.CODEBASE_PATH)
const codebasePath = process.env.CODEBASE_PATH || '/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test';
const devTestPath = '/Users/michaelwegter/Desktop/Projects/codebase-api-dev-test'; // Adjust as necessary


app.use(express.json());
app.use(express.text());
// Middleware to parse plain text body
app.use(express.text({ type: 'text/plain' }));
// Morgan for endpoint api logging
app.use(morgan('tiny'));

app.post('/api/execute/script', async (req: Request, res: Response) => {
    // Read script content from the "output" key in the JSON body
    const scriptContent = req.body.output;

    const scriptPath = path.join(codebasePath, `script-${Date.now()}.sh`);

    try {
        await fs.writeFile(scriptPath, scriptContent, 'utf8');
        
        // Check if the file was created
        const fileExists = await fs.access(scriptPath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false);

        if (!fileExists) {
            throw new Error('Failed to create script file.');
        }

        // Optional: Verify the file content (ensure it matches what was intended)
        const writtenContent = await fs.readFile(scriptPath, 'utf8');
        if (writtenContent !== scriptContent) {
            throw new Error('Script file content does not match expected content.');
        }

        // Proceed with executing the script inside Docker
        await new Promise((resolve, reject) => {
            const dockerCommand = `docker run --rm -v "${codebasePath}:/app" script-runner:latest /app/${path.basename(scriptPath)}`;
            exec(dockerCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    reject(new Error(stderr));
                    return;
                }
                resolve(stdout);
            });
        });

        // Send success response
        res.send({ message: "Script executed successfully." });

    } catch (error) {
        // Handle errors (file creation, Docker execution, etc.)
        res.status(500).send({ error: (error as Error).message });
    } finally {
        // Cleanup: Delete the script file after execution or in case of error
        try {
            await fs.unlink(scriptPath);
        } catch (unlinkError) {
            console.error(`Error deleting script file: ${(unlinkError as Error).message}`);
        }
    }
});// Refactored script execution function
async function executeScript(scriptContent: string, basePath: string, res: Response) {
    const scriptPath = path.join(basePath, `script-${Date.now()}.sh`);

    try {
        await fs.writeFile(scriptPath, scriptContent, 'utf8');

        const fileExists = await fs.access(scriptPath, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);

        if (!fileExists) {
            throw new Error('Failed to create script file.');
        }

        const dockerCommand = `docker run --rm -v "${basePath}:/app" script-runner:latest /app/${path.basename(scriptPath)}`;
        exec(dockerCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send({ error: stderr });
            }
            res.send({ message: "Script executed successfully.", output: stdout });
        });
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    } finally {
        try {
            await fs.unlink(scriptPath);
        } catch (unlinkError) {
            console.error(`Error deleting script file: ${(unlinkError as Error).message}`);
        }
    }
}

// Original script execution endpoint
app.post('/api/execute/script', async (req: Request, res: Response) => {
    const scriptContent = req.body.output;
    await executeScript(scriptContent, codebasePath, res);
});

// New endpoint for executing scripts in the dev-test repo
app.post('/api/execute/dev-script', async (req: Request, res: Response) => {
    const scriptContent = req.body.output;
    await executeScript(scriptContent, devTestPath, res);
});


// Endpoint for fetching the codebase tree
app.get('/api/codebase/tree', async (req, res) => {
    exec(`tree ${codebasePath} -I 'node_modules'`, {shell: "/bin/bash"}, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send({ error: stderr });
        }
        res.send(`<pre>${stdout}</pre>`);
    });
});

// Endpoint for fetching file content
app.get('/api/codebase/file', async (req: Request, res: Response) => {
    const { filePath } = req.query;

    if (typeof filePath !== 'string') {
        return res.status(400).send('Invalid file path');
    }

    try {
        const fullPath = path.join(codebasePath, filePath);
        const content = await fs.readFile(fullPath, { encoding: 'utf-8' });
        res.type('text/plain').send(content);
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

// Endpoint for fetching git diff
app.get('/api/git/diff', async (req: Request, res: Response) => {
    exec(`git -C ${codebasePath} diff`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send({ error: stderr });
        }
        res.type('text/plain').send(stdout);
    });
});

// Placeholder for the functionality tracker endpoint
app.get('/api/functionality/tracker', async (req, res) => {
    res.status(501).send({ message: 'Functionality tracker not implemented yet.' });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).send({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
