import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '../src/app');
const configPath = path.join(srcRoot, 'core/config/referentiel-routes.data.ts');
const parametrageRoot = path.join(srcRoot, 'features/parametrage');
const registryPath = path.join(parametrageRoot, 'referentiel-list-page.registry.ts');

const folderByPath = {
  autoriteautorisation: 'autorite-autorisation',
  categorieappui: 'categorie-appui',
  domaineactivite: 'domaine-activite',
  langueapprentissage: 'langue-apprentissage',
  'langue-apprentissage': 'langue-apprentissage',
  materielalpha: 'materiel-alpha',
  materielpedagogique: 'materiel-pedagogique',
  modealpha: 'mode-alpha',
  naturecentre: 'nature-centre',
  naturedocument: 'nature-document',
  niveaualpha: 'niveau-alpha',
  niveaucp: 'niveau-cp',
  'niveau-personnel': 'niveau-personnel',
  niveausiecec: 'niveau-sie-cec',
  periodeactivite: 'periode-activite',
  regimealpha: 'regime-alpha',
  statutpersonnel: 'statut-personnel',
  supportdidactique: 'support-didactique',
  typealpha: 'type-alpha',
  typedocument: 'type-document',
};

function classNameFromSlug(slug) {
  return (
    slug
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'PageComponent'
  );
}

function readReferentiels() {
  const source = fs.readFileSync(configPath, 'utf8');
  const entries = [];
  const rx = /\{\s*path:\s*'([^']+)',\s*title:\s*'([^']+)',\s*menuGroup:\s*'([^']+)',\s*apiPath:/g;
  let match;
  while ((match = rx.exec(source)) !== null) {
    entries.push({
      path: match[1],
      title: match[2],
      menuGroup: match[3],
    });
  }
  return entries.filter((entry) => entry.path !== 'anneescolaire');
}

function writeComponent(entry) {
  const slug = folderByPath[entry.path] ?? entry.path;
  const className = classNameFromSlug(slug);
  const componentDir = path.join(parametrageRoot, entry.menuGroup, slug);
  const componentTsFile = path.join(componentDir, `${slug}-page.component.ts`);
  const componentHtmlFile = path.join(componentDir, `${slug}-page.component.html`);
  const componentCssFile = path.join(componentDir, `${slug}-page.component.css`);
  const selector = `app-parametrage-${slug}-page`;
  const tsContent = `import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: '${selector}',
  imports: [ReferentielListPageComponent],
  templateUrl: './${slug}-page.component.html',
  styleUrl: './${slug}-page.component.css',
})
export class ${className} {}
`;
  const htmlContent = `<app-referentiel-list-page />\n`;
  const cssContent = `:host {\n  display: block;\n}\n`;
  fs.mkdirSync(componentDir, { recursive: true });
  fs.writeFileSync(componentTsFile, tsContent, 'utf8');
  fs.writeFileSync(componentHtmlFile, htmlContent, 'utf8');
  fs.writeFileSync(componentCssFile, cssContent, 'utf8');
  return {
    ...entry,
    slug,
    className,
    importPath: `./${entry.menuGroup}/${slug}/${slug}-page.component`,
  };
}

function writeRegistry(components) {
  const imports = components
    .map((c) => `import { ${c.className} } from '${c.importPath}';`)
    .join('\n');
  const mapEntries = components
    .map((c) => `  ${JSON.stringify(c.path)}: ${c.className},`)
    .join('\n');
  const content = `import type { Type } from '@angular/core';
${imports}

/**
 * Associe le segment d’URL (\`ReferentielRouteData.path\`) au composant page dédié.
 * Régénération : \`node tools/gen-referentiel-wrappers.mjs\`
 */
export const REFERENTIEL_LIST_PAGE_BY_PATH: Record<string, Type<unknown>> = {
${mapEntries}
};
`;
  fs.writeFileSync(registryPath, content, 'utf8');
}

const generated = readReferentiels().map(writeComponent);
writeRegistry(generated);

const oldSingleFile = path.join(parametrageRoot, 'referentiel-list-page-wrappers.ts');
if (fs.existsSync(oldSingleFile)) {
  fs.rmSync(oldSingleFile);
}

console.log(`generated ${generated.length} parametrage pages`);
