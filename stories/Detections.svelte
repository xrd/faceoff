<script>
  import { onMount } from 'svelte';
  import detections from './detections.json';
  import Center from '../src/Center.svelte';
  // import img_data_url from './img_data_url.json';
  import protest from './protests.jpg';
  let img;

  // const img = {
  //   alt: 'my image',
  //   src: protest,
  // };

  let cannedImg;
  
  // onMount( () => {
  //   cannedImg = img;
  // });

</script>

<style>
  .wrapper {
    height: 600px;
    width: 600px;
  }
.img {
  width: 480px;
}

</style>

<div class="wrapper">

  {#if img}
  <Center
    cannedDetections={detections}
    w={600}
    h={600}
    {img}
    skipDetection={true}
    loaded={true}
    altImgDims={{ height: 3024, width: 4032 }} />
  {/if}
</div>

<img src={protest} class="img" bind:this={img}/>
