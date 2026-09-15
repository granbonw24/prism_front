/**
 * E2E login + dashboard + navigation for all local test roles.
 * Usage: node e2e-login-roles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const FRONT = 'http://localhost:4200';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(process.env.TEMP || '.', 'prism-e2e-login-out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const NAV = { waitUntil: 'domcontentloaded', timeout: 20000 };

const USERS = [
  { user: 'admin', pass: 'admin123', role: 'ADMIN', pages: ['/centres/alpha', '/administration/utilisateurs', '/profil'] },
  { user: 'nebdev', pass: 'nebdev123', role: 'SUPER_ROOT', pages: ['/centres/alpha', '/administration/utilisateurs', '/profil'] },
  { user: 'conseiller_test', pass: '123456', role: 'CONSEILLER', pages: ['/activites-centre/visite/conseiller', '/apprenant/effectif', '/profil'] },
  { user: 'coordonnateur_test', pass: '123456', role: 'COORDONNATEUR', pages: ['/apprenant/effectif', '/profil'] },
  { user: 'iepp_test', pass: '123456', role: 'IEPP', pages: ['/activites-centre/visite/iepp', '/profil'] },
  { user: 'superviseur_test', pass: '123456', role: 'SUPERVISEUR', pages: ['/activites-centre/visite/superviseur', '/profil'] },
  { user: 'superviseur_aenf_test', pass: '123456', role: 'SUPERVISEUR_AENF', pages: ['/profil'] },
  { user: 'commission_1_conseiller_1', pass: '123456', role: 'CONSEILLER', pages: ['/activites-centre/visite/conseiller', '/profil'] },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pageHealthSafe(page) {
  try {
    return await Promise.race([
      pageHealth(page),
      sleep(8000).then(() => {
        throw new Error('pageHealth timeout');
      }),
    ]);
  } catch (e) {
    const url = page.url();
    let pathName = url;
    try {
      pathName = new URL(url).pathname;
    } catch {
      /* ignore */
    }
    return {
      url,
      path: pathName,
      title: '',
      alert: '',
      loginBtn: '',
      shell: false,
      dashH1: false,
      bodyStart: String(e?.message || e),
    };
  }
}

function pageHealth(page) {
  return page.evaluate(() => {
    const body = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    const title = document.querySelector('h1')?.textContent?.trim() || '';
    const alert = document.querySelector('.alert-danger')?.textContent?.trim() || '';
    const loginBtn = document.querySelector('.mena-btn-login')?.textContent?.trim() || '';
    const shell = !!document.querySelector('app-app-shell, .mena-app-shell, #wrapper, .sidebar');
    const dashH1 = /Tableau de bord/i.test(title) || /Tableau de bord/i.test(body.slice(0, 400));
    return {
      url: location.href,
      path: location.pathname,
      title,
      alert,
      loginBtn,
      shell,
      dashH1,
      bodyStart: body.slice(0, 360),
    };
  });
}

async function fillLogin(page, user, pass) {
  await page.waitForSelector('input[placeholder="Matricule"]', { timeout: 12000 });
  await page.waitForSelector('input[placeholder="Mot de passe"]', { timeout: 8000 });
  await page.evaluate(
    (u, p) => {
      const userEl = document.querySelector('input[placeholder="Matricule"]');
      const passEl = document.querySelector('input[placeholder="Mot de passe"]');
      const set = (el, value) => {
        el.focus();
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set(userEl, u);
      set(passEl, p);
    },
    user,
    pass,
  );
  // Angular ControlValueAccessor may ignore programmatic value; type as fallback if empty.
  const filled = await page.evaluate(() => ({
    u: document.querySelector('input[placeholder="Matricule"]')?.value || '',
    p: document.querySelector('input[placeholder="Mot de passe"]')?.value || '',
  }));
  if (filled.u !== user) {
    const userInput = await page.$('input[placeholder="Matricule"]');
    await userInput.click({ clickCount: 3 });
    await userInput.type(user, { delay: 10 });
  }
  if (filled.p !== pass) {
    const passInput = await page.$('input[placeholder="Mot de passe"]');
    await passInput.click({ clickCount: 3 });
    await passInput.type(pass, { delay: 10 });
  }
}

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file }).catch(() => null);
  return file;
}

