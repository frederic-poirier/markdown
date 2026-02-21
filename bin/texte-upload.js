#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
    access,
    copyFile,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    stat,
    writeFile
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline/promises';
import JSZip from 'jszip';

const execFileAsync = promisify(execFile);

const DEFAULT_BASE_URL = 'https://texte.zip';
const DEFAULT_PDF_SERVICE_URL = 'http://localhost:5060';
const SESSION_FILE = path.join(os.homedir(), '.config', 'texte-upload', 'session.json');
const KNOWN_BINARY_EXTENSIONS = new Set([
    '7z', 'avi', 'bmp', 'doc', 'docx', 'exe', 'ico', 'mov', 'mp3', 'mp4', 'odt',
    'pdf', 'ppt', 'pptx', 'rar', 'tar', 'webm', 'xls', 'xlsx', 'zip'
]);

function printHelp() {
    console.log(`texte-upload - Upload text/code/PDF files to texte API (R2/D1)

Usage:
  texte-upload <file-or-dir> [more paths...] [options]

Options:
  --url <baseUrl>         API base URL (default: ${DEFAULT_BASE_URL})
  --pdf-url <pdfUrl>      PDF service URL for conversion (default: ${DEFAULT_PDF_SERVICE_URL})
  --cookie <cookie>       Raw Cookie header value (ex: "session=...")
    --browser <name>        auto | firefox | chromium (default: auto)
  --help                  Show help

Environment:
  TEXTE_API_URL           Default base URL (override --url)
  TEXTE_PDF_SERVICE_URL   PDF conversion base URL (override --pdf-url)
  TEXTE_COOKIE            Raw cookie header value
  TEXTE_SESSION           Session token only (auto-transformed to session=...)

Examples:
  texte-upload ./notes.md
  texte-upload ./scan.pdf
  texte-upload ./scan.pdf --pdf-url http://localhost:5060
  texte-upload ./docs --url http://localhost:7000 --cookie "session=abc"
    texte-upload ./docs --browser firefox
  TEXTE_SESSION=abc texte-upload ./docs ./README.md
`);
}

function parseArgs(argv) {
    const paths = [];
    const options = {
        baseUrl: process.env.TEXTE_API_URL || DEFAULT_BASE_URL,
        pdfServiceUrl: process.env.TEXTE_PDF_SERVICE_URL || DEFAULT_PDF_SERVICE_URL,
        cookie: process.env.TEXTE_COOKIE || null,
        browser: 'auto'
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

        if (token === '--cookie') {
            options.cookie = argv[index + 1] || '';
            index += 1;
            continue;
        }

        if (token === '--pdf-url') {
            options.pdfServiceUrl = argv[index + 1] || '';
            index += 1;
            continue;
        }

        if (token === '--browser') {
            options.browser = (argv[index + 1] || '').toLowerCase();
            index += 1;
            continue;
        }

        if (token.startsWith('--')) {
            throw new Error(`Unknown option: ${token}`);
        }

        paths.push(token);
    }

    if (!options.cookie && process.env.TEXTE_SESSION) {
        options.cookie = `session=${process.env.TEXTE_SESSION}`;
    }

    if (options.cookie && !options.cookie.includes('=')) {
        options.cookie = `session=${options.cookie}`;
    }

    if (!['auto', 'firefox', 'chromium'].includes(options.browser)) {
        throw new Error('Invalid --browser value. Expected auto|firefox|chromium');
    }

    return { paths, options };
}

function normalizeCookie(cookie) {
    if (!cookie) return null;
    if (cookie.includes('=')) return cookie;
    return `session=${cookie}`;
}

function getCookieValue(cookie) {
    const normalized = normalizeCookie(cookie);
    if (!normalized) return '';

    const parts = normalized.split(';').map((part) => part.trim());
    const sessionPart = parts.find((part) => part.startsWith('session='));
    if (!sessionPart) return '';

    return sessionPart.slice('session='.length).trim();
}

