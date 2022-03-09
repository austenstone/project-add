import * as core from '@actions/core'
import * as github from '@actions/github'

type ClientType = ReturnType<typeof github.getOctokit>

const run = async (): Promise<void> => {
  if (!github.context) return core.setFailed('No GitHub context.')
  if (!github.context.payload) return core.setFailed('No payload. Make sure this is an issue event.')
  if (!github.context.payload.issue) return core.setFailed('No issue found in the payload. Make sure this is an issue event.')
  const token = core.getInput('github-token') || process.env.GITHUB_TOKEN
  const projectNumber = parseInt(core.getInput('project-number'))
  const organization = core.getInput('organization') || github.context.repo.owner
  const user = core.getInput('user')
  const issue = github.context.payload.issue

  if (!token) return core.setFailed('No input \'token\'')
  if (!projectNumber) return core.setFailed('No input \'projectNumber\'')
  if (!issue) return core.setFailed('No issue in event context')

  const octokit: ClientType = github.getOctokit(token)

  core.startGroup(`GraphQL get project number \u001b[1m${projectNumber}\u001B[m`)
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
  const headers = { 'GraphQL-Features': 'projects_next_graphql', }
  const projectNextResponse: any = await octokit.graphql(projectQuery)
  core.info(JSON.stringify(projectNextResponse, null, 2))
  core.endGroup()

  const projectNext = projectNextResponse?.organization?.projectNext || projectNextResponse?.user?.projectNext

  if (!projectNext?.id) {
    core.setFailed(`Project number \u001b[1m${projectNumber}\u001B[m not found for login \u001b[1m${organization || user}\u001B[m.
Check the number of the project and that it is owned by \u001b[1m${organization || user}\u001B[m.
EX: \u001b[1mhttps://github.com/orgs/github/projects/5380\u001B[m has the number \u001b[1m5380\u001B[m.`)
    return
  }

  core.startGroup(`GraphQL add issue \u001b[1m${issue.title}\u001B[m to project \u001b[1m${projectNext.title}\u001B[m`)
  const result: any = await octokit.graphql({
    query: `mutation {
      addProjectNextItem(
        input: { contentId: "${issue.node_id}", projectId: "${projectNext.id}" }
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
    core.setFailed(`Failed to add issue to project '${projectNext.title}'.`)
    return
  }

  const link = `https://github.com/${user ? ('users/' + user) : ('orgs/' + (organization))}/projects/${projectNumber}`
  core.info(`✅ Successfully added issue \u001b[1m${issue.title}\u001B[m to project \u001b[1m${projectNext.title}\u001B[m.
${link}`)
}

export default run
