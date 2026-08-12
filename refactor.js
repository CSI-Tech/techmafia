/* eslint-disable */
const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') && !file.includes('layout.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('src/app/admin');
console.log(`Found ${files.length} admin page files to refactor.`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if already has "use client"
  if (!content.startsWith('"use client";')) {
    content = `"use client";\n` + content;
  }

  // Replace relative imports
  content = content.replace(/\.\.\/\.\.\/services\//g, '@/components/providers/');
  content = content.replace(/\.\.\/\.\.\/components\//g, '@/components/');
  
  // Replace react-router-dom with next/navigation and next/link
  content = content.replace(/import \{.*(useNavigate|useParams|Link).*} from 'react-router-dom';/g, (match) => {
    let nextImports = '';
    if (match.includes('useNavigate') || match.includes('useParams')) {
        let items = [];
        if (match.includes('useNavigate')) items.push('useRouter as useNavigate');
        if (match.includes('useParams')) items.push('useParams');
        nextImports += `import { ${items.join(', ')} } from 'next/navigation';\n`;
    }
    if (match.includes('Link')) {
        nextImports += `import Link from 'next/link';\n`;
    }
    return nextImports.trim();
  });

  // Also replace `to=` with `href=` in Links
  content = content.replace(/<Link(.*?)to=/g, '<Link$1href=');
  
  // Any stray BACKEND_URL?
  content = content.replace(/const BACKEND_URL = 'http:\/\/localhost:3001';/g, "const BACKEND_URL = '';");

  fs.writeFileSync(file, content);
  console.log('Refactored', file);
});
