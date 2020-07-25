<script>
  import Center from './Center.svelte';
  let h, w;
</script>

<style>
  .all {
    height: 100%;
    width: 100%;
  }
</style>

<div bind:clientHeight={h} bind:clientWidth={w} class="all">
  {#if h && w}
    <Center {h} {w} />
  {/if}
</div>
