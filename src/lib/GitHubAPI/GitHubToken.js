import { GitHubGraphQL } from './github_api.js';

export async function getGitHubToken(token_storage_prefix) {
    const github_token_storage_name = token_storage_prefix && token_storage_prefix.length > 0 ? token_storage_prefix + ':github_token' : 'github_token';

    let token = localStorage.getItem(github_token_storage_name);
    if (token)
        token = token.trim();

    let github_token = await getValidGithubToken(token);
    localStorage.setItem(github_token_storage_name, github_token);

    return github_token;
}

export async function resetGithubToken(token_storage_prefix) {
    const github_token_storage_name = token_storage_prefix && token_storage_prefix.length > 0 ? token_storage_prefix + ':github_token' : 'github_token';
    localStorage.removeItem(github_token_storage_name);
    return await getValidGithubToken(null);
}

async function getValidGithubToken(github_token) {
    const GITHUB_TOKEN_PROMPT = 'For querying github API we need a valid token, scope of token depends on repos and authors you want to track';
    const GITHUB_TOKEN_INVALID_MESSAGE = 'It looks like GitHub token you provided is either invalid or expired, please check console for more information.';

    while (! await isValidGithubToken(github_token)) {
        const message = github_token ? GITHUB_TOKEN_INVALID_MESSAGE + '\n' + GITHUB_TOKEN_PROMPT : GITHUB_TOKEN_PROMPT;

        github_token = prompt(message);
    }

    return github_token;
}

async function isValidGithubToken(github_token) {

    if (github_token) {
        const github_api = new GitHubGraphQL(github_token);
        try
        {
            let response = await github_api.getRateLimit();
            if (response && response.rateLimit.remaining > 0)
                return true;
        }
        catch(error) {
            console.log('got error while checking token validity: ', error);
            return false;
        }
    }

    return false;
}