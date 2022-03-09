import * as core from '@actions/core';
import * as github from '@actions/github';

type ClientType = ReturnType<typeof github.getOctokit>;

const run = async (): Promise<void> => {
  if (!github.context) return core.setFailed('No GitHub context.');
  if (!github.context.payload) return core.setFailed('No payload. Make sure this is an issue event.');
  if (!github.context.payload.issue) return core.setFailed('No issue found in the payload. Make sure this is an issue event.');
  const token = core.getInput('token');
  const projectNumber = parseInt(core.getInput('project_number'));
  const owner = core.getInput('owner ') || github.context.repo.owner;
  const octokit: ClientType = github.getOctokit(token);
  const issue = github.context.payload.issue;

  if (!projectNumber) return core.setFailed('No input \'projectNumber\'');
  if (!issue) return core.setFailed('No issue in event context');

  core.startGroup(`GraphQL get project number \u001b[1m${projectNumber}\u001B[m`);
  const headers = { 'GraphQL-Features': 'projects_next_graphql', }
  const projectNext: any = await octokit.graphql(`{
    organization(login: "${owner}") {
      projectNext(number: ${projectNumber}) {
        title,
        id
      }
    }
  }`)
  core.info(JSON.stringify(projectNext, null, 2))
  core.endGroup()

  if (!projectNext?.organization?.projectNext?.id) {
    core.setFailed(`Project number \u001b[1m${projectNumber}\u001B[m not found for login \u001b[1m${owner}\u001B[m.
  Check the number of the project and that it is owned by \u001b[1m${owner}\u001B[m.
  EX: \u001b[1mhttps://github.com/orgs/github/projects/5380\u001B[m has the number \u001b[1m5380\u001B[m.`)
    return
  }

  core.startGroup(`GraphQL add issue \u001b[1m${issue.title}\u001B[m to project \u001b[1m${projectNext.organization.projectNext.title}\u001B[m`);
  const result: any = await octokit.graphql({
    query: `mutation {
      addProjectNextItem(
        input: { contentId: "${issue.node_id}", projectId: "${projectNext.organization.projectNext.id}" }
      ) {
        projectNextItem {
          id
        }
      }
    }`,
    headers
  })
  core.info(JSON.stringify(result, null, 2))
  core.endGroup()

  if (!result?.addProjectNextItem?.projectNextItem?.id) {
    core.setFailed(`Failed to add issue to project '${projectNext.organization.projectNext.title}'.`)
    return
  }

  core.info(`✅ Successfully added issue \u001b[1m${issue.title}\u001B[m to project \u001b[1m${projectNext.organization.projectNext.title}\u001B[m.
  https://github.com/orgs/github/projects/${projectNumber}`);
};

export default run;
