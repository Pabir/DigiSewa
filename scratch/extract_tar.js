const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const tgzPath = path.join(__dirname, '..', '.tools', 'npm.tgz');
const outDir = path.join(__dirname, '..', '.tools', 'npm');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const compressed = fs.readFileSync(tgzPath);
const tar = zlib.gunzipSync(compressed);

let offset = 0;
while (offset < tar.length - 512) {
  const header = tar.subarray(offset, offset + 512);
  // Check if header is empty (all zeros)
  if (header.every(b => b === 0)) break;

  let name = header.toString('utf8', 0, 100).replace(/\0.*/, '');
  const prefix = header.toString('utf8', 345, 500).replace(/\0.*/, '');
  if (prefix) name = prefix + '/' + name;

  const sizeOctal = header.toString('utf8', 124, 136).replace(/\0.*/, '').trim();
  const size = parseInt(sizeOctal, 8) || 0;
  const typeflag = header.toString('utf8', 156, 157);

  offset += 512;

  // Stripping leading package/
  let relName = name.replace(/^package\//, '');
  if (relName) {
    const destPath = path.join(outDir, relName);
    if (typeflag === '5' || name.endsWith('/')) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
    } else if (typeflag === '0' || typeflag === '\0' || typeflag === '') {
      const parent = path.dirname(destPath);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.writeFileSync(destPath, tar.subarray(offset, offset + size));
    }
  }

  offset += Math.ceil(size / 512) * 512;
}

console.log('Successfully extracted npm to:', outDir);
