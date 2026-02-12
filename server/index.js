import { startServer } from './server.js';
import { scanMarkdownFiles } from './file-watcher.js';

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
const host = getTailscaleIP();
const port = process.env.PORT || 3000;

console.log(`\nScanning for markdown files in: ${cwd}\n`);

const markdownFiles = await scanMarkdownFiles(cwd);

console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

await startServer({ cwd, host, port, markdownFiles });

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
