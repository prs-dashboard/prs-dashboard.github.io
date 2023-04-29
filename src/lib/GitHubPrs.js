export
class SimpleRepoProvider {
  constructor (
      github_api /* GitHubGraphQLAPI */
    , name /* string */
    , authors /* array of strings */
    , assignees /* array of strings */
    , query /* string or null */
    , request_limit /* number */
  ) {
    this.api = github_api;
    this.search_response = this.api.search(name, authors, assignees, query, request_limit);
    this.cached_prs = [];
    this.name = name

    console.log("SimpleRepoProvider.constructor", this, " github_api: ", github_api);
  }

  repoName() {
    return this.name;
  }

  async getPrs() {
    const prs = (await this.search_response).data.search;
    console.log("SimpleRepoProvider.getPrs() ", this, ", prs: ", prs);

    this.endCursor = prs.pageInfo.endCursor
    this.hasNextPage = prs.pageInfo.hasNextPage

    let result = [];
    for (const pr of prs.nodes) {
      this.cached_prs.push(pr);
      result.push(pr);
    }

    return result;
  }

  async loadMore() {

  }
}

export
class PRsProvider
{
  constructor (
      github_api /* string */
      , authors /* array of strings */
      , repos /* array of strings, but can be undefined/null */
      , assignees /* array of strings */
      , query /* string or null */
      )
  {
    this.github = github_api;
    this.authors = authors;
    this.repos = repos;
    this.providers = new Map();

    // We know list of repos beforehand - just make request for each
    if (this.repos) {
      let self = this;
      this.repo_providers = Promise.resolve(function* () {
        for (const repo of repos) {
          const repo_name = repo[0];
          const repo_limit = repo[1];
          const provider = new SimpleRepoProvider(self.github, repo_name, authors, assignees, query, repo_limit);
          self.providers[repo_name] = provider;
          yield provider;
        }
      });
    } else {
      throw Error("As of now, must have multiple repos defined")
    }
    console.log(`constructed PRsProvider ${this}, repo providers: ${this.repo_providers}`);
  }

  async getRepoPrProvider(repo_name) {
    console.log(`PRsProvider.getRepoPrProvider(${repo_name}), ${this.repoProviders}`);
    const result = await this.repoProviders()[repo_name];
    console.log(`result: ${result}`);
    return result;
  }

  async repoProviders() {
    return await this.repo_providers;
  }
}