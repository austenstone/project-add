import * as core from '@actions/core'
import * as github from '@actions/github'

type ClientType = ReturnType<typeof github.getOctokit>



const run = async (): Promise<void> => {
  if (!github.context) return core.setFailed('No GitHub context.')
  if (!github.context.payload) return core.setFailed('No event. Make sure this is an issue or pr event.')
  const token = core.getInput('github-token') || process.env.GITHUB_TOKEN
  const projectNumber = parseInt(core.getInput('project-number'))
  const organization = core.getInput('organization') || github.context.repo.owner
  const user = core.getInput('user')
  const login = organization || user;
  const issue = github.context.payload.issue
  const pr = github.context.payload.pull_request
  const headers = { 'GraphQL-Features': 'projects_next_graphql', }
  const projectGet = async (projectNumber: number, organization?: string, user?: string): Promise<any> => {
    let projectQuery
    if (user) {
      projectQuery = `{
        user(login: "${user}") {
          projectNext(number: ${projectNumber}) {
            title,
            id
          }
        }
      }`
    } else if (organization) {
      projectQuery = `{
        organization(login: "${organization}") {
          projectNext(number: ${projectNumber}) {
            title,
            id
          }
        }
      }`
    } else {
      core.setFailed('No input \'organization\' or \'user\'')
    }
    const projectNextResponse: any = await octokit.graphql(projectQuery)
    return projectNextResponse;
  }
  const projectAdd = async (projectId: string, contentId: string): Promise<string> => {
    const result: any = await octokit.graphql({
      query: `mutation {
        addProjectNextItem(
          input: { contentId: "${contentId}", projectId: "${projectId}" }
        ) {
          projectNextItem {
            id
          }
        }
      }`,
      headers
    })
    return result?.addProjectNextItem?.projectNextItem?.id;
  }
  const projectFieldsGet = async (projectId: string): Promise<any> => {
    const result: any = await octokit.graphql({
      query: `{
        node(id: "${projectId}") {
          ... on ProjectNext {
            fields(first: 20) {
              nodes {
                id
                name
                settings
              }
            }
          }
        }
      }`,
      headers
    })
    return result?.ProjectNext?.fields;
  }
  const projectFieldUpdate = async (projectId: string, itemId: string, fieldId: string, value: any): Promise<any> => {
    const result: any = await octokit.graphql({
      query: `mutation {
        updateProjectNextItemField(
          input: {projectId: "${projectId}", itemId: "${itemId}", fieldId: "${fieldId}", value: ${JSON.stringify(value)}}
        ) {
          projectNextItem {
            id
          }
        }
      }`,
      headers
    })
    return result?.updateProjectNextItemField?.projectNextItem?.id;
  }
  
  if (!token) return core.setFailed('No input \'token\'')
  if (!projectNumber) return core.setFailed('No input \'projectNumber\'')
  if (!issue && !pr) return core.setFailed('No issue or pr in event context')

  const node_id = issue?.node_id || pr?.node_id
  if (!node_id) return core.setFailed('Can\'t find \'node_id\' in event context')
  const type = issue ? 'issue' : 'pull request';
  const title = issue ? issue.title : pr?.title;

  const octokit: ClientType = github.getOctokit(token)

  core.startGroup(`Get project number \u001b[1m${projectNumber}\u001B[m`)
  const projectNextResponse = await projectGet(projectNumber, organization, user);
  core.info(JSON.stringify(projectNextResponse, null, 2))
  core.endGroup()

  const projectNext = projectNextResponse?.organization?.projectNext || projectNextResponse?.user?.projectNext

  if (!projectNext?.id) {
    core.setFailed(`Project number \u001b[1m${projectNumber}\u001B[m not found for login \u001b[1m${login}\u001B[m.
Check the number of the project and that it is owned by \u001b[1m${login}\u001B[m.
EX: \u001b[1mhttps://github.com/orgs/github/projects/1234\u001B[m has the number \u001b[1m1234\u001B[m.`)
    return
  }

  core.startGroup(`Add ${type} \u001b[1m${title}\u001B[m to project \u001b[1m${projectNext.title}\u001B[m`)
  const itemId = await projectAdd(projectNext.id, node_id);
  core.info(JSON.stringify(itemId, null, 2))
  core.endGroup()

  if (itemId) {
    core.setFailed(`Failed to add ${type} to project '${projectNext.title}'.`)
    return
  }

  const fields = await projectFieldsGet(projectNext.id);

  const fieldsToMutate = fields.filter(())

  // const updatedFieldId = projectFieldUpdate(projectNext.id, itemId, fieldId, value);

  const link = `https://github.com/${user ? 'users/' + user : 'orgs/' + organization}/projects/${projectNumber}`
  core.info(`✅ Successfully added ${type} \u001b[1m${title}\u001B[m to project \u001b[1m${projectNext.title}\u001B[m.
${link}`)
}

export default run
