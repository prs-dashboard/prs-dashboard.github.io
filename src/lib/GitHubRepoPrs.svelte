<script>
    // Inputs
    export let all_authors = [];
    export let selected_authors = []; // may be null or undefined if no filtering by authors is required
    export let prs_provider = new SimpleRepoProvider();
    export let initial_display_prs_count = 10;

    // Dependencies
    import GitHubPrCard from './GitHubPrCard.svelte';
    import Filters from './Filters.svelte';
    import { SimpleRepoProvider } from './GitHubAPI/GitHubPrs';
    import { construct_svelte_component } from 'svelte/internal';
    import { onMount } from 'svelte';

    const repo_name = prs_provider.repoName();
    const pr_list_id = repo_name.replaceAll('/', '_');  // Can't use id/classes with '/' in css

    let prs_filters = [
        {id: "open",   text: "open (0)"},
        {id: "merged", text: "merged (0)"},
        {id: "closed", text: "closed (0)"},
        {id: "draft",  text: "draft (0)"},
    ];
    let selected_pr_types = prs_filters.map(filter => filter.id);

    // Ref to DOM entity of the top-level element
    let pr_list_element = undefined;
    onMount(() => {
        pr_list_element = document.getElementById(pr_list_id);
    });

    function filterPrs(selected_pr_types, selected_authors) {
        // rewrite <style> of the <section> to hide all prs that were deselected
        function unselected(all, selected) {
            return [...all].filter(a => ! new Set(selected).has(a));
        }

        if (!pr_list_element)
            return;

        const unselected_pr_types = unselected(prs_filters.map(x => x.id), selected_pr_types);
        const unselected_authors = unselected(all_authors, selected_authors);

        // Clear all previous style definitions
        const prev_styles = pr_list_element.getElementsByTagName('style');
        if (prev_styles) {
            var arr = [].slice.call(prev_styles).forEach(element => {
                element.remove();
            });
        }

        let style_element = document.createElement('style')
        style_element.innerHTML = unselected_pr_types.map(x => `#${pr_list_id} .pr-state-${x} {display: none !important}`).join('\n')
            + unselected_authors.map(x => `#${pr_list_id} .pr-author-${x} {display: none !important}`).join('\n');

        pr_list_element.appendChild(style_element);
        console.log('Rebuilt a style for filtering PRs');
    }

    let prs_loaded = [];
    let prs_are_loading = false;
    let prs_loading_error = undefined;
    let prs_can_load_more = true;
    let prs_shown_count = 0;

    async function loadPrs(prs_provider, number_of_prs_to_load) {
        prs_are_loading = true;
        prs_loading_error = undefined;

        let prs_loaded_per_request = 0;
        try {
            for await (let value of prs_provider.loadMoreGenerator(number_of_prs_to_load)) {
                prs_loaded_per_request += 1;
                prs_loaded.push(value);
                prs_loaded = prs_loaded;
                // await new Promise(resolve => setTimeout(resolve, 500));
            }
            // throw 'Bip-boop some error you got.\nWith more and more details\nmaybe a stacktrace?';
        } catch (error) {
            console.log(`Error loading PRs for repo {repo_name} : {error}`);
            prs_loading_error = error;
        }

        prs_are_loading = false;

        // if no PRs were loaded in previous iteration, then source must be depleted.
        if (prs_loaded_per_request == 0 && !prs_loading_error)
            prs_can_load_more = false;
    }

    loadPrs(prs_provider, parseInt(initial_display_prs_count));

    // make sure that updated if selected_pr_types and/or selected_authors change
    $: filterPrs(selected_pr_types, selected_authors);

    // Update filter description counters
    $: if (pr_list_element && prs_loaded) {
        // do a timeout to allow all PRs to be in DOM
        setTimeout(() => {
            let prs_shown = 0;
            // Now count all occurrences of all PR types
            prs_filters = prs_filters.map((filter) => {
                let key = filter.id;
                const count = pr_list_element.querySelectorAll(`pr-card .pr-state-${key}`).length;

                if (selected_pr_types.findIndex(x => x == filter.id) != -1 )
                    prs_shown += count;

                return {id: filter.id, text: `${key} (${count})`};
            });
            prs_shown_count = prs_shown;
        }, 100);
    }

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
            <div
                class=counters
                >
                    total {prs_loaded.length}, displayed {prs_shown_count}
            </div>
    </h2>
{#if prs_loading_error}
    <prs-loading-error class="error">
        <div class="button-container">
            <button
                type="button"
                class='close-button btn btn-danger fa-solid fa-xmark'
                on:click={() => {prs_loading_error = null;}}
                />
        </div>
        Got an error you are:<br>
        <pre>{prs_loading_error}</pre>
    </prs-loading-error>
{/if}
    <prs-list
        id="{pr_list_id}"
        class="pr-list"
        >
{#each prs_loaded as pr}
        <GitHubPrCard pull_request={pr} />
{/each}
    </prs-list>
{#if prs_are_loading}
    <prs-loading
        class="fas fa-sync-alt"
        title='Loading data from server'
        />
{:else}
    <button
        type='button'
        class='load-more more-button btn btn-outline-secondary fa-solid fa-angles-right'
        disabled={!prs_can_load_more}
        title={prs_can_load_more ? 'Load next 10 PRs' : 'No more PRs in repo'}
        on:click={() => {loadPrs(prs_provider, 10);}}
        />
{/if}
</section>

<style>
    h2.repo-title > :global(form) {display: inline-block;}
    h2.repo-title > :global(form) > :global(label) {font-size: medium;}
    .pr-list > :global(pr-card) {display: inline-block; flex: 1 1 0;}
    .pr-list {
        display: flex;
        flex-flow: row wrap;
    }

    .repo-title {
        display: block;
        padding: 5px;
        margin-top: 0.5em;
        width: 100vw;
    }

    .counters {
        display: inline-block;
        font-size: medium;
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

    prs-loading-error {
        margin-top: -0.5em;
        margin-bottom: 1em;
        background: red;
        padding: 0.3em;

        display: grid;
        grid-template-columns: 1fr 30fr;
    }
    prs-loading-error pre {
        color: black;
        margin: 0px;
        padding: 0px;
        grid-row-start: 2;
        grid-row-end: 100;
        padding-left: 2em;
    }

    prs-loading-error .button-container {
        display: grid;
        grid-column-start: 1;
        grid-row-start: 1;
        grid-row-end: 100;
        margin-right: 1em;
    }

    prs-loading {
        animation: fa-spin 2s infinite ease-in-out, blink 2s infinite ease-in-out;
        display: inline-block;
        color: var(--highlight-color);
        font-size: 3em;
    }

    @keyframes blink {
        0%   {opacity: 0.2;}
        30%   {opacity: 0.6;}
        70%   {opacity: 0.6;}
        100% {opacity: 0.2;}
    }
</style>