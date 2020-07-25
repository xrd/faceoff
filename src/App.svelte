<script>
  import {
    Button,
    Col,
    Row,
    Container,
    Form,
    FormGroup,
    FormText,
    Input,
    Label,
  } from 'sveltestrap';
  import { onMount } from 'svelte';
  import * as faceapi from 'face-api.js';

  let img;
  let canvas;
  let files;

  const imgHeight = 400;
  const imgWidth = 600;

  const getRect = (d) => {
    return d.relativeBox;
  };

  const download = () => {
    const link = document.createElement('a');
    link.download = 'family.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  let faces;
  let file;

  const load = (fs) => {
    if (fs) {
      console.log('Filename', fs[0].name);
      file = fs[0];
      const reader = new FileReader();
      reader.onloadend = function () {
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  $: load(files);
  $: detect(img);

  function imagedata_to_image(imagedata) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);

    var image = new Image();
    return canvas.toDataURL();
  }

  let removed = [];
  let detections;

  const remove = (i) => {
    removed[i] = !removed[i];
    draw({ processFaces: false });
  };

  const detect = (i) => {
    if (i) {
      faceapi.detectAllFaces(img).then((_detections) => {
        console.log('Got detections: ', _detections.length);
        detections = _detections;
        draw();
      });
    }
  };

  const draw = ({ processFaces = true } = {}) => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('👺faceoffUS.com', canvas.width - 170, canvas.height - 5);
    ctx.fillStyle = 'red';
    ctx.fillText('👺faceoffUS.com', canvas.width - 171, canvas.height - 4);
    ctx.font = '20px Arial';
    console.log('Detections: ', detections.length);
    if (processFaces) {
      faces = [];
      detections.forEach((d, i) => {
        const { x, y, width, height } = getRect(d);
        const rX = x * imgWidth,
          rY = y * imgHeight,
          rW = width * imgWidth,
          rH = height * imgHeight;
        const chunk = ctx.getImageData(rX, rY, rW, rH);
        faces.push(imagedata_to_image(chunk));
      });
    }

    detections.forEach((d, i) => {
      if (!removed[i]) {
        const { x, y, width, height } = getRect(d);
        const rX = x * imgWidth,
          rY = y * imgHeight,
          rW = width * imgWidth,
          rH = height * imgHeight;

        const radiusH = rH / 2;
        const radiusW = rW / 2;
        ctx.beginPath();
        ctx.arc(rX + radiusW, rY + radiusH, radiusH, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
      }
    });
  };

  onMount(() => {
    console.log(console.log(faceapi.nets));
    console.log(faceapi.nets);
    faceapi.nets.ssdMobilenetv1.loadFromUri('/weights');
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

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
  }
</style>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" />
</svelte:head>

<Container>
  <Row>
    <Col>
      <canvas width="600" height="400" bind:this={canvas} />
    </Col>
  </Row>

  <Row>
    <Col>
      <Button color="primary" outline on:click={() => detect(file)}>
        Detect
      </Button>
      <Button color="primary" outline on:click={download}>Download</Button>
    </Col>
    <Col>
      {#if faces}
        {#each faces as face, i}
          <img
            on:click={() => remove(i)}
            alt="face"
            class="avatar"
            src={face} />
        {/each}
      {/if}

    </Col>
  </Row>

  <Row>
    <Col>
      <FormGroup>
        <Input bind:files type="file" name="file" id="exampleFile" />
        <FormText color="muted">
          Choose a file for processing. This file is NOT sent to any other
          server; it never leaves your browser.
        </FormText>
      </FormGroup>
    </Col>
    <!-- <Col>
      {#if files && files[0]}
        <p>{files[0].name}</p>
      {/if}
    </Col> -->
  </Row>
</Container>

<img class="img" alt="picture" bind:this={img} />
