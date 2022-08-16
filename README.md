# prs-dashboard.github.io
![image](https://user-images.githubusercontent.com/1110183/184915444-9c7aa72b-bc82-4664-9187-9402ba51be9b.png)


Automation tool to visualize GitHub search results in a dashboard.

Useful for tracking PRs of multiple authors on multiple repositories in a visual way.
Basically it just performs a multiple GitHub searches on your behalf and visualizes results.

Based on some bad piece of HTML, JavaScript and [GitHub GraphQL API](https://docs.github.com/en/graphql) duck-taped together.


Quick example: [last Altinity's PRs](https://prs-dashboard.github.io/?author=excitoon&author=quickhouse&author=zvonand&author=arthurpassos&author=filimonov&author=vzakaznikov&author=enmk&repo=Altinity/ClickHouse&repo=ClickHouse/ClickHouse:50&repo=ClickHouse/Clickhouse-cpp&repo=ClickHouse/ClickHouse-odbc)
(note that you would require a [live GitHub token to see any results](https://docs.github.com/en/enterprise-server@3.4/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token))

## Setting repositories and authors

Both repos/PR authors are set via URL queryString `https://prs-dashboard.github.io/?params`: e.g.
[`https://prs-dashboard.github.io/?author=enmk&repo=ClickHouse/ClickHouse`](https://prs-dashboard.github.io/?author=enmk&repo=ClickHouse/ClickHouse)
- Use `author=` to specify author GitHub login (case insensitive), there could be multiple `author` parameters (or none).
- Use `repo=` to specify GitHub repository (case insensitive), there could be multiple `repo=` parameters (at least 1).
- One can also specify how many PRs to fetch from repo by appending `:NUMBER` to the repo name: [`https://prs-dashboard.github.io/?author=enmk&repo=ClickHouse/ClickHouse:50`](https://prs-dashboard.github.io/?author=enmk&repo=ClickHouse/ClickHouse:50)

Right now GitHub allows up to 99 PRs from repo per request, so you can set anything from 1 to 99, 10 is default.


### Examples
There could be multiple authors and multiple repositories at once: 
[`https://prs-dashboard.github.io/?author=excitoon&author=enmk&repo=Altinity/ClickHouse&repo=ClickHouse/ClickHouse:50&repo=ClickHouse/Clickhouse-cpp`](https://prs-dashboard.github.io/?author=excitoon&author=enmk&repo=Altinity/ClickHouse&repo=ClickHouse/ClickHouse:50&repo=ClickHouse/Clickhouse-cpp)

Or you can completely omit authors and get unfiltered list of PRs from repository: [`https://prs-dashboard.github.io/?repo=Altinity/ClickHouse&repo=ClickHouse/ClickHouse:50&repo=ClickHouse/Clickhouse-cpp`](https://prs-dashboard.github.io/?repo=Altinity/ClickHouse&repo=ClickHouse/ClickHouse:50&repo=ClickHouse/Clickhouse-cpp)


## GitHub token and authorization
Requires a GitHub token to function, since it utilizes GitHub grapQL API. Scope of the token dictates what results you will see: e.g. there is no way of getting PRs private repos \ private organization authors with plain token.

Token is requested on startup and stored in local storage, which seems to be secure enough. If the future, integration with GitHub OAuth Device flow is possible (unfortunately GitHub doesn't support PKCE OAuth flow).

### Known issues
- code is ugly as hell
- filtering is messy and may accidentally show items that are not expected to be visible.
- no GUI for adding authors/repos, you have to edit an URL manually
- basically non existing error handling
- not checking if token from localStorage expired already


Please feel free to submit issues\PRs, I'd be happy to address those at some point.
