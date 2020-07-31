<script>
  import { onMount } from 'svelte';
  import detections from './detections.json';
  import protest from './protests.jpg';
  let img;
  let canvas;

  onMount( () => {
    draw();
  });

  const imgWidth = 400;
  const imgHeight = 400;
  let faces = [];

  const draw = () => {
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
    // drawLogo(ctx);
    faces = [];
    detections.forEach((d, i) => {
        const { rX, rY, rW, rH } = d;
        // We add half rW/rH in to get the correct center point, so remove here
        const chunk = ctx.getImageData(10, 10, 20, 20 );
      // ctx.getImageData(rX - rW / 2, rY - rH / 2, rW, rH);
        faces.push(imagedata_to_image(chunk));
      });
      console.log('Faces:', faces);
  };

  function imagedata_to_image(imagedata) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);
    var image = new Image();
    return canvas.toDataURL();
  }

</script>

<style>
  .wrapper {
    height: 600px;
    width: 600px;
  }
.img {
  width: 480px;
}
.face {
  height: 64px;
  width: 64px;
  border: 2px solid red;
  padding: 0.2rem;
}

</style>

<div class="wrapper">

<canvas height="400" width="400" bind:this={canvas}/>

</div>

{#each faces as face}
<img alt="a face" class="face" src={face}/>
{/each}

<img src={protest} class="img" bind:this={img}/>
