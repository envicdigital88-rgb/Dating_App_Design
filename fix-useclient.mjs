import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes("'use client'") || content.includes('"use client"')) {
    content = content.replace(/['"]use client['"];?\n*/g, '');
    content = "'use client';\n\n" + content;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Moved 'use client' to top in ${filePath}`);
  }
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

walkDir('./src/views', processFile);
walkDir('./src/components', processFile);
