class PRProviderError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
  }
}

/// Fetch PRs from a repo
export
class SimpleRepoProvider {
  /**
   * @param {import("./github_api").GitHubGraphQL} github_api
   * @param {string} name
   * @param {string[]} authors
   * @param {string[]} assignees
   * @param {string} query
   * @param {number} max_load_batch_size
   */
  constructor (
      github_api
    , name
    , authors
    , assignees
    , query
    , max_load_batch_size
  ) {
    this.makeRequest = async (/** @type {number} */ batch_size, /** @type {any} */ cursor) => {
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

  /**
   * @param {number} number_of_prs
   */
  async loadMore(number_of_prs) {
    console.log(`${this.name} loadMore(${number_of_prs})`)

    for await (let pr of this.loadMoreGenerator(number_of_prs)) {
      ;// do nothing, just consume the generator, all PRs are added to this.prs by generator.
    }
    return this.prs;
  }

  /** Loads more PRs, yielding each new PR one by one
   * @param {number} number_of_prs
   */
  async *loadMoreGenerator(number_of_prs) {
    console.log(`${this.name} loadMoreGenerator(${number_of_prs})`)

    // repeat load more until required number of PRs is loaded or until there is no more
    const initial = this.prs.length;
    while (this.hasNextPage && this.prs.length < initial + number_of_prs) {
      const remaining = number_of_prs + initial - this.prs.length;

      let data = await this.makeRequest(remaining, this.endCursor);

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
