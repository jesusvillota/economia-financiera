import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { checkAudit, parseAudit } from '../scripts/check-audit.mjs';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const reference = 'Test: `tests/value.test.ts` — `corrected value`';
const document = (body: string) => `# Audit\n\n## 1. Coverage map\n\n| Topic | Gap |\n|---|---|\n| Bonds | No note |\n\n## 2. Errors and inconsistencies\n\n${body}\n\n## 3. Notation\n\nIgnored error without a test.\n`;
const fixture = (source = "import { it, expect } from 'vitest'; it('corrected value', () => expect(2 + 2).toBe(4));") => {
  const root = mkdtempSync(join(tmpdir(), 'check-audit-'));
  roots.push(root);
  mkdirSync(join(root, 'tests'));
  writeFileSync(join(root, 'tests/value.test.ts'), source);
  return root;
};

describe('audit parser and reference validation', () => {
  it('counts each prose finding, bold inconsistency and corrected table row, with line numbers', () => {
    const markdown = document(`Method: recompute answers.\n\n### Note 01\n\nWrong value.\nCorrected to four. ${reference}\n\n### PS1\n\n| Ex | Corrected | Test |\n|---|---|---|\n| 1 | 4 | ${reference} |\n| 2 | 4 | ${reference} |\n\n### Other inconsistencies\n\n- **Wrong factor.** Correction. ${reference}\n\n- Notes overlap; choose one source.`);
    const entries = parseAudit(markdown);
    expect(entries.map(e => e.label)).toEqual(['Note 01', 'PS1: 1', 'PS1: 2', 'Other inconsistencies']);
    expect(entries[0].line).toBe(markdown.split('\n').indexOf('Wrong value.') + 1);
    expect(checkAudit(markdown, fixture())).toEqual({ count: 4, errors: [] });
    expect(parseAudit(markdown.replaceAll('\n', '\r\n'))).toEqual(entries);
  });

  it('requires a reference on every row and every prose entry, including section 1 corrections', () => {
    const markdown = document(`### Note\n\nNo reference.\n\n### PS1\n\n| Ex | Corrected |\n|---|---|\n| 1 | 4 |\n| 2 | 4 | ${reference} |`)
      .replace('## 2.', '| Ex | Corrected |\n|---|---|\n| 3 | 4 |\n\n## 2.');
    const result = checkAudit(markdown, fixture());
    expect(result.count).toBe(4);
    expect(result.errors).toHaveLength(3);
    expect(result.errors.every(e => /AUDIT\.md:\d+/.test(e))).toBe(true);
    expect(checkAudit(document(`### Other inconsistencies\n\n- **First.** ${reference}\n- **Second.** Missing test.`), fixture()).errors).toHaveLength(1);
  });

  it('rejects empty or missing audit sections instead of reporting zero successes', () => {
    expect(() => parseAudit('## 1. Coverage\n')).toThrow('section 2');
    expect(() => parseAudit('## 2. Errors\nWrong.')).toThrow('section 1');
    expect(() => parseAudit(document(''))).toThrow('No audited errors');
  });

  it('rejects missing files, names, malformed references and files outside tests', () => {
    const root = fixture();
    for (const [ref, message] of [
      [reference.replace('value.test.ts', 'missing.test.ts'), 'Missing or unreadable test file'],
      [reference.replace('corrected value', 'wrong title'), 'Missing test name'],
      ['Test: `tests/value.test.ts`', 'Expected Test:'],
      [reference.replace('tests/value.test.ts', 'src/value.test.ts'), 'under tests/'],
      [reference.replace('tests/value.test.ts', 'tests/../value.test.ts'), 'under tests/'],
      [`${reference}; Test: malformed`, 'Expected Test:'],
    ]) {
      expect(checkAudit(document(`Correction. ${ref}`), root).errors).toEqual([expect.stringContaining(message)]);
    }
  });

  it('requires the exact declared title, rejecting comments and partial matches', () => {
    const root = fixture("// it('corrected value', () => {});\nit('corrected value extended', () => {});");
    expect(checkAudit(document(`Correction. ${reference}`), root).errors).toEqual([expect.stringContaining('Missing test name')]);
  });

  it('validates every reference and supports multiline declarations and test.each title templates', () => {
    const root = fixture('test(\n"corrected value", () => {});\nit.each([1, 2])("case %s", () => {});');
    const second = 'Test: `tests/value.test.ts` — `case %s`';
    expect(checkAudit(document(`Correction. ${reference}; ${second}`), root).errors).toEqual([]);
    expect(checkAudit(document(`Correction. ${reference}; ${second.replace('case %s', 'absent')}`), root).errors).toHaveLength(1);
  });

  it('checks the real audit and runs the CLI from another working directory', () => {
    const result = checkAudit(readFileSync('docs/AUDIT.md', 'utf8'));
    expect(result.count).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
    const script = join(process.cwd(), 'scripts/check-audit.mjs');
    expect(execFileSync(process.execPath, [script], { cwd: tmpdir(), encoding: 'utf8' }).trim())
      .toBe(`Audit: ${result.count} audited errors, all with a test.`);
  });

  it('CLI exits nonzero and reports the audit line for a missing reference', () => {
    // Keep dependency resolution at the real module, but supply a fixture audit
    // through Node's filesystem loader hook. No repository files are mutated.
    const hook = `import { syncBuiltinESMExports } from 'node:module';
      import fs from 'node:fs';
      const original = fs.readFileSync;
      fs.readFileSync = (path, ...args) => String(path).endsWith('/docs/AUDIT.md')
        ? ${JSON.stringify(document('Wrong, without a reference.'))} : original(path, ...args);
      syncBuiltinESMExports();`;
    const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(hook)}`, 'scripts/check-audit.mjs'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/docs\/AUDIT\.md:\d+.*Expected Test:/);
  });
});
