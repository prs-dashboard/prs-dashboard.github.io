<script>
    export let pull_request; // pull request object from GitHub API

    import 'lodash/escape';
    import GitHubUser from './GitHubUser.svelte';
    import RelativeDateTime from './RelativeDateTime.svelte';

    // console.log("Got input pr: ", pull_request);
    let pr = pull_request;
    const commit = pr.commits.edges[0].node.commit;
    const review = function () {
        try {
            return pr.reviews.edges[0].node;
        }
        catch (e) {
            return null;
        }
    }();
    const pr_state = pr.isDraft ? 'draft' : pr.state.toLowerCase();
    const pr_target_branch = pr.baseRefName ? escape(pr.baseRefName) : "";
    const commit_status = commit.statusCheckRollup ? commit.statusCheckRollup.state.toLowerCase() : 'unknown';

    const commit_files = (() => {
        let files = [];
        for (let file of pr.files.nodes) {
            files.push(`${file.changeType.slice(0, 1)}\t-${file.deletions}/+${file.additions}\t${file.path}`);
        }
        return files.join('\n');
    })();

    function getComments(pr) {
        let comments = [];
        for (let comment of pr.comments.nodes) {
            comments.push(`${comment.updatedAt} ${comment.author.name}:\n${comment.body}`)
        }
        return comments.join('\n\n');
    }
</script>


<pr-card class="pr card pr-state-{pr_state} author-{pr.author.login.toLowerCase()}">
<div class="card-header">
    <a
        class="pr-title pr-state-{pr_state}"
        href="{pr.url}"
        title="#{pr.number} ({pr_state}) {escape(pr.title)}"
        >
            {pr.title}
    </a>
</div>
<div class="card-body">
    <GitHubUser user={pr.author} />
    <div class="pr-attribute pr-target-branch" title="{pr_target_branch}">{pr_target_branch}</div>
    <div class="commit-section">
        <div class="pr-attribute pr-commit">
            <a
                class="pr-commit-check-status pr-commit-check-status-{commit_status}"
                href="{commit.commitUrl}/status-details" title="{commit_status}"
                > </a><!-- Intentional whitespace -->
            <a
                href="${commit.commitUrl}"
                >
                    {commit.oid.slice(0, 8)}
            </a>
        </div>
        <div
            class="pr-attribute pr-commits-count"
            >
                ({pr.commits.totalCount})
        </div>
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
    </div>

{#if pr.assignees && pr.assignees.nodes.length > 0}
    <GitHubUser user={pr.assignees.nodes[0]} />
{:else}
    <div class="pr-attribute pr-reviewer pr-user pr-reviewer-missing">NO REVIEWER</div>`
{/if}

    <div
        class="pr-attribute pr-reviewed"
        >
        {review ? review.state.toLowerCase() : 'NOT REVIEWED'}
    </div >
    <div
        class="pr-attribute pr-comments"
        title="{getComments(pr)}"
        >{pr.comments.totalCount}</div>
    <div class="pr-attribute pr-labels" title="{pr.labels ? pr.labels.nodes.map(label => label.name).join('\n') : undefined}">
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
    .pr-files::after {
        font: var(--fa-font-regular);
        content: " \f016";
    }

    .pr-comments::after {
        font: var(--fa-font-regular);
        content: " \f075";
    }

    .pr-commits::after {
        font: var(--fa-font-regular);
        content: " \f292";
    }

    .pr-labels::after {
        font: var(--fa-font-regular);
        content: " \f02e";
    }

    div.pr-files,
    div.pr-comments,
    div.pr-commits-count,
    div.pr-labels,
    .pr-state,
    .pr-reviewed,
    :global(.pr-user), /* result of GitHubUser */
    .pr-merge-status,
    .pr-created-at,
    .pr-updated-at,
    .pr-target-branch {
        display: inline
    }

    .pr-target-branch::before {
        /** Doesn't work with --fa-font-regular **/
        content: " \f126 ";
        font: var(--fa-font-solid);
        margin-left: 0.5em;
        font-size: 0.7em;
        margin-right: 0.1em;
    }

    /* .pr-author::before {
        content: "by: ";
    } */

    .pr-target-branch,
    .pr-author {
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 15em;
        display: inline-block;
        overflow-x: hidden;
        vertical-align: top;
        /* to fix extra space on overflow */
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
        content: " / "
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

    .pr-commit-check-status {
        vertical-align: middle;
        text-decoration: none;
    }

    .repo-title {
        display: block;
        padding: 5px;
        background-color: lightgray;
        margin-top: 0.5em;
    }

    .commit-section div {
        display: inline;
    }

    .card {
        max-width: 400px;
        width: 400px;
        margin: 0.2em;
    }

    .card-body {
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .card-header {
        padding-bottom: 4px;
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 4px;
    }

    .pr-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 360px;
        width: 360px;
        display: inline-block;
    }
</style>
