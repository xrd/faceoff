<script>
  import Component from './Component.svelte';
  let h, w;
</script>

<style>
  :global(body) {
    background-color: grey;
  }

  .mobile {
    margin: auto 0;
    height: 600px;
    width: 325px;
    background-color: white;
  }
</style>

<div bind:clientHeight={h} bind:clientWidth={w} class="mobile">

  {#if h && w}
    <Component {h} {w} />
  {/if}

</div>
