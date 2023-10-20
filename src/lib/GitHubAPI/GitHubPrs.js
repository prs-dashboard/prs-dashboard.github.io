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
  }

  repoName() {
    return this.name;
  }

  async getPRs() {
    return this.prs;
  }

  async loadMore(number_of_prs) {
    console.log(`${this.name} loadMore(${number_of_prs})`)

    for await (let pr of this.loadMoreGenerator(number_of_prs)) {
      ;// do nothing, just consume the generator, all PRs are added to this.prs by generator.
    }
    return this.prs;
  }

    // Loads more PRs, yielding each new PR
  async *loadMoreGenerator(number_of_prs) {
    console.log(`${this.name} loadMoreGenerator(${number_of_prs})`)

    // repeat load more until required number of PRs is loaded or until there is no more
    const initial = this.prs.length;
    while (this.hasNextPage && this.prs.length < initial + number_of_prs) {
      let remaining = number_of_prs + initial - this.prs.length;
      // console.log(`${this.name} remaining RPs to load: ${remaining}`)
      let data = await this.makeRequest(remaining, this.endCursor);
      // console.log(`${this.name} received data: `, data)

      this.endCursor = data.pageInfo.endCursor
      this.hasNextPage = data.pageInfo.hasNextPage

      for (let loaded_pr of data.nodes) {
        this.prs.push(loaded_pr);
        yield loaded_pr;
      }

      if (!this.hasNextPage)
        break;
    }
  }
}
