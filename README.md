# prs-dashboard.github.io
Simple tool to visualize PRs of multiple authors to multiple repositories.
e.g. last [Altinity's PRs](https://prs-dashboard.github.io/?author=excitoon&quickhouse&author=zvonand&author=arthurpassos&author=filimonov&author=vzakaznikov&author=enmk&repo=Altinity/ClickHouse&repo=ClickHouse/ClickHouse:50&repo=ClickHouse/Clickhouse-cpp&repo=ClickHouse/ClickHouse-odbc)

## GitHub token and authorization
Requeres a github token to function, since it utilizes GitHub grapQL API. Scope of the token dictates what results you will see: e.g. there is no way of getting PRs private repos \ private organization authors with plain token.

Token is requested on startup and stored in local storage, which seems to be secure enought. If the future, integration with GitHub OAuth Device flow is possible (unfortunatelly GitHub doesn't support PKCE OAuth flow).

### Known issues
- code is ugly as hell
- filtering is messy and may accidentally show items that are not expected to be visible.
- no GUI for adding authors/repos, you have to edit an URL manually
- basically non existing error handling
- not checking if token from localStorage expired already


Please feel free to submit issues\PRs, I'd be happy to address those at some point.
