import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Change `const navigate = useRouter()` to `const router = useRouter()`
  content = content.replace(/const\s+navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
  
  // Replace `navigate(...)` with `router.push(...)`
  // exclude navigate which are part of a word e.g. navigateTo
  // only match `navigate(`
  content = content.replace(/\bnavigate\(/g, 'router.push(');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Replaced navigate with router.push in ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      processFile(dirPath);
    }
  });
}

walkDir('./src/views');
walkDir('./src/components');
