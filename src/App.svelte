<script>
  import { onMount } from "svelte";
  export let name;
  import * as faceapi from "face-api.js";

  let img;
  let canvas;

  const imgHeight = 400;
  const imgWidth = 600;

  const getRect = d => {
    return d.relativeBox;
  };

  let faces;

  function imagedata_to_image(imagedata) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);

    var image = new Image();
    return canvas.toDataURL();
  }

  const detect = () => {
    faceapi.detectAllFaces(img).then(_detections => {
      // setProcessingState(PROCESSED);
      // setupFaces(_detections.length);
      // console.log("Images: ", img);
      console.log("Detected: ", _detections);
      //setDetections(_detections);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      ctx.fillStyle = "black";
      faces = [];

      _detections.forEach(d => {
        const { x, y, width, height } = getRect(d);

        const rX = x * imgWidth,
          rY = y * imgHeight,
          rW = width * imgWidth,
          rH = height * imgHeight;

        // Get out the image chunk
        const chunk = ctx.getImageData(rX, rY, rW, rH);
        faces.push(imagedata_to_image(chunk));

        ctx.fillRect(rX, rY, rW, rH);
      });
    });
  };

  onMount(() => {
    console.log(console.log(faceapi.nets));
    console.log(faceapi.nets);
    faceapi.nets.ssdMobilenetv1.loadFromUri("/weights");
  });
</script>

<style>
  h1 {
    color: purple;
  }

  .img {
    width: 100%;
    visibility: hidden;
  }
</style>

<canvas width="600" height="400" bind:this={canvas} />

<button on:click={detect}>Detect</button>

{#if faces}
  {#each faces as face}
    <img src={face} />
  {/each}
{/if}

<img class="img" src="hawaii.png" alt="picture" bind:this={img} />
