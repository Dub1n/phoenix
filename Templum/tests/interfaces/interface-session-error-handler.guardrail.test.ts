import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

const rootDir = path.resolve(__dirname, '..', '..');

const targetFiles = [
  'src/interfaces/cli-adapter.ts',
  'src/interfaces/vscode-adapter.ts',
  'src/session/templum-universal-session-manager.ts',
];

const extractCatchClauses = (sourceFile: ts.SourceFile): ts.CatchClause[] => {
  const clauses: ts.CatchClause[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCatchClause(node)) {
      clauses.push(node);
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return clauses;
};

const catchClauseHasErrorHandler = (clause: ts.CatchClause, sourceFile: ts.SourceFile): boolean => {
  let handled = false;

  const visit = (node: ts.Node): void => {
    if (handled) {
      return;
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const callee = node.expression;
      if (
        callee.expression.getText(sourceFile) === 'ErrorHandler' &&
        callee.name.getText(sourceFile) === 'handle'
      ) {
        handled = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(clause.block, visit);
  return handled;
};

describe('Interface/session error handler guardrail', () => {
  it('flags catch clauses without ErrorHandler.handle', () => {
    const offenders: Array<{ file: string; line: number; snippet: string }> = [];

    for (const relativePath of targetFiles) {
      const filePath = path.join(rootDir, relativePath);
      const sourceText = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );

      for (const catchClause of extractCatchClauses(sourceFile)) {
        if (!catchClauseHasErrorHandler(catchClause, sourceFile)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(catchClause.getStart());
          const snippet = catchClause.getFullText(sourceFile).split('\n').slice(0, 3).join(' ').trim();
          offenders.push({
            file: relativePath,
            line: line + 1,
            snippet,
          });
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
