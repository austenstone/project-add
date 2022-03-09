# Issue to Project

This GitHub [action](https://docs.github.com/en/actions) adds issues to the [Projects (beta)](https://github.com/features/issues).

## Usage
Create a workflow (eg: `.github/workflows/on-issue-open.yml`). See [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

#### Default Workflow
```yml
name: "Issue to project"
on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/project-add-issue@main
        with:
          token: "${{ secrets.GITHUB_TOKEN }}"
          project_next_number: 1234
```

## Input Settings
Various inputs are defined in [`action.yml`](action.yml) to let you configure the labeler:
See the [Classifications API reference](https://beta.openai.com/docs/api-reference/classifications) for more information.

| Name | Description | Default |
| --- | - | - |
| **token** | Token to use to authorize label changes. Typically the GITHUB_TOKEN secret | N/A |
| **project_next_number** | The project number. Get this from the URL. | N/A |
| owner | The owner of the project board. | _the repository owner_
