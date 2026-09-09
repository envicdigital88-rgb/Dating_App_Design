import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Change router('/path') to router.push('/path')
  // We look for router(something) but exclude router.push
  content = content.replace(/router\((.*?)\)/g, 'router.push($1)');

  // 2. Change <Link to="..."> to <Link href="...">
  content = content.replace(/<Link\s+([^>]*?)to=/g, '<Link $1href=');

  // 3. Remove react-router-dom entirely and replace useParams
  if (content.includes('react-router-dom')) {
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
      let nextNavImports = [];
      let remaining = p1.split(',').map(s => s.trim()).filter(s => s);
      
      if (remaining.includes('useParams')) {
        nextNavImports.push('useParams');
        remaining = remaining.filter(s => s !== 'useParams');
      }
      if (remaining.includes('useSearchParams')) {
        nextNavImports.push('useSearchParams');
        remaining = remaining.filter(s => s !== 'useSearchParams');
      }
      
      let out = '';
      if (nextNavImports.length > 0) {
        out += `import { ${nextNavImports.join(', ')} } from 'next/navigation';\n`;
      }
      // Drop any remaining react-router-dom imports, we don't have it installed
      return out.trim();
    });
  }

  // Next.js Link is default import, so we need to fix `import { Link } from 'next/link'` to `import Link from 'next/link'` if it exists
  content = content.replace(/import\s+\{\s*Link\s*\}\s+from\s+['"]next\/link['"]/g, "import Link from 'next/link'");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed TS errors in ${filePath}`);
  }
}

walkDir('./src/views', processFile);
walkDir('./src/components', processFile);
