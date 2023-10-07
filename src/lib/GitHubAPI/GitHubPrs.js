class PRProviderError extends Error {
  constructor(message) {
    super(message);
  }
}

/// Fetch PRs from a repo
export
class SimpleRepoProvider {
  constructor (
      github_api /* GitHubGraphQLAPI */
    , name /* string */
    , authors /* array of strings */
    , assignees /* array of strings */
    , query /* string or null */
    , max_load_batch_size /* number */
  ) {
    this.makeRequest = async (batch_size, cursor) => {
      if (batch_size > max_load_batch_size)
        batch_size = max_load_batch_size;

      return github_api.search(name, authors, assignees, query, batch_size, cursor);
    };

    this.prs = new Array();
    this.name = name;

    this.endCursor = '';
    this.hasNextPage = true;

    // console.log("SimpleRepoProvider.constructor", this, " github_api: ", github_api);
  }

  repoName() {
    return this.name;
  }

  async getPRs() {
    return this.prs;
  }

  async loadMore(number_of_prs) {
    // repeat load more until required number of PRs is loaded or until there is no more
    const initial = this.prs.length;
    while (this.hasNextPage && this.prs.length < initial + number_of_prs) {
      let remaining = number_of_prs + initial - this.prs.length;
      let data = await this.makeRequest(remaining, this.endCursor);
      const prs = data.data.search;

      this.endCursor = prs.pageInfo.endCursor
      this.hasNextPage = prs.pageInfo.hasNextPage

      this.prs = this.prs.concat(prs.nodes);

      if (!this.hasNextPage)
        break;
    }

    return this.prs;
  }
}

export
class FixedRepoProvider {
    constructor (
      name /* string */
    , list_of_prs /* [pr] */
    , github_api /* GitHubGraphQLAPI */
    , authors /* array of strings */
    , assignees /* array of strings */
    , query /* string or null */
    , request_limit /* number */
  ) {
    this.prs = list_of_prs;
    this.name = name
    this.github_api = github_api
    this.authors = authors
    this.assignees = assignees
    this.query = this.query
    this.request_limit = request_limit
  }

  repoName() {
    return this.name;
  }

  async getPrs() {
    return this.prs;
  }

  async loadMore() {
    throw new PRProviderError('FixedRepoProvider.loadMore() is not implemented yet');
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
    this.github_api = github_api;
    this.authors = authors;
    this.repos = repos;
    this.assignees = assignees;
    this.query = query;

    this.providers = new Map();

    // We know list of repos beforehand - just make request for each
    if (this.repos && repos,length > 0) {
      let self = this;
      this.repo_providers = Promise.resolve(function () {
        let providers = [];
        for (const repo of repos) {
          const repo_name = repo[0];
          const repo_limit = repo[1];
          const provider = new SimpleRepoProvider(self.github_api, repo_name, authors, assignees, query, repo_limit);
          self.providers[repo_name] = provider;
          providers.push(provider);
        }

        return providers;
      });
    } else {
      console.log('!!!!! Got no repos, will just query PRs according wot query');

      const default_request_limit = 50;
      this.repo_providers = this.#createProvidersFromSingleSearchQuery();
    }

    console.log(`constructed PRsProvider `, this, 'repo providers:', this.repo_providers);
  }

  async getRepoPrProvider(repo_name) {
    console.log(`PRsProvider.getRepoPrProvider(${repo_name}), ${this.repoProviders}`);
    const result = await this.repoProviders()[repo_name];
    console.log(`result: ${result}`);
    return result;
  }

  async repoProviders() {
    console.log('PRsProvider.repoProviders', this, ' repo_providers: ', this.repo_providers)
    return await this.repo_providers;
  }

  async #createProvidersFromSingleSearchQuery() {
    const request_limit = 50;
    const search_response = await this.github_api.search(null, this.authors, this.assignees, this.query, request_limit);
    console.log('PRsProvider.createProvidersFromSingleSearchQuery', this, ' search_response: ', search_response);
    const search_results = search_response.data.search;

    let prs_by_repo_name = new Map();
    let providers = [];
    for (const pr of search_results.nodes) {
      console.log('!!!!! got pr from API:', pr);
      const repo_name = pr.repository.nameWithOwner;
      let prs = prs_by_repo_name.get(repo_name) || [];
      prs.push(pr);
      prs_by_repo_name[repo_name] = prs;

      console.log('!!!!, repo_name: ', repo_name, 'prs: ', prs)
    }
    console.log('!!!!!!!123 prs_by_repo_name:', prs_by_repo_name);
    console.debug('stop, hammer time!')

    for (const [repo_name, prs] of prs_by_repo_name) {
      console.log('!!!! inside for loop', repo_name, prs);
      const provider = new FixedRepoProvider(repo_name, prs, this.github_api, this.authors, this.assignees, this.query, request_limit);
      this.providers[repo_name] = provider;
      providers.push(provider);
    }

    console.log('!!! Got list of providers: ', providers);
    return providers;
  }
}