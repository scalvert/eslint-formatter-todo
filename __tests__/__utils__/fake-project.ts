import { TodoConfig } from '@ember-template-lint/todo-utils';
import { execSync } from 'child_process';
import fixturify from 'fixturify';
import Project from 'fixturify-project';

const DEFAULT_ESLINT_CONFIG = `{
  "env": {
    "browser": true,
    "es2021": true
  },
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-alert": ["warn"],
    "no-unused-vars": [
      "error",
      {
        "vars": "all",
        "args": "after-used",
        "ignoreRestSiblings": true
      }
    ],
    "use-isnan": ["error"],
    "eqeqeq": [
      "error",
      "always",
      {
        "null": "ignore"
      }
    ],
    "no-plusplus": ["error"],
    "no-param-reassign": [
      "error",
      {
        "props": true,
        "ignorePropertyModificationsFor": [
          "acc",
          "accumulator",
          "e",
          "ctx",
          "context",
          "req",
          "request",
          "res",
          "response",
          "$scope",
          "staticContext"
        ]
      }
    ],
    "consistent-return": ["error"],
    "no-useless-return": ["error"],
    "quotes": [
      "error",
      "single",
      {
        "avoidEscape": true
      }
    ]
  }
}
`;

export class FakeProject extends Project {
  static getInstance(): FakeProject {
    const project = new this();

    project.addDevDependency('eslint', '^7.10.0');

    project.files['eslint-config.json'] = DEFAULT_ESLINT_CONFIG;

    return project;
  }

  constructor(name = 'fake-project', ...args: any[]) {
    super(name, ...args);

    this.pkg = Object.assign({}, this.pkg, {
      license: 'MIT',
      description: 'Fake project',
      repository: 'http://fakerepo.com',
    });
  }

  write(dirJSON: fixturify.DirJSON): void {
    Object.assign(this.files, dirJSON);
    this.writeSync();
  }

  writeTodoConfig(todoConfig: TodoConfig): void {
    this.pkg = Object.assign({}, this.pkg, {
      lintTodo: {
        daysToDecay: todoConfig,
      },
    });

    this.writeSync();
  }

  install(): void {
    const cmd = 'yarn install --silent';

    try {
      execSync(cmd, { cwd: this.baseDir });
    } catch {
      throw new Error(`Couldn't install dependencies using ${cmd}`);
    }
  }
}
