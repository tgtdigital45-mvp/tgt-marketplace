const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, '../apps/web/src'),
    path.join(__dirname, '../apps/web-pro/src'),
    path.join(__dirname, '../apps/web-portal/src')
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove direct default imports from local UI components
    const lsDefaultRegex = /import\s+LoadingSkeleton\s+from\s+['"]@\/components\/ui\/LoadingSkeleton['"];?/g;
    const scDefaultRegex = /import\s+SkeletonCard\s+from\s+['"]@\/components\/ui\/SkeletonCard['"];?/g;

    // Add them to the @tgt/ui-web import if they exist
    let newImports = new Set();
    
    if (lsDefaultRegex.test(content)) {
        content = content.replace(lsDefaultRegex, '');
        newImports.add('LoadingSkeleton');
        modified = true;
    }
    
    if (scDefaultRegex.test(content)) {
        content = content.replace(scDefaultRegex, '');
        newImports.add('SkeletonCard');
        modified = true;
    }

    if (newImports.size > 0 && modified) {
        // Check if @tgt/ui-web import already exists
        const uiWebRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@tgt\/ui-web['"];?/;
        const match = content.match(uiWebRegex);
        
        if (match) {
            // Add to existing import
            const existingImports = match[1].split(',').map(i => i.trim());
            newImports.forEach(i => {
                if (!existingImports.includes(i)) existingImports.push(i);
            });
            content = content.replace(uiWebRegex, `import { ${existingImports.join(', ')} } from '@tgt/ui-web';`);
        } else {
            // Create new import
            const importStatementsRegex = /import\s+.*from\s+['"].*['"];?/g;
            let lastImportIndex = 0;
            let m;
            while ((m = importStatementsRegex.exec(content)) !== null) {
                lastImportIndex = m.index + m[0].length;
            }
            
            const newImportStr = `\nimport { ${Array.from(newImports).join(', ')} } from '@tgt/ui-web';\n`;
            if (lastImportIndex > 0) {
                content = content.slice(0, lastImportIndex) + newImportStr + content.slice(lastImportIndex);
            } else {
                 content = newImportStr + content;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Skeleton imports replacement complete.');
