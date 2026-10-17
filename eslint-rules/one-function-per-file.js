// Architecture rule: a component file holds exactly one top-level function — the component.
// Helpers belong in the feature's utils/ or hooks/ folder (one per file as well).
// Functions nested inside the component (event handlers, callbacks) are allowed.

const isFn = (node) =>
  node?.type === 'FunctionDeclaration' ||
  node?.type === 'ArrowFunctionExpression' ||
  node?.type === 'FunctionExpression';

function topLevelFunctions(statement) {
  const decl =
    statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
      ? statement.declaration
      : statement;
  if (!decl) return [];
  if (isFn(decl)) return [decl];
  if (decl.type === 'VariableDeclaration') {
    return decl.declarations.filter((d) => isFn(d.init)).map((d) => d.init);
  }
  return [];
}

export default {
  rules: {
    'one-function-per-file': {
      meta: {
        type: 'suggestion',
        messages: {
          extra: 'Only one function per component file — move helpers to utils/ or hooks/.',
        },
        schema: [],
      },
      create(context) {
        return {
          Program(program) {
            const fns = program.body.flatMap(topLevelFunctions);
            for (const fn of fns.slice(1)) context.report({ node: fn, messageId: 'extra' });
          },
        };
      },
    },
  },
};
