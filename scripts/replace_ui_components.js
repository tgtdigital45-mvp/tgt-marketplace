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
    const badgeDefaultRegex = /import\s+Badge\s+from\s+['"]@\/components\/ui\/Badge['"];?/g;
    const inputDefaultRegex = /import\s+Input\s+from\s+['"]@\/components\/ui\/Input['"];?/g;
    const selectDefaultRegex = /import\s+Select\s+from\s+['"]@\/components\/ui\/Select['"];?/g;
    const buttonDefaultRegex = /import\s+Button\s+from\s+['"]@\/components\/ui\/Button['"];?/g;

    // Add them to the @tgt/ui-web import if they exist
    let newImports = new Set();
    
    if (badgeDefaultRegex.test(content)) {
        content = content.replace(badgeDefaultRegex, '');
        newImports.add('Badge');
        modified = true;
    }
    
    if (inputDefaultRegex.test(content)) {
        content = content.replace(inputDefaultRegex, '');
        newImports.add('Input');
        modified = true;
    }

    if (selectDefaultRegex.test(content)) {
        content = content.replace(selectDefaultRegex, '');
        newImports.add('Select');
        modified = true;
    }

    if (buttonDefaultRegex.test(content)) {
        content = content.replace(buttonDefaultRegex, '');
        newImports.add('Button');
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
console.log('UI component imports replacement complete.');
