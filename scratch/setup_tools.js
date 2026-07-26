const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

async function setup() {
  const toolsDir = path.join(__dirname, '..', '.tools');
  const tgzPath = path.join(toolsDir, 'npm.tgz');
  const outDir = path.join(toolsDir, 'npm');

  console.log('Downloading npm@10.9.2...');
  const res = await fetch('https://registry.npmjs.org/npm/-/npm-10.9.2.tgz');
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tgzPath, buffer);

  // Clear existing npm directory
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const tar = zlib.gunzipSync(buffer);
  let offset = 0;
  while (offset < tar.length - 512) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(b => b === 0)) break;

    let name = header.toString('utf8', 0, 100).replace(/\0.*/, '');
    const prefix = header.toString('utf8', 345, 500).replace(/\0.*/, '');
    if (prefix) name = prefix + '/' + name;

    const sizeOctal = header.toString('utf8', 124, 136).replace(/\0.*/, '').trim();
    const size = parseInt(sizeOctal, 8) || 0;
    const typeflag = header.toString('utf8', 156, 157);

    offset += 512;
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
  console.log('Successfully set up npm@10.9.2!');
}

setup().catch(err => console.error(err));
