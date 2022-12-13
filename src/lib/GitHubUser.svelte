<script>
    export let user; // = {name: string, url: string, avatarUrl: string}
</script>

<div
    class="{$$props.class}"
    title="{user.name}"
    >
    <a
        href="{user.url}"
        >
        <img
            alt="{user.name} avatar"
            class="avatar"
            src="{user.avatarUrl}"
            >{user.login}
    </a>
</div>

<style>
    .avatar {
        width: 1em;
        height: 1em;
        border-radius: 1em;
        margin-right: 0.1em;
        vertical-align: middle;
    }
</style>
