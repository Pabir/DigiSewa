const fs = require('fs');
const content = fs.readFileSync('src/services/dynamicCatalogService.ts', 'utf8');

const match = content.match(/const SEED_ATTRIBUTES: AttributeDefinition\[\] = (\[[\s\S]*?\]);\n\nconst SEED_CATEGORIES/);
if (!match) {
  console.log('No match for SEED_ATTRIBUTES');
  process.exit(1);
}

const lines = match[1].split('\n');
let idCount = 0;
lines.forEach(line => {
  const m = line.match(/id:\s*(['"])(.*?)\1/);
  if (m) {
    idCount++;
    if (m[2].trim() === '') {
      console.log('FOUND EMPTY ID:', line.trim());
    }
    if (m[2].includes('/')) {
      console.log('FOUND SLASH ID:', line.trim());
    }
  }
});
console.log('Checked', idCount, 'ids');
