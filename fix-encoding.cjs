const fs = require('fs');
const files = ['components/views/Chat.tsx', 'components/views/Checkout.tsx', 'components/views/ProfileDetail.tsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf16le');
  if (content.indexOf('import') === -1) {
    content = fs.readFileSync(f, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
  } else {
      if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
      }
  }
  
  // add 'use client' if missing
  if (!content.includes('use client')) {
    content = '"use client";\n' + content;
  }
  
  // clean out any residual BOMs
  content = content.replace(/\uFEFF/g, '');

  // fix imports
  content = content.replace(/(['"])(?:\.\.\/)+views\//g, '$1@/components/views/');
  content = content.replace(/(['"])(?:\.\.\/)+components\//g, '$1@/components/');
  content = content.replace(/(['"])(?:\.\.\/)+contexts\//g, '$1@/lib/contexts/');
  content = content.replace(/(['"])(?:\.\.\/)+utils\//g, '$1@/lib/utils/');
  content = content.replace(/(['"])(?:\.\.\/)+data\//g, '$1@/lib/data/');
  content = content.replace(/(['"])(?:\.\.\/)+types\//g, '$1@/lib/types/');
  
  fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed 3 files');
