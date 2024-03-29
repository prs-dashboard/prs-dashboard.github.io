<script>
    /* Pull request card component.

    Displays PR info given the pull_request object, which is obtained from GitHub GraphQL API:
    https://docs.github.com/en/graphql/reference/objects#pullrequest
    */

    export let pull_request; // pull request object from GitHub API

    import GitHubUser from './GitHubUser.svelte';
    import RelativeDateTime from './RelativeDateTime.svelte';

    // console.log("Got input pr: ", pull_request);
    let pr = pull_request;

    const commit = function() {
        try {
            return pr.commits.nodes[0].commit;
        }
        catch (e) {
            console.warn('Failed to get commit info from PR: ', pr, '\nerror:', e);

            // Using empty commit so rest of the card can be properly displayed
            return {
                statusCheckRollup: '',
                commitUrl: '',
                oid: null,
            };
        }
    }();

    const review = function () {
        try {
            return pr.reviews.nodes[0];
        }
        catch (e) {
            return null;
        }
    }();
    const pr_state = pr.isDraft ? 'draft' : pr.state.toLowerCase();
    const pr_target_branch = pr.baseRefName ? pr.baseRefName : "";
    const commit_status = commit.statusCheckRollup ? commit.statusCheckRollup.state.toLowerCase() : 'unknown';

    const commit_files = (() => {
        let files = [];
        files.push(`+${pr.additions}/-${pr.deletions}`)
        for (let file of pr.files.nodes) {
            // make a git-like changed file status:
            // M	-3/+7	tests/ci/build_check.py
            files.push(`${file.changeType.slice(0, 1)}\t+${file.additions}/-${file.deletions}\t${file.path}`);
        }
        return files.join('\n');
    })();

    /**
   * @param {{ comments: { nodes: any[]; }; }} pr
   * @param {number} [last_n]
   */
    function getComments(pr, last_n) {
        // console.log("getComments: ", pr.number, pr.title);
        if (!last_n)
            last_n = pr.comments.nodes.length;

        // Sort in reverse chronological order, (so the newest is at pos 0).
        let sorted_comments = pr.comments.nodes.toSorted((a, b) => {
            return a.updatedAt - b.updatedAt;
        });

        const comments = [];

        // Trim comments that are too long (usually some automatic checks), so there are more comments visible to the user.
        const MAX_COMMENT_LENGTH = 512;
        const COMMIT_TRIMMED_MARKER = '…';

        for (let comment of sorted_comments.slice(sorted_comments.length - last_n)) {
            const author = comment.author ? (comment.author.name ? comment.author.name : comment.author.login) : "";
            const comment_body = comment.body.slice(0, MAX_COMMENT_LENGTH) + (comment.body.length > MAX_COMMENT_LENGTH ? COMMIT_TRIMMED_MARKER : '');

            comments.push(`${comment.updatedAt} ${author}:\n${comment_body}`);
        }

        return comments;
    }
</script>


