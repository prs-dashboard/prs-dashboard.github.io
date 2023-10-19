<script>
    export let github_repo = '';
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

    const repo_name = github_repo;

    function filterPrs(prs) {
        // Filter incoming PRs, also update counters of the filters
        console.log("!! Before filtering:  ", prs.length, " filters: ", prs_filters);
        let counts = new Map();

        function pr_state(pr) {
            return pr.isDraft ? 'draft' : pr.state.toLowerCase();
        }

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

        // update numbers in filter text description
        prs_filters = prs_filters.map((filter) => {
            let key = filter.id;
            return {id: filter.id, text: `${key} (${counts.get(key) || 0})`};
        });

        console.log("!!! After filtering:  ", prs.length);
        return prs;
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    let prs_unfiltered = [];
    let prs_are_loading = true;
    let prs_loading_error = undefined;

    async function loadPrs(prs_provider, number_of_prs_to_load) {
        prs_are_loading = true;
        prs_loading_error = undefined;

        try {
            for await (let value of prs_provider.loadMoreGenerator(number_of_prs_to_load)) {
                prs_unfiltered.push(value);
                prs_unfiltered = prs_unfiltered;
            }
        } catch (error) {
            console.log(`Error loading PRs for repo {repo_name} : {error}`);
            prs_loading_error = error;
        }

        prs_are_loading = false;
    }

    loadPrs(prs_provider, parseInt(initial_display_prs_count));

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    let prs_filtered = [];
    $: {
        // make sure that updated if selected_pr_types and/or selected_authors change
        selected_pr_types, selected_authors, prs_unfiltered;
        prs_filtered = filterPrs(prs_unfiltered);
    };

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
{#if prs_loading_error}
    <prs-loading-error class=error>
        {prs_loading_error}
    </prs-loading-error>
{/if}
    <prs-list
        class="pr-list"
        >
{#each prs_filtered as pr}
        <GitHubPrCard pull_request={pr} />
{/each}
    </prs-list>
{#if prs_are_loading}
    <prs-loading>... Loading ...</prs-loading>
{/if}
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