function getDomainFromBaseUrl(baseUrl) {
    const hostname = new URL(baseUrl).hostname;
    if (hostname === 'localhost') return 'localhost';
    return hostname.replace(/^\./, '');
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

async function validateSession(baseUrl, cookie) {
    if (!cookie) return false;

    try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/files/all`, {
            method: 'GET',
            headers: {
                Cookie: normalizeCookie(cookie)
            }
        });

        if (response.status === 401) return false;
        return response.ok;
    } catch {
        return false;
    }
}

async function commandExists(command) {
    try {
        await execFileAsync(command, ['-version']);
        return true;
    } catch {
        return false;
    }
}

function escapeSql(value) {
    return value.replace(/'/g, "''");
}

async function querySqlite(dbPath, sql) {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'texte-upload-'));
    const tempDbPath = path.join(tempDir, path.basename(dbPath));
    await copyFile(dbPath, tempDbPath);
    const { stdout } = await execFileAsync('sqlite3', [tempDbPath, sql], { timeout: 5000 });
    return stdout.trim();
}

async function pathExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function findFirefoxProfiles() {
    const baseDir = path.join(os.homedir(), '.mozilla', 'firefox');
    if (!await pathExists(baseDir)) return [];

    const entries = await readdir(baseDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory() && entry.name.includes('.'))
        .map((entry) => path.join(baseDir, entry.name));
}

async function readFirefoxSessionCookie(domain) {
    const profiles = await findFirefoxProfiles();

    for (const profilePath of profiles) {
        const dbPath = path.join(profilePath, 'cookies.sqlite');
        if (!await pathExists(dbPath)) continue;

        try {
            const value = await querySqlite(
                dbPath,
                `SELECT value FROM moz_cookies WHERE name='session' AND host LIKE '%${escapeSql(domain)}%' ORDER BY lastAccessed DESC LIMIT 1;`
            );

            if (value) return `session=${value}`;
        } catch {
            continue;
        }
    }

    return null;
}

function chromiumCookiePaths() {
    const home = os.homedir();
    return [
        path.join(home, '.config', 'google-chrome', 'Default', 'Cookies'),
        path.join(home, '.config', 'google-chrome', 'Profile 1', 'Cookies'),
        path.join(home, '.config', 'chromium', 'Default', 'Cookies'),
        path.join(home, '.config', 'BraveSoftware', 'Brave-Browser', 'Default', 'Cookies')
    ];
}

async function readChromiumSessionCookie(domain) {
    const candidates = chromiumCookiePaths();

    for (const dbPath of candidates) {
        if (!await pathExists(dbPath)) continue;

        try {
            const output = await querySqlite(
                dbPath,
                `SELECT value, hex(encrypted_value) FROM cookies WHERE name='session' AND host_key LIKE '%${escapeSql(domain)}%' ORDER BY last_access_utc DESC LIMIT 1;`
            );

            if (!output) continue;

            const [rawValue, encryptedHex = ''] = output.split('|');
            if (rawValue && rawValue.trim()) {
                return `session=${rawValue.trim()}`;
            }

            if (encryptedHex && encryptedHex.trim()) {
                continue;
            }
        } catch {
            continue;
        }
    }

    return null;
}

async function readCookieFromBrowser(baseUrl, browser) {
    if (!await commandExists('sqlite3')) return null;

    const domain = getDomainFromBaseUrl(baseUrl);

    if (browser === 'firefox') {
        return await readFirefoxSessionCookie(domain);
    }

    if (browser === 'chromium') {
        return await readChromiumSessionCookie(domain);
    }

    const fromFirefox = await readFirefoxSessionCookie(domain);
    if (fromFirefox) return fromFirefox;

    return await readChromiumSessionCookie(domain);
}

async function openLoginPage(baseUrl) {
    const loginUrl = `${baseUrl.replace(/\/$/, '')}/auth/login`;

    try {
        await execFileAsync('xdg-open', [loginUrl]);
        return true;
    } catch {
        return false;
    }
}

async function waitForEnter(message) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        await rl.question(message);
    } finally {
        rl.close();
    }
}

async function resolveSessionCookie(options) {
    const normalizedBaseUrl = options.baseUrl.replace(/\/$/, '');
    const stored = await readSessionStore();

    const candidates = [];

    if (options.cookie) {
        candidates.push({
            cookie: normalizeCookie(options.cookie),
            source: 'cli'
        });
    }

    if (stored?.cookie) {
        candidates.push({
            cookie: normalizeCookie(stored.cookie),
            source: 'store'
        });
    }

    const browserCookie = await readCookieFromBrowser(normalizedBaseUrl, options.browser);
    if (browserCookie) {
        candidates.push({ cookie: browserCookie, source: options.browser });
    }

    for (const candidate of candidates) {
        const ok = await validateSession(normalizedBaseUrl, candidate.cookie);
        if (ok) {
            await writeSessionStore({
                baseUrl: normalizedBaseUrl,
                cookie: candidate.cookie,
                source: candidate.source,
                updatedAt: Date.now()
            });
            return candidate.cookie;
        }
    }

    console.log('Session invalide ou absente. Ouverture de la page OAuth Google...');
    const opened = await openLoginPage(normalizedBaseUrl);
    if (!opened) {
        console.log(`Ouvre manuellement: ${normalizedBaseUrl}/auth/login`);
    }

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        await waitForEnter(`Après login OAuth, appuie sur Entrée (tentative ${attempt}/3)... `);

        const refreshedCookie = await readCookieFromBrowser(normalizedBaseUrl, options.browser);
        if (!refreshedCookie) continue;

        const isValid = await validateSession(normalizedBaseUrl, refreshedCookie);
        if (!isValid) continue;

        await writeSessionStore({
            baseUrl: normalizedBaseUrl,
            cookie: refreshedCookie,
            source: `oauth-${options.browser}`,
            updatedAt: Date.now()
        });

        return refreshedCookie;
    }

    throw new Error(
        'Impossible de récupérer une session valide depuis Firefox/Chromium. ' +
        'Fournis --cookie "session=..." ou TEXTE_SESSION.'
    );
}

function getExtensionFromPath(filePath) {
    const extension = path.extname(filePath || '').toLowerCase();
    return extension.startsWith('.') ? extension.slice(1) : extension;
}

function isPdfPath(filePath) {
    return getExtensionFromPath(filePath) === 'pdf';
}

function isProbablyTextPath(filePath) {
    const extension = getExtensionFromPath(filePath);
    if (!extension) return true;

    return !KNOWN_BINARY_EXTENSIONS.has(extension);
}

async function collectTextFiles(inputPath) {
    const resolvedPath = path.resolve(inputPath);
    const info = await stat(resolvedPath);

    if (info.isFile()) {
        if (isProbablyTextPath(resolvedPath) || isPdfPath(resolvedPath)) {
            return [resolvedPath];
        }

        return [];
    }

    if (!info.isDirectory()) {
        return [];
    }

    const entries = await readdir(resolvedPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(resolvedPath, entry.name);

        if (entry.isDirectory()) {
            const nested = await collectTextFiles(entryPath);
            files.push(...nested);
            continue;
        }

        if (entry.isFile() && (isProbablyTextPath(entryPath) || isPdfPath(entryPath))) {
            files.push(entryPath);
        }
    }

    return files;
}

function computeId(content) {
    return createHash('sha256').update(content, 'utf8').digest('hex');
}

async function uploadFile({ filePath, baseUrl, cookie }) {
    const content = await readFile(filePath, 'utf8');

    return uploadMarkdownContent({
        name: path.basename(filePath),
        content,
        baseUrl,
        cookie,
        sourcePath: filePath
    });
}

function toMarkdownName(filePath) {
    const base = path.basename(filePath);
    if (base.toLowerCase().endsWith('.pdf')) {
        return `${base.slice(0, -4)}.md`;
    }

    return `${base}.md`;
}

async function extractMarkdownFromZip(zipBuffer, preferredName) {
    const zip = await JSZip.loadAsync(zipBuffer);
    const preferred = zip.file(preferredName);

    if (preferred) {
        const content = await preferred.async('string');
        return content;
    }

    const entry = Object
        .values(zip.files)
        .find((file) => !file.dir && file.name.toLowerCase().endsWith('.md'));

    if (!entry) {
        throw new Error('Converted markdown file not found in ZIP response');
    }

    return await entry.async('string');
}

async function importPdfAsMarkdown({ filePath, baseUrl, pdfServiceUrl, cookie }) {
    const endpoints = [
        {
            url: `${baseUrl.replace(/\/$/, '')}/api/pdf/markdown`,
            includeCookie: true,
            source: 'api'
        }
    ];

    if (pdfServiceUrl) {
        endpoints.unshift({
            url: `${pdfServiceUrl.replace(/\/$/, '')}/markdown`,
            includeCookie: false,
            source: 'local'
        });
    }

    const fileBuffer = await readFile(filePath);
    const outputName = toMarkdownName(filePath);

    let lastError = null;

    for (const endpoint of endpoints) {
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), path.basename(filePath));
        formData.append('output_file', outputName);
        formData.append('fast', 'true');

        const headers = {};
        if (cookie && endpoint.includeCookie) {
            headers.Cookie = cookie;
        }

        try {
            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const body = await response.text();
                let parsed = null;

                try {
                    parsed = body ? JSON.parse(body) : null;
                } catch {
                    parsed = null;
                }

                const reason = parsed?.detail || parsed?.error || body;
                throw new Error(reason || `HTTP ${response.status}`);
            }

            const zipBuffer = await response.arrayBuffer();
            const content = await extractMarkdownFromZip(zipBuffer, outputName);

            if (!content.trim()) {
                throw new Error('Converted markdown is empty');
            }

            return {
                name: outputName,
                content
            };
        } catch (error) {
            lastError = new Error(`[${endpoint.source}] ${error.message || error}`);
        }
    }

    throw lastError || new Error('PDF conversion failed');
}

async function uploadMarkdownContent({ name, content, baseUrl, cookie, sourcePath }) {

    if (!content.trim()) {
        return {
            filePath: sourcePath,
            skipped: true,
            reason: 'empty-content'
        };
    }

    const id = computeId(content);
    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/files/${encodeURIComponent(id)}`;

    const headers = {
        'Content-Type': 'application/json'
    };

    if (cookie) {
        headers.Cookie = cookie;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name,
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
        throw new Error(`${name}: ${reason}`);
    }

    return {
        filePath: sourcePath,
        id,
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

    if (!paths.length) {
        printHelp();
        process.exitCode = 1;
        return;
    }

    const sessionCookie = await resolveSessionCookie(options);

    const discovered = await Promise.all(paths.map((entry) => collectTextFiles(entry)));
    const files = [...new Set(discovered.flat())];

    if (!files.length) {
        console.error('No importable files found from the provided paths.');
        process.exitCode = 1;
        return;
    }

    console.log(`Uploading ${files.length} file(s) to ${options.baseUrl}...`);

    let uploadedCount = 0;
    let skippedCount = 0;
    let existingCount = 0;
    let convertedPdfCount = 0;

    for (const filePath of files) {
        try {
            const isPdf = isPdfPath(filePath);
            const result = isPdf
                ? await (async () => {
                    const converted = await importPdfAsMarkdown({
                        filePath,
                        baseUrl: options.baseUrl,
                        pdfServiceUrl: options.pdfServiceUrl,
                        cookie: sessionCookie
                    });

                    convertedPdfCount += 1;

                    return await uploadMarkdownContent({
                        name: converted.name,
                        content: converted.content,
                        baseUrl: options.baseUrl,
                        cookie: sessionCookie,
                        sourcePath: filePath
                    });
                })()
                : await uploadFile({
                    filePath,
                    baseUrl: options.baseUrl,
                    cookie: sessionCookie
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
    console.log(`- converted pdf: ${convertedPdfCount}`);
    console.log(`- already existing: ${existingCount}`);
    console.log(`- skipped: ${skippedCount}`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
