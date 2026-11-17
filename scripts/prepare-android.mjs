#!/usr/bin/env node
/*
 * Prepara (ou atualiza) o projeto Android:
 *   - cria android/ com `npx cap add android` se ainda não existir;
 *   - aplica widget, ícones e splash (apply-native.mjs);
 *   - copia o www/ e plugins com `npx cap sync android`.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => { console.log('$', cmd); execSync(cmd, { cwd: root, stdio: 'inherit' }); };

if (!fs.existsSync(path.join(root, 'android', 'app'))) run('npx cap add android');
run('node scripts/apply-native.mjs');
run('npx cap sync android');