async function loginAndCheck(browser, spec) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    const url = res.url();
    if (!url.includes('/api/')) return;
    const status = res.status();
    if (status >= 400) {
      failedRequests.push(`${status} ${url.replace(FRONT, '')}`);
    }
  });
  const result = { user: spec.user, role: spec.role, ok: false, steps: [], errors: consoleErrors, failedRequests };

  try {
    process.stdout.write(`  goto login...\n`);
    await page.goto(`${FRONT}/login`, NAV);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${FRONT}/login`, NAV);
    process.stdout.write(`  fill form...\n`);
    await fillLogin(page, spec.user, spec.pass);
    process.stdout.write(`  submit...\n`);

    const submit = await page.$('button[type="submit"]');
    await submit.click();
    const waitStart = Date.now();
    while (Date.now() - waitStart < 20000) {
      const url = page.url();
      if (!url.includes('/login')) {
        break;
      }
      await sleep(250);
    }
    await sleep(1500);

    let health = await pageHealthSafe(page);
    result.steps.push({ step: 'after-login', ...health });

    if (health.path.includes('/login')) {
      result.ok = false;
      result.fail = health.alert || health.loginBtn || 'still on /login';
      result.screenshot = await shot(page, `${spec.user}-login-stuck`);
      return result;
    }
    if (!health.dashH1) {
      result.ok = false;
      result.fail = `no dashboard after login, landed ${health.path} title=${health.title} body=${health.bodyStart.slice(0, 120)}`;
      result.screenshot = await shot(page, `${spec.user}-no-dash`);
      return result;
    }

    for (const rel of spec.pages) {
      await page.goto(`${FRONT}${rel}`, NAV);
      await sleep(900);
      health = await pageHealthSafe(page);
      result.steps.push({ step: `nav:${rel}`, ...health });
      if (health.path.includes('/login')) {
        result.ok = false;
        result.fail = `kicked to login on ${rel}`;
        result.screenshot = await shot(page, `${spec.user}-kicked-${rel.replace(/\W+/g, '_')}`);
        return result;
      }
      if (health.path.includes('/profil') && rel !== '/profil' && /accessDenied|acc[eè]s refus/i.test(health.url + health.bodyStart)) {
        result.ok = false;
        result.fail = `access denied on ${rel}`;
        result.screenshot = await shot(page, `${spec.user}-denied-${rel.replace(/\W+/g, '_')}`);
        return result;
      }
      const blank = !health.bodyStart || health.bodyStart.length < 20;
      if (blank) {
        result.ok = false;
        result.fail = `blank page on ${rel}`;
        result.screenshot = await shot(page, `${spec.user}-blank-${rel.replace(/\W+/g, '_')}`);
        return result;
      }
    }

    result.ok = true;
    return result;
  } catch (e) {
    result.ok = false;
    result.fail = String(e?.message || e);
    try {
      result.steps.push({ step: 'catch', ...(await pageHealthSafe(page)) });
      result.screenshot = await shot(page, `${spec.user}-catch`);
    } catch {
      /* ignore */
    }
    return result;
  } finally {
    await page.close().catch(() => null);
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 30000,
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--disable-dev-shm-usage',
    '--window-size=1400,900',
    // ng serve local n'écoute que ::1 ; Chrome résout souvent localhost → 127.0.0.1.
    '--host-resolver-rules=MAP localhost [::1]',
  ],
});

const results = [];
for (const spec of USERS) {
  process.stdout.write(`Testing ${spec.user} (${spec.role})...\n`);
  const r = await loginAndCheck(browser, spec);
  results.push(r);
  console.log(
    JSON.stringify(
      {
        user: r.user,
        ok: r.ok,
        fail: r.fail,
        url: r.steps.at(-1)?.url,
        title: r.steps.at(-1)?.title,
        screenshot: r.screenshot,
        failedRequests: r.failedRequests?.slice(0, 8),
        errors: r.errors?.slice(0, 6),
      },
      null,
      0,
    ),
  );
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log('\n===== SUMMARY =====');
for (const r of results) {
  const after = r.steps.find((s) => s.step === 'after-login');
  console.log(
    `${r.ok ? 'OK  ' : 'FAIL'} ${r.user.padEnd(28)} ${r.role.padEnd(18)} ${r.fail || after?.title || ''}`,
  );
}
const report = path.join(OUT_DIR, 'report.json');
fs.writeFileSync(report, JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
console.log(`report=${report}`);
process.exit(failed.length ? 1 : 0);
