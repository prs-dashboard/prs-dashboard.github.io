import {doGitHubGraphQLRequest} from './doGitHubGraphQLRequest.js';

export async function searchPRs(request_repo, authors, assignees, query, request_limit, github_token) {
  const response = await doGitHubGraphQLRequest(searchPRsRequestBody(request_repo, authors, assignees, query, request_limit), github_token);
  // console.log(response);

  return response['data']['search']['nodes'];
}

function searchPRsRequestBody(request_repo, authors, assignees, query, request_limit) {
    let authors_clause = '';
    if (authors.length > 0) {
        authors_clause = 'author:' + authors.join(' author:');
    }

    let assignees_clause = '';
    if (assignees.length > 0) {
        assignees_clause = 'assignee:' + assignees.join(' assignee:');
    }

    if (!query)
        query = '';

    return `{ search(
      query: "repo:${request_repo} is:pr ${authors_clause} ${assignees_clause} sort:created-desc ${query}"
      type: ISSUE
      first: ${request_limit}
    ) {
      nodes {
          ... on PullRequest {
            number
            url
            title
            createdAt
            state
            isDraft
            updatedAt
            mergeable
            baseRefName
            changedFiles
            files(last: 60) {
              nodes {
                changeType
                path
                deletions
                additions
              }
              totalCount
            }
            labels (last: 20) {
              totalCount
              nodes {
                name
                color
              }
            }
            reviews(last: 1) {
              edges {
                node {
                  id
                  state
                }
              }
            }
            author {
              avatarUrl
              login
              url
              ... on User {
                name
              }
              ... on Organization {
                id
                name
              }
              ... on EnterpriseUserAccount {
                name
              }
            }
            commits(last: 1) {
              totalCount
              edges {
                node {
                  commit {
                    commitUrl
                    oid
                    statusCheckRollup {
                      state
                    }
                  }
                }
              }
            }
            assignees(first: 10) {
              nodes {
                login
                name
                avatarUrl
                url
              }
            }
            reviewRequests(first: 100) {
              nodes {
                requestedReviewer {
                  ... on User {
                    name
                    login
                    avatarUrl
                    url
                  }
                }
              }
            }
            comments(last: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
              totalCount
              nodes {
                author {
                  ... on User {
                    name
                  }
                  ... on Organization {
                    id
                    name
                  }
                  ... on EnterpriseUserAccount {
                    name
                  }
                }
                updatedAt
                body
              }
            }
          }
        }
      }
  }`
}
