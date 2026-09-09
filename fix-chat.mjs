import fs from 'fs';
['src/views/Chat.tsx', 'src/views/Checkout.tsx'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s+\{\s*Navigate,\s*useNavigate,\s*useParams\s*\}\s+from\s+['"]react-router-dom['"];/g, "import { useRouter, useParams } from 'next/navigation';\nimport { Navigate } from '../components/Navigate';");
  content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\)/g, 'const router = useRouter()');
  content = content.replace(/navigate\(/g, 'router.push(');
  content = "'use client';\n\n" + content;
  fs.writeFileSync(f, content);
  console.log('Fixed ' + f);
});
