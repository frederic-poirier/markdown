#!/usr/bin/env node

import {
    mkdir,
    readFile,
    readdir,
    stat,
    writeFile
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

const DEFAULT_BASE_URL = 'https://texte.zip';
const SESSION_FILE = path.join(os.homedir(), '.config', 'texte-upload', 'session.json');

const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdx']);
const CODE_EXTENSIONS = new Set([
    'c', 'cc', 'cpp', 'cs', 'css', 'go', 'h', 'hpp', 'html', 'java', 'js', 'jsx',
    'kt', 'lua', 'm', 'php', 'pl', 'py', 'r', 'rb', 'rs', 'scala', 'sh', 'sql',
    'swift', 'ts', 'tsx', 'vue', 'xml', 'yaml', 'yml', 'json'
]);

function printHelp() {
    console.log(`texte-upload - Upload markdown/code files to texte API

Usage:
  texte-upload <file-or-dir> [more paths...] [options]

Options:
  --url <baseUrl>         API base URL (default: ${DEFAULT_BASE_URL})
  --token <sessionToken>  Session token value (without "session=")
  --help                  Show help

Environment:
  TEXTE_API_URL           Default base URL (override --url)
  TEXTE_SESSION           Session token value

Examples:
  texte-upload ./README.md
  texte-upload ./src --url http://localhost:7000
  texte-upload ./docs --token "<session-token>"
`);
}

function parseArgs(argv) {
    const paths = [];
    const options = {
        baseUrl: process.env.TEXTE_API_URL || DEFAULT_BASE_URL,
        token: process.env.TEXTE_SESSION || ''
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === '--help' || token === '-h') {
            options.help = true;
            continue;
        }

        if (token === '--url') {
            options.baseUrl = argv[index + 1] || '';
            index += 1;
            continue;
        }

        if (token === '--token') {
            options.token = argv[index + 1] || '';
            index += 1;
            continue;
        }

        if (token.startsWith('--')) {
            throw new Error(`Unknown option: ${token}`);
        }

        paths.push(token);
    }

    options.baseUrl = options.baseUrl.trim().replace(/\/$/, '');
    options.token = options.token.trim();

    return { paths, options };
}

function getExtensionFromPath(filePath) {
    const extension = path.extname(filePath || '').toLowerCase();
    return extension.startsWith('.') ? extension.slice(1) : extension;
}

function isMarkdownOrCodePath(filePath) {
    const extension = getExtensionFromPath(filePath);
    if (!extension) return false;

    return MARKDOWN_EXTENSIONS.has(extension) || CODE_EXTENSIONS.has(extension);
}

async function collectImportableFiles(inputPath) {
    const resolvedPath = path.resolve(inputPath);
    const info = await stat(resolvedPath);

    if (info.isFile()) {
        return isMarkdownOrCodePath(resolvedPath) ? [resolvedPath] : [];
    }

    if (!info.isDirectory()) {
        return [];
    }

    const entries = await readdir(resolvedPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(resolvedPath, entry.name);

        if (entry.isDirectory()) {
            const nested = await collectImportableFiles(entryPath);
            files.push(...nested);
            continue;
        }

        if (entry.isFile() && isMarkdownOrCodePath(entryPath)) {
            files.push(entryPath);
        }
    }

    return files;
}

function buildCookieHeader(token) {
    return `session=${token}`;
}

async function readSessionStore() {
    try {
        const content = await readFile(SESSION_FILE, 'utf8');
        const parsed = JSON.parse(content);
        return typeof parsed === 'object' && parsed ? parsed : null;
    } catch {
        return null;
    }
}

async function writeSessionStore(entry) {
    const directory = path.dirname(SESSION_FILE);
    await mkdir(directory, { recursive: true });
    await writeFile(SESSION_FILE, JSON.stringify(entry, null, 2), 'utf8');
}

async function validateSession(baseUrl, token) {
    if (!token) return false;

    try {
        const response = await fetch(`${baseUrl}/auth/me`, {
            method: 'GET',
            headers: {
                Cookie: buildCookieHeader(token)
            }
        });

        return response.ok;
    } catch {
        return false;
    }
}

