# Add Issue to Project (BETA) ➕

This GitHub [action](https://docs.github.com/en/actions) adds issues to the [Projects (beta)](https://github.com/features/issues).

## Usage
Create a workflow (eg: `.github/workflows/on-issue-open.yml`). See [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

You will need a project number. For example [`https://github.com/users/austenstone/projects/`*`5`*](https://github.com/users/austenstone/projects/5) the project number is *`5`*.

You will need to [create a PAT(Personal Access Token)](https://github.com/settings/tokens/new?scopes=admin:org) that has `admin:org` access so we can read/write to the project.

Add this PAT as a secret, see [Creating encrypted secrets for a repository](https://docs.github.com/en/enterprise-cloud@latest/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

If your project is part of an organization that has SAML enabled, see [Authorizing a personal access token for use with SAML single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).

### Organizations

#### Default Workflow for organization owned project
```yml
name: "Add Issue to Project"
on:
  issues:
    types: [opened]

jobs:
  add_issue_to_project:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/project-add-issue@main
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
          project_number: 1234
```

### Users

For user owned projects you must provide the `user` input in the workflow.

#### Default Workflow for user owned project
```yml
name: "Add Issue to Project"
on:
  issues:
    types: [opened]

jobs:
  add_issue_to_project:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/project-add-issue@v4
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
          user: ${{ github.repository_owner }}
          project_number: 1234
```

## Input Settings
Various inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | - | - |
| **token** | Token to use to authorize label changes. Typically the GITHUB_TOKEN secret | N/A |
| **project_number** | The project number. Get this from the URL. | N/A |
| organization | The organization that owns of the project. | _the repository owner_
| user | The user that owns of the project. | N/A

If you are using a user owned project board you must provide the `user` input.
