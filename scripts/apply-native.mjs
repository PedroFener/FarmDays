#!/usr/bin/env node
/*
 * Aplica as partes nativas do FarmDays ao projeto Android gerado pelo Capacitor
 * (pasta android/). Idempotente: pode rodar quantas vezes quiser.
 *
 *  1. Copia o widget (Java) para o pacote do app.
 *  2. Copia recursos (layout, xml, ícones, strings, imagens do widget).
 *  3. Substitui as imagens de abertura (splash).
 *  4. Registra o widget no AndroidManifest.xml.
 *
 * Uso: node scripts/apply-native.mjs   (depois de `npx cap add android`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
const appId = config.appId;
const androidMain = path.join(root, 'android', 'app', 'src', 'main');

if (!fs.existsSync(androidMain)) {
  console.error('Pasta android/ não encontrada. Rode antes: npx cap add android');
  process.exit(1);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 1. Java
const javaDst = path.join(androidMain, 'java', ...appId.split('.'));
fs.mkdirSync(javaDst, { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'native', 'android', 'java'))) {
  fs.copyFileSync(path.join(root, 'native', 'android', 'java', f), path.join(javaDst, f));
  console.log('java  ->', path.relative(root, path.join(javaDst, f)));
}

// 2. Recursos
const resDst = path.join(androidMain, 'res');
copyDir(path.join(root, 'native', 'android', 'res'), resDst);
console.log('res   -> android/app/src/main/res');

// Ícones antigos do template que conflitariam (ex.: foreground vetorial do Capacitor)
for (const stale of ['drawable-v24/ic_launcher_foreground.xml', 'drawable/ic_launcher_foreground.xml']) {
  const p = path.join(resDst, stale);
  if (fs.existsSync(p)) { fs.rmSync(p); console.log('rm    ->', stale); }
}

// 3. Splash
const splash = path.join(root, 'native', 'android', 'splash', 'splash.png');
let n = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'splash.png') { fs.copyFileSync(splash, p); n++; }
  }
})(resDst);
console.log(`splash-> ${n} arquivo(s)`);

// 4. Manifesto
const manifestPath = path.join(androidMain, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('.FarmDaysWidget')) {
  const receiver = `
        <!-- FarmDays: widget nativo da tela inicial -->
        <receiver
            android:name=".FarmDaysWidget"
            android:exported="true"
            android:label="@string/farmdays_widget_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.intent.action.DATE_CHANGED" />
                <action android:name="android.intent.action.LOCALE_CHANGED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/farmdays_widget_info" />
        </receiver>
    </application>`;
  manifest = manifest.replace(/\s*<\/application>/, receiver);
  fs.writeFileSync(manifestPath, manifest);
  console.log('manifest -> widget registrado');
} else {
  console.log('manifest -> widget já registrado');
}

// 5. Versão do app a partir do package.json (versionName) e do número do build (versionCode)
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let g = fs.readFileSync(gradlePath, 'utf8');
  const code = parseInt(process.env.FARMDAYS_VERSION_CODE || '1', 10);
  g = g.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);
  fs.writeFileSync(gradlePath, g);
  console.log(`gradle -> versionName ${pkg.version}, versionCode ${code}`);
}
console.log('OK: partes nativas aplicadas.');