async function askForToken(promptMessage) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const token = await rl.question(promptMessage);
        return token.trim();
    } finally {
        rl.close();
    }
}

async function resolveSessionToken(options) {
    const candidates = [];

    if (options.token) {
        candidates.push({ token: options.token, source: 'input' });
    }

    const stored = await readSessionStore();
    if (stored?.token && (!stored.baseUrl || stored.baseUrl === options.baseUrl)) {
        candidates.push({ token: stored.token, source: 'store' });
    }

    for (const candidate of candidates) {
        const isValid = await validateSession(options.baseUrl, candidate.token);
        if (!isValid) continue;

        await writeSessionStore({
            baseUrl: options.baseUrl,
            token: candidate.token,
            source: candidate.source,
            updatedAt: Date.now()
        });

        return candidate.token;
    }

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const token = await askForToken(`Session token required (${attempt}/3): `);
        if (!token) continue;

        const isValid = await validateSession(options.baseUrl, token);
        if (!isValid) {
            console.error('Invalid token, try again.');
            continue;
        }

        await writeSessionStore({
            baseUrl: options.baseUrl,
            token,
            source: 'prompt',
            updatedAt: Date.now()
        });

        return token;
    }

    throw new Error('Unable to validate a session token after 3 attempts.');
}

async function uploadFile({ filePath, baseUrl, token }) {
    const content = await readFile(filePath, 'utf8');

    if (!content.trim()) {
        return {
            filePath,
            skipped: true,
            reason: 'empty-content'
        };
    }

    const endpoint = `${baseUrl}/api/files/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: buildCookieHeader(token)
        },
        body: JSON.stringify({
            name: path.basename(filePath),
            content
        })
    });

    const body = await response.text();
    let parsed = null;

    try {
        parsed = body ? JSON.parse(body) : null;
    } catch {
        parsed = null;
    }

    if (!response.ok) {
        const reason = parsed?.error || body || `HTTP ${response.status}`;
        throw new Error(`${path.basename(filePath)}: ${reason}`);
    }

    return {
        filePath,
        id: parsed?.id || null,
        alreadyExist: Boolean(parsed?.alreadyExist),
        skipped: false
    };
}

async function main() {
    const { paths, options } = parseArgs(process.argv.slice(2));

    if (options.help) {
        printHelp();
        return;
    }

    if (!options.baseUrl) {
        throw new Error('Missing base URL. Use --url or TEXTE_API_URL.');
    }

    if (!paths.length) {
        printHelp();
        process.exitCode = 1;
        return;
    }

    const sessionToken = await resolveSessionToken(options);

    const discovered = await Promise.all(paths.map((entry) => collectImportableFiles(entry)));
    const files = [...new Set(discovered.flat())];

    if (!files.length) {
        console.error('No markdown/code files found from the provided paths.');
        process.exitCode = 1;
        return;
    }

    console.log(`Uploading ${files.length} file(s) to ${options.baseUrl}...`);

    let uploadedCount = 0;
    let skippedCount = 0;
    let existingCount = 0;

    for (const filePath of files) {
        try {
            const result = await uploadFile({
                filePath,
                baseUrl: options.baseUrl,
                token: sessionToken
            });

            if (result.skipped) {
                skippedCount += 1;
                console.log(`- skipped (empty): ${filePath}`);
                continue;
            }

            uploadedCount += 1;
            if (result.alreadyExist) {
                existingCount += 1;
                console.log(`- exists: ${filePath}`);
            } else {
                console.log(`- uploaded: ${filePath}`);
            }
        } catch (error) {
            console.error(`- failed: ${filePath}`);
            console.error(`  ${error.message}`);
            process.exitCode = 1;
        }
    }

    console.log('');
    console.log('Summary');
    console.log(`- uploaded: ${uploadedCount}`);
    console.log(`- already existing: ${existingCount}`);
    console.log(`- skipped: ${skippedCount}`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
