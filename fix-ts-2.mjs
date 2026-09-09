import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace router(-1) with router.back()
  content = content.replace(/router\(-1\)/g, 'router.back()');
  // Just in case there are navigate(-1) left
  content = content.replace(/navigate\(-1\)/g, 'router.back()');

  // Add useRouter if missing
  if (content.includes('const router = useRouter()') && !content.includes('useRouter')) {
    content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]next\/navigation['"];?/g, (match) => {
      if (!match.includes('useRouter')) {
         return match.replace('{', '{ useRouter, ');
      }
      return match;
    });
    if (!content.includes('next/navigation')) {
      content = "import { useRouter } from 'next/navigation';\n" + content;
    }
  }

  // Add useParams if missing
  if (content.includes('useParams()') && !content.includes('useParams')) {
    if (content.includes('next/navigation')) {
      content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]next\/navigation['"];?/g, (match, p1) => {
        if (!p1.includes('useParams')) {
          return `import { ${p1}, useParams } from 'next/navigation';`;
        }
        return match;
      });
    } else {
      content = "import { useParams } from 'next/navigation';\n" + content;
    }
  }

  // Check if Auth.tsx needs useRouter
  if (filePath.endsWith('Auth.tsx') && content.includes('useRouter') && !content.includes('next/navigation')) {
    content = "import { useRouter } from 'next/navigation';\n" + content;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed more TS errors in ${filePath}`);
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
