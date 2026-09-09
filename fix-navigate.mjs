import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace react-router-dom Navigate import with our component
  if (content.includes('react-router-dom') || content.includes('<Navigate')) {
    content = content.replace(/import\s+\{[^}]*Navigate[^}]*\}\s+from\s+['"]react-router-dom['"];?/g, '');
    if (content.includes('<Navigate') && !content.includes("from '../components/Navigate'")) {
       let relPath = '../components/Navigate';
       if (filePath.includes('admin')) {
         relPath = '../../components/Navigate';
       }
       content = `import { Navigate } from '${relPath}';\n` + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated Navigate in ${filePath}`);
  }
}

['Chat.tsx', 'Checkout.tsx', 'Onboarding.tsx', 'ProfileDetail.tsx'].forEach(f => {
  let p = path.join('src', 'views', f);
  if (fs.existsSync(p)) processFile(p);
});
