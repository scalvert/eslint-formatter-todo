# @scalvert/eslint-formatter-todo

![CI Build](https://github.com/scalvert/eslint-formatter-todo/workflows/CI%20Build/badge.svg)
[![npm version](https://badge.fury.io/js/%40scalvert%2Feslint-formatter-todo.svg)](https://badge.fury.io/js/%40scalvert%2Feslint-formatter-todo)
[![License](https://img.shields.io/npm/l/@scalvert/eslint-formatter-todo.svg)](https://github.com/@scalvert/eslint-formatter-todo/blob/master/package.json)
![Dependabot](https://badgen.net/badge/icon/dependabot?icon=dependabot&label)
![Volta Managed](https://img.shields.io/static/v1?label=volta&message=managed&color=yellow&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAeQC6AMEpK7AhAAAACXBIWXMAAAsSAAALEgHS3X78AAAAB3RJTUUH5AMGFS07qAYEaAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAFmSURBVDjLY2CgB/g/j0H5/2wGW2xyTAQ1r2DQYOBgm8nwh+EY6TYvZtD7f9rn5e81fAGka17GYPL/esObP+dyj5Cs+edqZsv/V8o//H+z7P+XHarW+NSyoAv8WsFszyKTtoVBM5Tn7/Xys+zf7v76vYrJlPEvAwPjH0YGxp//3jGl/L8LU8+IrPnPUkY3ZomoDQwOpZwMv14zMHy8yMDwh4mB4Q8jA8OTgwz/L299wMDyx4Mp9f9NDAP+bWVwY3jGsJpB3JaDQVCEgYHlLwPDfwYWRqVQJgZmHoZ/+3PPfWP+68Mb/Pw5sqUoLni9ipuRnekrAwMjA8Ofb6K8/PKBF5nU7RX+Hize8Y2DOZTP7+kXogPy1zrH+f/vT/j/Z5nUvGcr5VhJioUf88UC/59L+/97gUgDyVH4YzqXxL8dOs/+zuFLJivd/53HseLPPHZPsjT/nsHi93cqozHZue7rLDYhUvUAADjCgneouzo/AAAAAElFTkSuQmCC&link=https://volta.sh)
![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
[![Code Style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](#badge)

> An ESLint formatter that can report errors as todos, which can be deferred and fixed at a later time.

Linting is a fundamental tool to help ensure the quality of a codebase. Ensuring there are as few linting errors as possible (ideally 0), is a useful measure of a baseline of code hygiene.

It's common to leverage linting not just for syntax adherence, but also to direct developers to employ standardized patterns. As such, it's a fairly routine activity to introduce new lint rules into a codebase. This introduction, while necessary, can cause unintended friction, such as:

- new lint errors being introduced where they previously didn't exist
- causing unintended delays to shipping new fixes and features
- an "all or nothing" approach, where new rules require fixing before rollout

Having the ability to identify violations as `todo`s allows for this incremental roll out, while providing tools that allow maintainers to view the full list of todo violations.

This formatter allows you to introduce new rules immediately, without blocking commits, by taking a snapshot of errors and transforming them to todos. Errors not found in this snapshot will continue to reported as errors.

## Usage

Todos are stored in a `.lint-todo` directory that should be checked in with other source code. Each error generates a unique file, allowing for multiple errors within a single file to be resolved individually with minimal conflicts.

To convert errors to todos, you can use the `UPDATE_TODO` environment variable. This will convert all active errors to todos, hiding them from the linting output.

```bash
UPDATE_TODO=1 eslint --format @scalvert/eslint-formatter-todo
```

If you want to see todos as part of `eslint`'s output, you can include them

<img src="docs/post-todo.png" style="background-color: #fff" />

If an error is fixed manually, `eslint` will let you know that there's an outstanding `todo` file. You can remove this file by running `--fix`

```bash
eslint . --format @scalvert/eslint-formatter-todo --fix
```

### Configuring Due Dates

Todos can be created with optional due dates. These due dates allow for todos to, over a period of time, 'decay' the severity to a **warning** and/or **error** after a certain date. This helps ensure that todos are created but not forgotten, and can allow for better managing incremental roll-outs of large-scale or slow-to-fix rules.

Due dates can be configured in one of two ways, but both specify integers for `warn` and `error` to signify the number of days from the `todo` created date to decay the severity.

:bulb: Both `warn` and `error` are optional. The value for `error` should be greater than the value of `warn`.

1. Via package.json configuration

```json
{
  "lintTodo": {
    "decayDays": {
      "warn": 5,
      "error": 10
    }
  }
}
```

1. Via environment variables

```bash
UPDATE_TODO='1' TODO_DAYS_TO_WARN="5" TODO_DAYS_TO_ERROR="10" eslint . --format @scalvert/eslint-formatter-todo
```

In order of precedence, environment variables override package.json configuration values.

For example, if you've specified the following values in the package.json configuration...

```json
{
  "lintTodo": {
    "decayDays": {
      "warn": 5,
      "error": 10
    }
  }
}
```

...and you supply the following environment variables:

```bash
UPDATE_TODO='1' TODO_DAYS_TO_WARN= '2' eslint . --format @scalvert/eslint-formatter-todo
```

...the todos will be created with a `warn` date 2 days from the created date, and an `error` date 10 days from the created date.

### Due Date Workflows

Converting errors to todos with `warn` and `error` dates that transition the `todo` to `warn` after 10 days and `error` after 20 days:

```bash
UPDATE_TODO='1' TODO_DAYS_TO_WARN= '10' TODO_DAYS_TO_ERROR='20' eslint . --format @scalvert/eslint-formatter-todo
```

Converting errors to todos with `warn` and `error` dates that transition the `todo` `error` after 20 days, but doesn't include a `warn` date:

```bash
UPDATE_TODO='1' TODO_DAYS_TO_WARN= '' TODO_DAYS_TO_ERROR='20' eslint . --format @scalvert/eslint-formatter-todo
```
