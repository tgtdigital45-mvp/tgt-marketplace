import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.turbo' && f !== '.git' && f !== '.expo') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const uiWebExports = ['ErrorBoundary', 'LoadingSpinner', 'PageTransition'];

function processFile(filePath) {
  if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  // Find all import statements from '@tgt/shared'
  const importRegex = /import\s*(?:type)?\s*{([^}]+)}\s+from\s+['"]@tgt\/shared['"];?/g;
  
  content = content.replace(importRegex, (match, importsStr) => {
    const isTypeImport = match.includes('import type');
    const imports = importsStr.split(',').map(i => i.trim()).filter(i => i);
    
    const uiImports = [];
    const coreImports = [];
    
    imports.forEach(imp => {
      // Handle aliased imports like "DbProfile as Profile"
      let baseImport = imp;
      if (imp.includes(' as ')) {
        baseImport = imp.split(' as ')[0].trim();
      }
      // Handle inline types like "type Booking"
      if (baseImport.startsWith('type ')) {
          baseImport = baseImport.replace(/^type\s+/, '').trim();
      }
      
      if (uiWebExports.includes(baseImport)) {
        uiImports.push(imp);
      } else {
        coreImports.push(imp);
      }
    });
    
    let replacement = '';
    const importTypeStr = isTypeImport ? 'import type' : 'import';
    
    if (coreImports.length > 0) {
      replacement += `${importTypeStr} { ${coreImports.join(', ')} } from '@tgt/core';\n`;
    }
    if (uiImports.length > 0) {
      replacement += `${importTypeStr} { ${uiImports.join(', ')} } from '@tgt/ui-web';\n`;
    }
    
    return replacement.trim() + (match.endsWith(';') ? ';' : '');
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('./apps', processFile);
