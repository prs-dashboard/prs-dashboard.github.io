import test from 'ava';

import { GitHubGraphQLMock } from './github_api_mock.js'
import { SimpleRepoProvider } from './GitHubPrs.js'

test('SimpleRepoProvider simple constructor', async t => {
    let github_api = new GitHubGraphQLMock();
    let prs_provider = new SimpleRepoProvider(
        github_api,
        'test_repo',
        ['author1', 'author2'],
        ['assignee1', 'assignee2'],
        '',
        10);

    t.true(prs_provider.repoName() == 'test_repo');
    t.deepEqual(await prs_provider.getPRs(), []);
    // t.true((await prs_provider.loadMore(100)).length == 100);
});

test('SimpleRepoProvider loadMore passes correct arguments to API', async t => {
    const CHUNK_SIZE = 10;
    const REPO = 'repo name';
    const AUTHORS = ['author 1', 'author 2', 'author 3'];
    const ASSIGNEES = ['assignee 1', 'assignee 2', 'assignee 3'];
    const QUERY = 'fake query';

    let github_api = new GitHubGraphQLMock();
    let prs_provider = new SimpleRepoProvider(
        github_api,
        REPO,
        AUTHORS,
        ASSIGNEES,
        QUERY,
        CHUNK_SIZE);

    // making sure that multiple requests are made
    t.is((await prs_provider.loadMore(CHUNK_SIZE)).length, CHUNK_SIZE);
    t.is(github_api.requests.length, 1);

    t.deepEqual(github_api.requests[0], {
        repo: REPO,
        authors: AUTHORS,
        assignees: ASSIGNEES,
        query: QUERY,
        request_limit: CHUNK_SIZE,
        after_cursor: ''
    });
});

test('SimpleRepoProvider loadMore requests items in chunks', async t => {
    const CHUNK_SIZE = 10;
    const REQUESTS = 3;

    let github_api = new GitHubGraphQLMock();
    let prs_provider = new SimpleRepoProvider(
        github_api,
        'test_repo',
        [],
        [],
        '',
        CHUNK_SIZE);

    // making sure that multiple requests are made
    t.is((await prs_provider.loadMore(CHUNK_SIZE * REQUESTS)).length, CHUNK_SIZE * REQUESTS);
    t.is(github_api.requests.length, REQUESTS);
});

test('SimpleRepoProvider loadMore respects hasNextPage=false', async t => {
    const CHUNK_SIZE = 10;

    let github_api = new GitHubGraphQLMock();
    github_api.result.data.search.pageInfo.hasNextPage = false;

    let prs_provider = new SimpleRepoProvider(
        github_api,
        'test_repo',
        [],
        [],
        '',
        CHUNK_SIZE);

    // only one request is made due to hasNextPage=false
    t.is((await prs_provider.loadMore(100)).length, CHUNK_SIZE);
    t.is(github_api.requests.length, 1);
});

test('SimpleRepoProvider loadMore respects hasNextPage=false and less items than requested', async t => {
    const CHUNK_SIZE = 10;
    const DATA_SIZE = 1;

    let github_api = new GitHubGraphQLMock();
    github_api.result.data.search.pageInfo.hasNextPage = false;
    github_api.result.data.search.nodes = github_api.result.data.search.nodes.slice(0, DATA_SIZE);

    let prs_provider = new SimpleRepoProvider(
        github_api,
        'test_repo',
        [],
        [],
        '',
        CHUNK_SIZE);

    // only one request is made due to hasNextPage=false, and only DATA_SIZE items returned.
    t.is((await prs_provider.loadMore(100)).length, DATA_SIZE);
    t.is(github_api.requests.length, 1);
});

test('SimpleRepoProvider handles correctly uses pageInfo.endCursor', async t => {
    const CHUNK_SIZE = 10;
    const REQUESTS = 3;

    let github_api = new GitHubGraphQLMock();
    let prs_provider = new SimpleRepoProvider(
        github_api,
        'test_repo',
        [],
        [],
        '',
        CHUNK_SIZE);

    // only one request is made due to hasNextPage=false
    t.is((await prs_provider.loadMore(CHUNK_SIZE * REQUESTS)).length, CHUNK_SIZE * REQUESTS);
    t.is(github_api.requests.length, REQUESTS);
    t.is(github_api.requests[0].after_cursor, '');
    t.is(github_api.requests[1].after_cursor, github_api.result.data.search.pageInfo.endCursor);

    // since cursor is static and doesn't change in GitHubGraphQLMock
    t.is(github_api.requests[2].after_cursor, github_api.result.data.search.pageInfo.endCursor);
});