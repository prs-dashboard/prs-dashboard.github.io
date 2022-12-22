<script>
    import { onMount } from 'svelte';
    import Filters from './lib/Filters.svelte';
    import GitHubRepoPrs from './lib/GitHubRepoPrs.svelte';

    import { getGitHubToken } from './lib/GitHubToken.js'
    import { searchPRs } from './lib/GitHubPrs';

    const repos = getRepos();
    const authors = getParameters('author');
    const assignees = getParameters('assignee');
    const query = getParameter('query');
    const title = getParameter('title');

    const namespace = getParameter('namespace') || '';
    const color = getParameter('color');

    // Allow user to specify namespace to use different tokens for different repos/access rights.
    const github_token = getGitHubToken(namespace);

    // Initially all authors/review assignees are checked
    let authors_filter = authors.map(author => ({id: author}));
    let authors_selected = authors;
    console.log(`authors_selected : ${authors_selected}`)
    let assignees_filter = assignees.map(assignee => ({id: assignee}));
    let assignees_selected = assignees;

    function getParameters(name) {
        let result = [];
        // @ts-ignore
        for (const [k, v] of new URL(document.location).searchParams) {
            if (k === name)
                result.push(v);
        }

        return result;
    }

    function getParameter(name) {
        const params = getParameters(name);
        if (params && params.length > 0) {
            return params[params.length - 1];
        }

        return null;
    }

    function getRepos() {
        const DEAFULT_PRS_COUNT = 10;
        let repos = [];
        for (let repo of getParameters('repo')) {
            let [repo_name, prs_count] = decodeURI(repo).split(':');

            if (prs_count === undefined)
                prs_count = DEAFULT_PRS_COUNT;

            // let repo_object = {}
            // repo_object[repo_name] = prs_count;
            repos.push([repo_name, prs_count]);
        }

        // console.log(repos);
        return repos;
    }

    function setColor(new_color) {
        const DEFAULT_COLOR = 'lightGray';

        if (!new_color || !CSS.supports('color', new_color)) {
            console.error(`Invalid color value: ${new_color}, would not change accents not favicon color`);
            new_color = DEFAULT_COLOR;
        }

        new_color = encodeURIComponent(new_color);
        var icon = document.querySelector('link[rel="icon"]');
        icon.href = icon.href.replace('fill="white"', `fill="${new_color}"`);

        let app_customization = document.querySelector(':root');
        console.log("customization:", app_customization);
        app_customization.style.setProperty('--pr-card-selection-highlight-color', new_color);

        var icon_element = document.getElementById("icon");
        console.log(icon_element);
        icon_element.src = icon.href;
        console.log(icon_element.href);
    }

    onMount( async() => {
        if (title)
            document.title = title;

        setColor(color);

        // Hightlight selected PR or one that was selected with browser's find
        // Helpful when searching for PR by title and not all part of it are visible.
        var selected_pr = null;
        document.addEventListener('selectionchange', () => {
            if (selected_pr) {
                selected_pr.classList.remove('pr-card-selected');
            }

            selected_pr = window.getSelection().focusNode.parentElement.closest('.pr-card');
            if (selected_pr) {
                selected_pr.classList.add('pr-card-selected');
            }
        });

    });
</script>

<main>
    <header>
        <div id=icon_container>
            <a href="https://github.com/prs-dashboard/prs-dashboard.github.io" title="See this project on GitHub">
                <img id=icon>
            </a>
        </div>
        <div>
            <list id="repo-list">
                Repositories:
{#each repos as repo}
                <a class="repo-name" href="#{repo[0]}">{repo[0]}</a>
{/each}
            </list>
        </div>
{#if authors.length}
        <div>
            <Filters group_name="author-filter" filters={authors_filter} bind:selected={authors_selected}>
                Authors:
            </Filters>
        </div>
{/if}
{#if assignees.length}
        <div>
            <Filters group_name="assignee-filter" filters={assignees_filter}  bind:selected={assignees_selected}>
                Assignees:
            </Filters>
        </div>
{/if}
{#if query}
    <div>
        Query: {query}
    </div>
{/if}
    </header>
{#await github_token then token}
{#each repos as repo}
    <GitHubRepoPrs
        github_repo={repo[0]}
        selected_authors={authors.length > 0 ? authors_selected : null}
        pull_requests_promise={searchPRs(repo[0], authors, assignees, query, repo[1], token)}
    />
{:else}
    <section>It looks empty...<br>please <a href="https://github.com/prs-dashboard/prs-dashboard.github.io#readme">read the docs</a> on how to add repositories/authors/whatever to dashboard</section>
{/each}

{/await}
</main>

<style>
    /* Floating header */
    header {
        position: fixed;
        background: var(--bs-body-bg);
        top: 0px;
        z-index: 10;
        width: 100%;
        box-shadow: 0px 0px 5px -1px black;

        display: grid;
        grid-template-columns: 1fr 30fr;
    }

    header #icon_container {
        display: grid;
        grid-column-start: 1;
        grid-row-start: 1;
        grid-row-end: 100;
    }

    header #icon_container a {
        display: block;
        margin: auto;
    }

    #icon {
        width: 40px;
        height: 40px;
        margin: auto;
        display: block;
    }

    main {
        padding-top: 3em;
        scroll-margin-top: 4em;
    }

    list#repo-list a {
        display: inline-block;
        margin: 0 1em 0 0;
    }

    :global(form.filters > label) {
        display: inline-block;
        margin-right: 1em;
    }

    :global(.pr-card-selected) {
        box-shadow: 0px 0px 2px 2px var(--pr-card-selection-highlight-color);
    }

</style>
