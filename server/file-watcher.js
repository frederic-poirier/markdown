import { watch } from 'fs';
import { join } from 'path';
import { readdir, stat } from 'fs/promises';

export async function scanMarkdownFiles(directory) {
  const files = [];
  
  async function scan(dir) {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
          await scan(fullPath);
        }
      } else if (stats.isFile() && entry.endsWith('.md')) {
        const relativePath = fullPath.replace(directory + '/', '');
        files.push(relativePath);
      }
    }
  }
  
  await scan(directory);
  return files;
}

export function watchMarkdownFiles(files, baseDir, callback) {
  const watchers = [];
  
  for (const file of files) {
    const fullPath = join(baseDir, file);
    
    try {
      const watcher = watch(fullPath, (eventType) => {
        if (eventType === 'change') {
          console.log(`File changed: ${file}`);
          callback(file);
        }
      });
      
      watchers.push(watcher);
    } catch (error) {
      console.error(`Error watching file ${file}:`, error);
    }
  }
  
  return () => {
    watchers.forEach(watcher => watcher.close());
  };
}
