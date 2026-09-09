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

  // Add "use client" if it has hooks
  const hasHooks = /use[A-Z]\w*\(/.test(content);
  if (hasHooks && !content.includes("'use client'")) {
    content = "'use client';\n\n" + content;
  }

  // Replace react-router-dom imports
  if (content.includes('react-router-dom')) {
    let imports = [];
    if (content.includes('useNavigate')) {
      content = content.replace(/useNavigate\(\)/g, 'useRouter()');
      imports.push('useRouter');
    }
    if (content.includes('useLocation')) {
      content = content.replace(/useLocation\(\)/g, 'usePathname()');
      content = content.replace(/\.pathname/g, ''); // location.pathname -> pathname
      imports.push('usePathname');
    }
    
    if (content.includes('Link')) {
      content = content.replace(/import \{[^}]*Link[^}]*\} from 'react-router-dom';/g, "import Link from 'next/link';\nimport { $1 } from 'react-router-dom';");
      // Need a more robust regex for import replacement. Let's do it manually.
    }
  }

  // We will do a simpler approach:
  // 1. replace `import { ..., useNavigate, ... } from 'react-router-dom'` with `next/navigation`
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
    let nextNavImports = [];
    let nextLinkImports = [];
    let remaining = p1.split(',').map(s => s.trim()).filter(s => s);
    
    if (remaining.includes('useNavigate')) {
      nextNavImports.push('useRouter');
      remaining = remaining.filter(s => s !== 'useNavigate');
    }
    if (remaining.includes('useLocation')) {
      nextNavImports.push('usePathname');
      remaining = remaining.filter(s => s !== 'useLocation');
    }
    if (remaining.includes('Link')) {
      nextLinkImports.push('Link');
      remaining = remaining.filter(s => s !== 'Link');
    }
    if (remaining.includes('Navigate')) {
      // Navigate component - we can just use router.push or redirect
      // but let's keep it simple and deal with it manually later if needed
    }

    let out = '';
    if (nextNavImports.length > 0) {
      out += `import { ${nextNavImports.join(', ')} } from 'next/navigation';\n`;
    }
    if (nextLinkImports.length > 0) {
      out += `import Link from 'next/link';\n`;
    }
    if (remaining.length > 0) {
      out += `import { ${remaining.join(', ')} } from 'react-router-dom';\n`;
    }
    return out.trim();
  });

  content = content.replace(/useNavigate/g, 'useRouter');
  content = content.replace(/location\.pathname/g, 'pathname');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

walkDir('./src/components', processFile);
walkDir('./src/pages', processFile);
