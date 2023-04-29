import mock_search_results from '../../examples/response_search_2_repos.json';

export
/**
 * mock getting requests from GitHub GraphQL API
 * by returning pre-defined set of PRs.
 */
class GitHubGraphQLMock {
    constructor () {
    }

    async getRateLimit() {
        return JSON.parse(`
        {
            "data": {
              "rateLimit": {
                "limit": 5000,
                "remaining": 4993,
                "resetAt": "2023-04-29T06:41:17Z",
                "used": 7
              }
            }
          }`);
    }

    async search(repo, authors, assignees, query, request_limit, after_cursor) {
        console.log(this, `GitHubGraphQLMock.search(${repo}, ${authors}, ${assignees}, ${query}, ${request_limit}, ${after_cursor}) =>`, mock_search_results);

        return mock_search_results;
    }
};