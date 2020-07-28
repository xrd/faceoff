<script>
  import { onMount } from 'svelte';
  import detections from './detections.json';
  import Center from '../src/Center.svelte';
  // import img_data_url from './img_data_url.json';
  import protest from './protests.jpg';

  const img = {
    alt: 'my image',
    src: protest,
  };

</script>

<style>
  .wrapper {
    height: 600px;
    width: 600px;
  }
</style>

<div class="wrapper">

  <Center
    cannedDetections={detections}
    w={600}
    h={600}
    cannedImage={img}
    skipDetection={true}
    loaded={true}
    altImgDims={{ height: 3024, width: 4032 }} />

</div>
