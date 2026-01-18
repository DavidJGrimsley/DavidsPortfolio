import { promises as fs } from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'Logo-DJ-Portfolio-prototype-icons-package');

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const copyFile = async (src, dest) => {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
  console.log(`Copied ${path.relative(repoRoot, src)} -> ${path.relative(repoRoot, dest)}`);
};

const copyDirFiles = async (srcDir, destDir) => {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.toLowerCase().startsWith('readme')) continue;
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    await copyFile(src, dest);
  }
};

const main = async () => {
  if (!(await fileExists(sourceRoot))) {
    throw new Error(`Source folder not found: ${sourceRoot}`);
  }

  const mappings = [
    {
      src: path.join(sourceRoot, 'ios', 'AppIcon-1024x1024.png'),
      dest: path.join(repoRoot, 'public', 'images', 'icon.png'),
    },
    {
      src: path.join(sourceRoot, 'ios', 'AppIcon-1024x1024.png'),
      dest: path.join(repoRoot, 'public', 'images', 'adaptive-icon.png'),
    },
    {
      src: path.join(sourceRoot, 'web', 'favicon-96x96.png'),
      dest: path.join(repoRoot, 'public', 'images', 'favicon.png'),
    },
    {
      src: path.join(sourceRoot, 'android', 'play_store_512x512.png'),
      dest: path.join(repoRoot, 'public', 'icons', 'play_store_512x512.png'),
    },
  ];

  for (const mapping of mappings) {
    if (await fileExists(mapping.src)) {
      await copyFile(mapping.src, mapping.dest);
    } else {
      console.warn(`Missing source file: ${path.relative(repoRoot, mapping.src)}`);
    }
  }

  await copyDirFiles(path.join(sourceRoot, 'web'), path.join(repoRoot, 'public'));
  await copyDirFiles(path.join(sourceRoot, 'pwa'), path.join(repoRoot, 'public', 'icons'));

  const androidResDest = path.join(repoRoot, 'android', 'app', 'src', 'main', 'res');
  const androidResSrc = path.join(sourceRoot, 'android', 'res');
  if (await fileExists(androidResDest)) {
    await ensureDir(androidResDest);
    const densities = await fs.readdir(androidResSrc, { withFileTypes: true });
    for (const density of densities) {
      if (!density.isDirectory()) continue;
      const densitySrc = path.join(androidResSrc, density.name);
      const densityDest = path.join(androidResDest, density.name);
      await ensureDir(densityDest);
      await copyDirFiles(densitySrc, densityDest);
    }
  } else {
    console.log('Android native folder not found; skipping mipmap copies.');
  }

  const iosDest = path.join(repoRoot, 'ios');
  const iosSrc = path.join(sourceRoot, 'ios');
  if (await fileExists(iosDest)) {
    await ensureDir(iosDest);
    await copyDirFiles(iosSrc, path.join(iosDest, 'AppIcons'));
  } else {
    console.log('iOS native folder not found; skipping iOS icon copies.');
  }

  console.log('Icon copy complete.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
