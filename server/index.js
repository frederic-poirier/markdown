import { startServer } from './server.js';
import { scanMarkdownFiles } from './file-watcher.js';
import { mkdir, stat } from 'fs/promises';
import { join } from 'path';

function getTailscaleIP() {
  try {
    const result = Bun.spawnSync(['tailscale', 'ip', '-4']);
    if (result.success) {
      return result.stdout.toString().trim();
    }
  } catch (e) {
    console.warn('Tailscale not found, using 0.0.0.0');
  }
  return '0.0.0.0';
}

const cwd = process.cwd();
const filesDir = join(cwd, 'files');
const host = getTailscaleIP();
const port = process.env.PORT || 3000;

// Ensure files directory exists
try {
  await stat(filesDir);
} catch {
  await mkdir(filesDir, { recursive: true });
  console.log(`Created files directory: ${filesDir}\n`);
}

console.log(`\nScanning for markdown files in: ${filesDir}\n`);

const markdownFiles = await scanMarkdownFiles(filesDir);

console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

await startServer({ cwd: filesDir, host, port, markdownFiles });

console.log(`Markdown viewer running at: http://${host}:${port}\n`);

if (markdownFiles.length > 0) {
  markdownFiles.slice(0, 5).forEach(file => {
    console.log(`   ${file}`);
  });
  if (markdownFiles.length > 5) {
    console.log(`   ... and ${markdownFiles.length - 5} more`);
  }
  console.log('');
}
