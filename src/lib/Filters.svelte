<script>
    export let group_name = '';
    export let filters = []; // [{id: ..., text: "human readable description"}, ...]

    export let selected = [];
</script>

<form class="filters filters-{group_name}">
    <slot></slot>
{#each [...filters] as filter, i (filter.id) }
    <label>
        <input
            type=checkbox
            value={filter.id}
            bind:group={selected}
            />
        {filter.text ? filter.text : filter.id}
    </label>
{/each}
</form>

<style>
</style>