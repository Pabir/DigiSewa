const fs = require('fs'); 
const txt = fs.readFileSync('imports.txt', 'utf8'); 
const regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"]/g; 
let match; 
const icons = new Set(); 
while ((match = regex.exec(txt)) !== null) { 
    match[1].split(',').forEach(i => icons.add(i.trim())); 
} 
const d = fs.readFileSync('node_modules/lucide-react-native/dist/lucide-react-native.d.ts', 'utf8'); 
icons.forEach(icon => { 
    if (icon && !d.includes('declare const ' + icon + ':')) 
        console.log('MISSING:', icon); 
});
