const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b));

let mergedContent = `-- Initial Database Schema Squash (Generated Local Merge)\n\n`;

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  mergedContent += `-- ==========================================\n`;
  mergedContent += `-- SOURCE: ${file}\n`;
  mergedContent += `-- ==========================================\n\n`;
  mergedContent += content + '\n\n';
}

fs.writeFileSync(path.join(migrationsDir, '00000_init_schema.sql'), mergedContent);
console.log('Squashed ' + files.length + ' migrations into 00000_init_schema.sql');

// Delete old ones
for (const file of files) {
  fs.unlinkSync(path.join(migrationsDir, file));
}
console.log('Deleted old migration files.');
