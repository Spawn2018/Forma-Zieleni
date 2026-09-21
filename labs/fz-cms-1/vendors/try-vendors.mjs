import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(root, 'tmp', 'vendors');

function pkgVersion(pkgJson) {
  if (!existsSync(pkgJson)) return null;
  try {
    return JSON.parse(readFileSync(pkgJson, 'utf8')).version || true;
  } catch {
    return 'unreadable';
  }
}

const report = {
  researchDate: '2026-09-21',
  note: 'Read-only status. This script does not create, delete or install vendor trees.',
  payload: {
    scaffold: existsSync(path.join(tmp, 'payload-lab', 'package.json')),
    installed: existsSync(path.join(tmp, 'payload-lab', 'node_modules', 'payload', 'package.json')),
    version: pkgVersion(path.join(tmp, 'payload-lab', 'node_modules', 'payload', 'package.json')),
  },
  apostrophe: {
    scaffold: existsSync(path.join(tmp, 'apos-lab', 'backend', 'package.json')),
    installed: existsSync(path.join(tmp, 'apos-lab', 'backend', 'node_modules', 'apostrophe', 'package.json')),
    version: pkgVersion(path.join(tmp, 'apos-lab', 'backend', 'node_modules', 'apostrophe', 'package.json')),
  },
  strapi: {
    scaffold: existsSync(path.join(tmp, 'strapi-lab', 'package.json')),
    installed: existsSync(path.join(tmp, 'strapi-lab', 'node_modules', '@strapi', 'strapi', 'package.json')),
    version: pkgVersion(path.join(tmp, 'strapi-lab', 'node_modules', '@strapi', 'strapi', 'package.json')),
  },
};

console.log(JSON.stringify(report, null, 2));
