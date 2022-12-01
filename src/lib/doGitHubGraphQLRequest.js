export async function doGitHubGraphQLRequest(request, github_token) {
    github_token = github_token.trim();

    let response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${github_token}`,
        },
        // The payload must contain a string called query
        // https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#communicating-with-graphql
        body: JSON.stringify({ query: request })
    });

    let result = await response.json();
    // console.log(result);

    return result;
}