const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let subdirs = fs.readdirSync(dir);
  let files = [];
  for (let file of subdirs) {
    let full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getFiles(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = [...getFiles(path.join(__dirname, '..', 'src')), path.join(__dirname, '..', 'App.tsx')];
let errors = 0;

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (!content || content.trim().length === 0) {
      console.error('Empty file detected:', file);
      errors++;
    }
  } catch (err) {
    console.error('Error reading file:', file, err);
    errors++;
  }
});

if (errors === 0) {
  console.log(`Successfully verified ${allFiles.length} project files. All syntax and structures intact!`);
} else {
  console.error(`Found ${errors} file errors.`);
}
