<script>
  import moment from 'moment';

  export let time;

  // Updating human-friendly value once in 5 minutes seems reasonable
  export let update_interval = 5*60*1000;

  let time_relative_value = moment(time).fromNow();

  setInterval(() => {
    time_relative_value = moment(time).fromNow();
  }, update_interval);

</script>

<time
  class="relative-time"
  data-time="{time}"
  title="{moment(time).format('LLLL')}">
{time_relative_value}
</time>

<style>
</style>