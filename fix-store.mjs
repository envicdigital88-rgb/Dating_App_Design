import fs from 'fs';

function addUseClient(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes("'use client'") && !content.includes('"use client"')) {
    content = "'use client';\n\n" + content;
    fs.writeFileSync(filePath, content);
    console.log(`Added 'use client' to ${filePath}`);
  }
}

addUseClient('src/contexts/StoreContext.tsx');
