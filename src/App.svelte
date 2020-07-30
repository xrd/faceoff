<script>
  import Center from './Center.svelte';
  let h, w;
</script>

<style>
  .all {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  .wrapper {
    max-width: 800px;
    margin: 0 auto;
  }

</style>

  <div bind:clientHeight={h} bind:clientWidth={w} class="all">
    {#if h && w}
    <div class="wrapper">
      <Center {h} {w} />
      </div>
    {/if}
  </div>
