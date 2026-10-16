import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

/**
 * Sections 1–2 contain coverage tables, correction tables and prose findings.
 * Each correction row and prose paragraph is one entry. Coverage inventories,
 * the method paragraph and uncorrected duplication/notation bullets are context.
 * Reference format: Test: `tests/file.test.ts` — `exact declared test title`.
 */
export function parseAudit(markdown) {
  const entries = [];
  const sections = new Set();
  let section;
  let heading = '';
  let correctionTable = false;
  let paragraph;
  const flush = () => {
    if (paragraph) entries.push(paragraph);
    paragraph = undefined;
  };
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    const top = line.match(/^##\s+(\d+)\.\s+(.+)/);
    const sub = line.match(/^###\s+(.+)/);
    if (top || sub) {
      flush();
      correctionTable = false;
      if (top) {
        section = Number(top[1]);
        sections.add(section);
        heading = top[2];
      } else heading = sub[1];
      continue;
    }
    if (section !== 1 && section !== 2) continue;
    if (!line.trim()) { flush(); correctionTable = false; continue; }
    if (line.startsWith('|')) {
      flush();
      if (/\|\s*Corrected\s*\|/.test(line)) { correctionTable = true; continue; }
      if (/^\|[\s:|\-]+\|$/.test(line)) continue;
      if (correctionTable) entries.push({ line: index + 1, label: `${heading}: ${line.split('|')[1].trim()}`, text: line });
      continue;
    }
    correctionTable = false;
    if (section === 1 || /^Method:/.test(line)) continue;
    if (heading === 'Other inconsistencies' && /^- (?!\*\*)/.test(line)) { flush(); continue; }
    if (/^- /.test(line)) flush();
    if (!paragraph) paragraph = { line: index + 1, label: heading, text: line };
    else paragraph.text += `\n${line}`;
  }
  flush();
  for (const required of [1, 2]) {
    if (!sections.has(required)) throw new Error(`Missing AUDIT.md section ${required}`);
  }
  if (!entries.length) throw new Error('No audited errors found in sections 1–2');
  return entries;
}

// Read actual declarations, so a comment or assertion containing the title is
// not enough. Parameterised tests may reference their literal title template.
function testTitles(source, filename) {
  const titles = new Set();
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(tree);
      const title = node.arguments[0];
      if (/^(?:it|test)(?:\.(?:only|skip|todo|each)|\s*\()/.test(callee) || /^(it|test)$/.test(callee)) {
        if (title && (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title))) titles.add(title.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return titles;
}

export function checkAudit(markdown, root = projectRoot) {
  const entries = parseAudit(markdown);
  const errors = [];
  const files = new Map();
  for (const entry of entries) {
    const report = (message) => errors.push(`docs/AUDIT.md:${entry.line} (${entry.label}): ${message}`);
    const references = [...entry.text.matchAll(/Test:\s*`([^`]+)`\s*—\s*`([^`]+)`/g)];
    if (!references.length || references.length !== (entry.text.match(/\bTest:/g) ?? []).length) {
      report('Expected Test: `tests/file.test.ts` — `exact declared test title`');
      continue;
    }
    for (const [, filename, title] of references) {
      if (!/^tests\/(?:[\w.-]+\/)*[\w.-]+\.test\.[cm]?[jt]sx?$/.test(filename) || filename.split('/').includes('..')) {
        report(`Test file must be a test under tests/: ${filename}`);
        continue;
      }
      if (!files.has(filename)) {
        try { files.set(filename, testTitles(readFileSync(resolve(root, filename), 'utf8'), filename)); }
        catch { files.set(filename, null); }
      }
      const titles = files.get(filename);
      if (!titles) report(`Missing or unreadable test file: ${filename}`);
      else if (!titles.has(title)) report(`Missing test name in ${filename}: ${title}`);
    }
  }
  return { count: entries.length, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { count, errors } = checkAudit(readFileSync(resolve(projectRoot, 'docs/AUDIT.md'), 'utf8'));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Audit: ${count} audited errors, all with a test.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
