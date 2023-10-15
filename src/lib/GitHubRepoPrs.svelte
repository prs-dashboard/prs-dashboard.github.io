<script>
    export let github_repo = '';
    // export let pull_requests_promise = Promise.resolve([])
    export let selected_authors = []; // may be null or undefined if no filtering by authors is required
    export let prs_provider = new SimpleRepoProvider();
    export let initial_display_prs_count = 10;

    import GitHubPrCard from './GitHubPrCard.svelte';
    import Filters from './Filters.svelte';
    import { SimpleRepoProvider } from './GitHubAPI/GitHubPrs';

    let prs_filters = [
        {id: "open",   text: "open (0)"},
        {id: "merged", text: "merged (0)"},
        {id: "closed", text: "closed (0)"},
        {id: "draft",  text: "draft (0)"},
    ];

    let selected_pr_types = prs_filters.map(filter => filter.id);
    let pull_requests_promise = prs_provider.loadMore(parseInt(initial_display_prs_count));

    const repo_name = github_repo;

    function pr_state(pr) {
        return pr.isDraft ? 'draft' : pr.state.toLowerCase();
    }

    function filterPrs(prs) {
        // Filter incoming PRs, also update counters of the filters
        // console.log("Before filtering:  ", prs.length, " filters: ", prs_labels);
        let counts = new Map();
        prs = prs.filter((pr) => {
            const state = pr_state(pr);
            let found = selected_pr_types.includes(state);
            if (Array.isArray(selected_authors))
                found = found && selected_authors.includes(pr.author.login.toLowerCase());

            if (found) {
                const prev = counts.get(state) || 0;
                counts.set(state, prev + 1);
            }
            return found;
        });

        prs_filters = prs_filters.map((filter) => {
            let key = filter.id;
            return {id: filter.id, text: `${key} (${counts.get(key) || 0})`};
        });

        return prs;
    }

    let pull_requests = pull_requests_promise;
    $: pull_requests = (selected_pr_types, selected_authors, pull_requests_promise.then((prs) => {
        return filterPrs(prs);
    }));

  </script>

<section id="{repo_name}" style="container-fluid">
    <h2
        class="repo-title"
        >
            <a
                class="repo-name"
                href="https://github.com/{repo_name}/pulls"
                rel="noopener noreferrer" target="_blank"
                >
                    {repo_name}
            </a>
            <Filters group_name="pr_filters" filters={prs_filters} bind:selected={selected_pr_types}/>
    </h2>
    <list
        class="pr-list"
        >
{#await pull_requests}
        <p>... Loading ...</p>
{:then pull_request_list}
    {#each pull_request_list as pr}
        <GitHubPrCard pull_request={pr} />
    {/each}
{:catch error}
        <p class=error>
            {error}
            {console.log(error),''}
        </p>
{/await}
    </list>
</section>

<style>
    h2.repo-title > :global(form) {display: inline-block;}
    h2.repo-title > :global(form) > :global(label) {font-size: medium;}
    .pr-list > :global(pr-card) {display: inline-block}

    .repo-title {
        display: block;
        padding: 5px;
        background-color: lightgray;
        margin-top: 0.5em;
        width: 100vw;
    }

    /* Make shure that navigating to Repo title makes it visible despite floating header.
    Based on https://css-tricks.com/hash-tag-links-padding/#aa-fancier-clean-html-method */
    section:target::before {
        display: block;
        content: " ";
        margin-top: -3em;
        height: 3em;
        visibility: hidden;
        pointer-events: none;
    }
</style>