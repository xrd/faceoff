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
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from 'sveltestrap';
  import { onMount } from 'svelte';
  import * as faceapi from 'face-api.js';

  let img;
  let canvas;
  let files;

  let open = false;
  const toggle = () => (open = !open);

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
  let clicks = [];
  let color = 'red';

  const canvasClick = ({ offsetX, offsetY }) => {
    clicks.push({ offsetX, offsetY, radius, color });
    draw({ processFaces: false });
  };

  let loaded = false;

  const load = (fs) => {
    if (fs) {
      console.log('Filename', fs[0].name);
      file = fs[0];
      const reader = new FileReader();
      reader.onloadend = function () {
        img.src = reader.result;
        loaded = true;
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
  let radius = 24;

  $: changeLastCircleRadius(radius);

  const changeLastCircleRadius = (r) => {
    if (clicks) {
      clicks[clicks.length - 1] = { ...clicks[clicks.length - 1], radius };
      draw({ processFaces: false });
    }
  };

  const remove = (i) => {
    removed[i] = !removed[i];
    draw({ processFaces: false });
  };

  const detect = (i) => {
    if (i) {
      faceapi.detectAllFaces(img).then((_detections) => {
        console.log('Got detections: ', _detections.length);
        detections = _detections;
        clicks = [];
        removed = [];
        draw();
      });
    }
  };

  const getCircle = ({ d, imgHeight, imgWidth }) => {
    const { x, y, width, height } = getRect(d);
    const rX = x * imgWidth,
      rY = y * imgHeight,
      rW = width * imgWidth,
      rH = height * imgHeight;
    return { rX, rY, rW, rH };
  };

  const drawLogo = (ctx) => {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('👺faceoffUS.com', canvas.width - 170, canvas.height - 5);
    ctx.fillStyle = 'red';
    ctx.fillText('👺faceoffUS.com', canvas.width - 171, canvas.height - 4);
    ctx.font = '20px Arial';
  };

  const draw = ({ processFaces = true } = {}) => {
    if (canvas && loaded) {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      drawLogo(ctx);
      console.log('Detections: ', detections.length);
      if (processFaces) {
        faces = [];
        detections.forEach((d, i) => {
          const { rX, rY, rW, rH } = getCircle({ d, imgHeight, imgWidth });
          const chunk = ctx.getImageData(rX, rY, rW, rH);
          faces.push(imagedata_to_image(chunk));
        });
      }

      detections.forEach((d, i) => {
        if (!removed[i]) {
          const { rX, rY, rW, rH } = getCircle({ d, imgHeight, imgWidth });
          const radiusH = rH / 2;
          const radiusW = rW / 2;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(rX + radiusW, rY + radiusH, radiusH, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fill();
        }
      });

      clicks.forEach(({ offsetX, offsetY, radius }) => {
        const rX = offsetX,
          rY = offsetY;
        const radiusH = radius;
        const radiusW = radius;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(rX, rY, radiusH, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
      });
    }
  };

  onMount(() => {
    console.log(console.log(faceapi.nets));
    console.log(faceapi.nets);
    faceapi.nets.ssdMobilenetv1.loadFromUri('/weights');
  });
</script>

<style>
  .faces {
    overflow-x: scroll;
    white-space: nowrap;
    height: 100px;
  }
  .img {
    width: 100%;
    visibility: hidden;
  }

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: inline-block;
    text-align: center;
    line-height: 64px;
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
      <canvas
        on:click={canvasClick}
        width="600"
        height="400"
        bind:this={canvas} />
    </Col>
  </Row>

  <Row>
    <Col>
      <div class="faces">
        {#if clicks}
          {#each clicks as click, i}
            <span style="background-color: {click.color};" class="avatar">
              {click.radius}
            </span>
          {/each}
        {/if}
        {#if faces}
          {#each faces as face, i}
            <img
              on:click={() => remove(i)}
              alt="face"
              class="avatar"
              src={face} />
          {/each}
        {/if}
      </div>
    </Col>
  </Row>

  <Row>
    <Col>
      <FormGroup>
        <Row>
          <Col>
            <Input bind:files type="file" name="file" id="exampleFile" />
            <FormText color="muted">
              Choose a file for processing. This file is NOT sent to any other
              server; it never leaves your browser.
            </FormText>
          </Col>
          <Col>
            <Label for="exampleColor">Color</Label>
            <Input
              bind:color
              type="color"
              name="color"
              id="exampleColor"
              placeholder="color placeholder" />
          </Col>
          <Col>
            <Label for="radius">Radius ({radius})</Label>
            <input
              type="range"
              name="radius"
              id="radius"
              bind:value={radius}
              min="0"
              max="128" />
          </Col>
          <Col>
            <Button color="primary" outline on:click={download}>
              Download
            </Button>

          </Col>
        </Row>
      </FormGroup>
    </Col>
  </Row>
  <Row>
    <Col>
      <Button color="danger" on:click={toggle}>Remove watermark</Button>
    </Col>
    <!-- <Col>
      {#if files && files[0]}
        <p>{files[0].name}</p>
      {/if}
    </Col> -->
  </Row>
</Container>

<Modal isOpen={open} {toggle}>
  <ModalHeader {toggle}>Purchase Yearly Subscription</ModalHeader>
  <ModalBody>
    Remove the faceoffus.com watermark for just $10/yr. Pay with credit card,
    PayPal, or even Bitcoin or Ethereum!
  </ModalBody>
  <ModalFooter>
    <Button color="primary" on:click={toggle}>Pay Now</Button>
    <Button color="secondary" on:click={() => (open = false)}>Cancel</Button>
  </ModalFooter>
</Modal>

<img class="img" alt="picture" bind:this={img} />
