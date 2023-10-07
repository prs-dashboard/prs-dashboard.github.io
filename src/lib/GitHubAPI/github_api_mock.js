import mock_search_results from '../../../examples/response_search_2_repos.json' assert { type: "json" };

export
/**
 * mock getting requests from GitHub GraphQL API
 * by returning pre-defined set of PRs.
 */
class GitHubGraphQLMock {
    constructor (override_results = {}) {
      // need a deep copy so different instances do not modify same mock_search_results
      this.result = JSON.parse(JSON.stringify(mock_search_results));
      this.requests = [];
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
      this.requests.push({
        repo: repo,
        authors: authors,
        assignees: assignees,
        query: query,
        request_limit: request_limit,
        after_cursor: after_cursor
      });
      // console.log(this, `GitHubGraphQLMock.search(${repo}, ${authors}, ${assignees}, ${query}, ${request_limit}, ${after_cursor}) =>`, mock_search_results);

        let result = this.result;
        result.data.search.nodes = result.data.search.nodes.slice(0, request_limit);

        return result;
    }
};