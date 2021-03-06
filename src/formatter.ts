import {
  applyTodoChanges,
  buildTodoData,
  getSeverity,
  getTodoBatchesSync,
  getTodoConfig,
  getTodoStorageDirPath,
  readTodosSync,
  TodoData,
  todoFilePathFor,
  todoStorageDirExists,
  WriteTodoOptions,
  writeTodosSync,
  _buildTodoDatum,
} from '@ember-template-lint/todo-utils';

import hasFlag from 'has-flag';
import { format } from './format';
import { getBaseDir } from './get-base-dir';

import type { ESLint, Linter } from 'eslint';
import { Severity, TodoFormatterOptions, TodoResultMessage } from './types';

export function formatter(results: ESLint.LintResult[]): string {
  let todoInfo;
  const updateTodo = process.env.UPDATE_TODO === '1';
  const includeTodo = process.env.INCLUDE_TODO === '1';
  const writeTodoOptions: Partial<WriteTodoOptions> = {
    todoConfig: getTodoConfig(process.cwd()) ?? {},
    shouldRemove: (todoDatum: TodoData) => todoDatum.engine === 'eslint',
  };

  if (
    (process.env.TODO_DAYS_TO_WARN || process.env.TODO_DAYS_TO_ERROR) &&
    !updateTodo
  ) {
    throw new Error(
      'Using `TODO_DAYS_TO_WARN` or `TODO_DAYS_TO_ERROR` is only valid when the `UPDATE_TODO` environment variable is being used.'
    );
  }

  if (updateTodo) {
    const [added, removed] = writeTodosSync(
      getBaseDir(),
      results,
      writeTodoOptions
    );

    todoInfo = {
      added,
      removed,
      todoConfig: writeTodoOptions.todoConfig,
    };
  }

  return report(results, {
    updateTodo,
    includeTodo,
    todoInfo,
    writeTodoOptions,
  });
}

/**
 * Mutates all errors present in the todo dir to todos in the results array.
 *
 * @param results ESLint results array
 */
export function transformResults(
  baseDir: string,
  results: ESLint.LintResult[],
  existingTodos: Map<string, TodoData>
): void {
  results.forEach((result) => {
    (result.messages as TodoResultMessage[]).forEach((message) => {
      if (message.severity !== Severity.error) {
        return;
      }

      // we only mutate errors that are present in the todo map, so check if it's there first
      const todoDatum = _buildTodoDatum(
        baseDir,
        result,
        message as Linter.LintMessage
      );
      const todo = existingTodos.get(todoFilePathFor(todoDatum));

      if (todo === undefined) {
        return;
      }

      const severity = getSeverity(todo);

      if (severity === Severity.error) {
        return;
      }

      if (severity === Severity.warn) {
        result.warningCount = result.warningCount + 1;

        if (message.fix) {
          result.fixableWarningCount = result.fixableWarningCount + 1;
          result.fixableErrorCount -= 1;
        }
      } else {
        result.todoCount = Number.isInteger(result.todoCount)
          ? result.todoCount + 1
          : 1;

        if (message.fix) {
          result.fixableTodoCount = Number.isInteger(result.fixableTodoCount)
            ? result.fixableTodoCount + 1
            : 1;
          result.fixableErrorCount -= 1;
        }
      }
      message.severity = severity;

      result.errorCount -= 1;
    });
  });
}

function report(results: ESLint.LintResult[], options: TodoFormatterOptions) {
  const baseDir = getBaseDir();

  if (todoStorageDirExists(baseDir)) {
    const existingTodoFiles = readTodosSync(baseDir);
    const [, todosToRemove, existingTodos] = getTodoBatchesSync(
      buildTodoData(baseDir, results),
      existingTodoFiles,
      options.writeTodoOptions
    );

    if (todosToRemove.size > 0) {
      if (hasFlag('fix')) {
        applyTodoChanges(
          getTodoStorageDirPath(baseDir),
          new Map(),
          todosToRemove
        );
      } else {
        todosToRemove.forEach((todo) => {
          pushResult(results, todo);
        });
      }
    }

    transformResults(baseDir, results, existingTodos);
  }

  return format(results, options);
}

function pushResult(results: ESLint.LintResult[], todo: TodoData) {
  const resultForFile = results.find(
    (r: ESLint.LintResult) => r.filePath === todo.filePath
  );
  const result: Linter.LintMessage = {
    ruleId: 'invalid-todo-violation-rule',
    message: `Todo violation passes \`${todo.ruleId}\` rule. Please run \`--fix\` to remove this todo from the todo list.`,
    severity: 2,
    column: 0,
    line: 0,
  };

  if (resultForFile) {
    resultForFile.messages.push(result);
    resultForFile.errorCount += 1;
  } else {
    results.push({
      filePath: todo.filePath,
      messages: [result],
      errorCount: 1,
      warningCount: 0,
      todoCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      fixableTodoCount: 0,
      usedDeprecatedRules: [],
    });
  }
}
