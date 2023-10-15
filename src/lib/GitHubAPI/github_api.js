import { graphql } from "@octokit/graphql";

export
class GitHubGraphQLError extends Error {
    constructor(text, response_errors=[]) {
        super(`GitHub API error: ${text} ${response_errors.map(e => e.message).join(', ')}`);
    }

    static throwIfError(response, result) {
        if (response && !response.ok)
            throw new GitHubGraphQLError(`${response.status} : ${JSON.stringify(result)}`, []);

        if (result && result['errors'])
            throw new GitHubGraphQLError('', result['errors']);
    }
}

export
class GitHubGraphQL {
    constructor (access_token /* string or Promise */) {
        this.access_token = access_token;
    }

    async request(body /* request string */) {
        this.access_token = await Promise.resolve(this.access_token);

        console.log('API request: ', body);
        const result = await graphql(
            body,
            {

                headers: {
                  authorization: `token ${this.access_token}`,
                },
            },
        );
        // let response = await fetch('https://api.github.com/graphql', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${this.access_token}`,
        //         'Sec-Fetch-Mode': 'cors',
        //     },
        //     // The payload must contain a string called query
        //     // https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#communicating-with-graphql
        //     body: JSON.stringify({ query: body })
        // });

        // let result = await response.json();
        console.log('API result: ', result);
        GitHubGraphQLError.throwIfError(undefined, result);

        return result;
    }

    async getRateLimit() {
        return this.request('query { rateLimit { limit remaining resetAt used } }');
    }

    async search(repo, authors, assignees, query, request_limit, after_cursor) {
        let repo_clause = '';
        if (repo)
            repo_clause = `repo:${repo}`;

        let authors_clause = '';
        if (authors.length > 0) {
            authors_clause = 'author:' + authors.join(' author:');
        }

        let assignees_clause = '';
        if (assignees && assignees.length > 0) {
            assignees_clause = 'assignee:' + assignees.join(' assignee:');
        }

        if (!query)
            query = '';

        var after_clause = '';
        if (after_cursor)
            after_clause = `after: "${after_cursor}"`;

        const request_body = `{
        search(
                query: "${repo_clause} is:pr ${authors_clause} ${assignees_clause} sort:created-desc ${query}"
                type: ISSUE
                first: ${request_limit}
                ${after_clause}
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
            pageInfo {
                endCursor
                hasNextPage
            }
        }
    }`;

        const response = await this.request(request_body);
        console.log('search response: ', response);
        return response.search;
    }
};