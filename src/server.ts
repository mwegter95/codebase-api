import express, { Request, Response } from 'express';
import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const codebasePath = process.env.CODEBASE_PATH || './';

app.use(express.json());
app.use(express.text());

// Endpoint for executing scripts securely
app.post('/api/execute/script', async (req: Request, res: Response) => {
    const scriptContent = req.body;
    const scriptPath = path.join(codebasePath, `script-${Date.now()}.sh`);

    try {
        await fs.writeFile(scriptPath, scriptContent);
        await fs.chmod(scriptPath, '755');

        const dockerCommand = `docker run --rm -v "${codebasePath}:/app" script-runner /app/${path.basename(scriptPath)}`;
        exec(dockerCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send({ error: stderr });
            }
            res.send({ output: stdout });
        });
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    } finally {
        // Cleanup: Delete the script file after execution
        await fs.unlink(scriptPath).catch(console.error);
    }
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
