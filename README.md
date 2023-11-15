# wix-preview-tester

The wix-preview-tester uses a method called `refreshTestsConfigs` to preview local source code with the [Wix CLI](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli/working-with-the-wix-cli) and save `siteRevision` and `branchId` in a file named `wix-preview-tester.config.json`.

For example, by executing `refreshTestsConfigs` in the `pre-commit` of `.git/hooks`, you can keep `siteRevision` and `branchId` under source code management.

Furthermore, by using `getTestsConfig`, you can read this file to use Wix Preview URLs as a snapshot at the time of commit, and execute E2E tests on CI.

## Requirements

- [Git Integration & Wix CLI](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli/about-git-integration-wix-cli)
  - wix login - Log in to your Wix account

## Install
Add to package.json
```
{
  "devDependencies": {
    "wix-preview-tester": "git+https://github.com/hand-dot/wix-preview-tester.git"
  }
}
```

## Usage

node
```
const { setTestsConfig, getTestsConfig, refreshTestsConfigs } = require('wix-preview-tester');
```

CLI - run refreshTestsConfigs (require install local and npm link)
```
npx wix-preview-tester
```