<pr-card
    class="card pr-state-{pr_state} pr-author-{pr.author.login.toLowerCase()}"
    >
    <div class="card-header">
        <a
            class="pr-title pr-state-{pr_state}"
            href="{pr.url}"
            title="#{pr.number} ({pr_state}) {pr.title}"
            rel="noopener noreferrer" target="_blank"
            >
            #{pr.number} {pr.title}
        </a>
    </div>
    <div class="card-body">
        <GitHubUser user={pr.author} class="pr-attribute pr-author pr-user"/>
        <div
            class="pr-attribute pr-target-branch"
            title="{pr_target_branch}"
            >
            {pr_target_branch}
        </div>
        <div class="pr-attribute pr-commit">
{#if commit.oid}
            <a
                class="pr-commit-check-status pr-commit-check-status-{commit_status}"
                href="{commit.commitUrl}/status-details" title="{commit_status}"
                rel="noopener noreferrer" target="_blank"
                > </a><!-- Intentional whitespace -->
            <a
                href="{commit.commitUrl}"
                rel="noopener noreferrer" target="_blank"
                >
                {commit.oid.slice(0, 8)}
            </a>
{:else}
            no commits
{/if}
        </div>
{#if pr.commits.totalCount}
        <div
            class="pr-attribute pr-commits-count"
            >
            ({pr.commits.totalCount})
        </div>
{/if}
        <div
            class="pr-attribute pr-files"
            title="{commit_files}"
            >
            {pr.changedFiles}
        </div>
        <div
            class="pr-attribute pr-merge-status pr-merge-status-{pr.mergeable.toLowerCase()}"
            >
            {pr.mergeable.toLowerCase()}
        </div>

    {#if pr.assignees && pr.assignees.nodes.length > 0}
        <GitHubUser
            user={pr.assignees.nodes[0]}
            class="pr-attribute pr-reviewer pr-user"
            />
    {:else}
        <div class="pr-attribute pr-reviewer pr-user pr-reviewer-missing">NO REVIEWER</div>
    {/if}
        <div
            class="pr-attribute pr-reviewed"
            >
            {review ? review.state.toLowerCase() : 'NO REVIEW'}
        </div>
        <!-- Display only last few comments in reverse order (newest on top) so those are visible in tooltip. -->
        <div
            class="pr-attribute pr-comments"
            title="{getComments(pr).join('\n\n')}"
            >
            {pr.comments.totalCount}
        </div>
        <div
            class="pr-attribute pr-labels"
            title="{pr.labels ? pr.labels.nodes.map(label => label.name).join('\n') : undefined}"
            >
            {pr.labels ? pr.labels.totalCount : 0}
        </div>
    </div>
    <div class="card-footer">
        <div class="pr-attribute pr-created-at pr-time">
            <RelativeDateTime time={pr.createdAt} />
        </div>
        <div class="pr-attribute pr-updated-at pr-time">
            updated:
            <RelativeDateTime time={pr.updatedAt} />
        </div>
    </div>
</pr-card>

<style>
    /* padding-left - spacing for various icons varies to get similar *visual* ident */
    .pr-files::after {
        font: var(--fa-font-regular);
        content: "\f016";
        padding-left: 0.2em;
    }

    .pr-comments::after {
        font: var(--fa-font-regular);
        content: "\f075";
        padding-left: 0.2em;
    }

    .pr-commits::after {
        font: var(--fa-font-regular);
        content: "\f292";
        padding-left: 0.2em;
    }

    .pr-labels::after {
        font: var(--fa-font-regular);
        content: "\f02e";
        padding-left: 0.2em;
    }

    .pr-target-branch::before {
        /** Doesn't work with --fa-font-regular **/
        font: var(--fa-font-solid);
        content: " \f126 ";
        margin-left: 0.5em;
        font-size: 0.7em;
        margin-right: 0.1em;
    }

    /* :global due to GitHubUser component using same class */
    :global(.pr-attribute) {
        display: block;
        float: left;
        height: 1.6em;
    }

    .pr-target-branch {text-align: right; float: right}

    /* Elements that start new row in the card,
    :global due to GitHubUser component using same class*/
    :global(.pr-reviewer),
    .pr-commit,
    :global(.pr-author) {
        clear: left;
    }

    /* Prevent long github user handles from breaking layout,
    :global due to GitHubUser component using same class */
    :global(.pr-reviewer) {
        max-width: 8em;
        text-overflow: clip;
        overflow: hidden;
        white-space: nowrap;
    }

    .card-body {
        display: flow-root;
        flex-flow: row wrap;
        justify-content: space-between;
    }

    /** usually for already merged PRs, hence no need to display mergeability **/
    .pr-merge-status-unknown {
        display: none;
        visibility: hidden;
    }

    .pr-comments::before,
    .pr-labels::before,
    .pr-reviewed::before,
    .pr-files::before,
    .pr-merge-status::before {
        content: "/";
        padding-left: 0.3em;
        padding-right: 0.3em;
    }

    .pr-commits-count {
        padding-left: 0.2em;
    }

    .pr-title.pr-state-draft::before {
        font: var(--fa-font-solid);
        content: "\f110  ";
    }

    .pr-title.pr-state-merged::before {
        /** Doesn't work with --fa-font-regular **/
        font: var(--fa-font-solid);
        content: "\f387  ";
    }

    .pr-title.pr-state-closed::before {
        font: var(--fa-font-solid);
        content: "\f00d  ";
    }

    .pr-title.pr-state-open::before {
        font: var(--fa-font-regular);
        content: "\f111  ";
    }

    .pr-commit-check-status-failure::before {
        font: var(--fa-font-regular);
        content: "\f057";
    }

    .pr-commit-check-status-success::before {
        font: var(--fa-font-regular);
        content: "\f058";
    }

    .pr-commit-check-status-unknown::before {
        font: var(--fa-font-regular);
        content: "\f059";
    }

    .pr-commit-check-status-pending::before {
        font: var(--fa-font-regular);
        content: "\f192";
    }

    .pr-commit-check-status {
        text-decoration: none;
        display: inline-block;
        vertical-align: baseline;
    }

    .repo-title {
        display: block;
        padding: 5px;
        background-color: lightgray;
        margin-top: 0.5em;
    }

    .card {
        max-width: 400px;
        min-width: 365px;
        /* width: 365px; */
        margin: .1em;
    }

    .card-body {
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .card-header {
        padding-bottom: 0px;
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 4px;
        padding-bottom: 0.2em;
    }

    .pr-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 330px;
        width: 330px;
        display: inline-block;
        height: 1.6em;
    }
</style>
