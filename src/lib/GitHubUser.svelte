<script>
    import 'lodash/escape';

    export let user; // = {name: string, url: string, avatarUrl: string}
  </script>

<div
    class="pr-attribute pr-reviewer pr-user"
    title="${escape(user.name)}"
    >
    <a
        href="${user.url}"
        >
        <img
            alt="${escape(user.name)} avatar"
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
        margin-right: 0.1em
    }
</style>
