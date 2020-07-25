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

  export let w, h;

  let img;
  let canvas;
  let files;

  let open = false;
  const toggle = () => (open = !open);
  let showPreferences = false;
  const togglePreferences = () => (showPreferences = !showPreferences);

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

  const colorChanged = (c) => {
    draw({ processFaces: false });
  };

  $: colorChanged(color);

  const canvasClick = ({ offsetX, offsetY }) => {
    clicks = [{ offsetX, offsetY, radius, color }, ...clicks];
    selected = 0;
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
    if (selected > -1) {
      if (selected >= clicks.length) {
        detections[selected + clicks.length].radius = r;
      } else {
        clicks[selected].radius = radius;
      }
      draw({ processFaces: false });
    }
  };

  const changeRadiusOnSelection = (s) => {
    if (s > -1) {
      if (s >= clicks.length) {
        radius = parseInt(detections[s - clicks.length].radius, 10);
      } else {
        radius = clicks[s].radius;
      }
    }
  };

  $: changeRadiusOnSelection(selected);

  let selected = -1;
  const selectFace = (i) => {
    if (i === selected) {
      removed[i] = !removed[i];
      draw({ processFaces: false });
    } else {
      selected = i;
    }
  };

  const select = (i) => {
    selected = i;
  };

  const detect = (i) => {
    if (i) {
      faceapi.detectAllFaces(img).then((_detections) => {
        console.log('Got detections: ', _detections.length);
        detections = [];
        _detections.forEach((d) => {
          const { rX, rY, rW, rH } = getCircle({ d, imgHeight, imgWidth });
          const radius = Math.max(rH, rW) / 2;
          detections.push({
            rX: rX + rW / 2,
            rY: rY + rH / 2,
            rW,
            rH,
            radius,
            color,
          });
        });
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

  let date = '1776:07:04';

  function addExifData(file) {
    const zeroth = {};
    const exif = {};
    // const gps = {};
    // zeroth[piexif.ImageIFD.Make] = "Make";
    // zeroth[piexif.ImageIFD.XResolution] = [777, 1];
    // zeroth[piexif.ImageIFD.YResolution] = [777, 1];
    zeroth[piexif.ImageIFD.Software] = 'faceoffus.com';
    exif[piexif.ExifIFD.DateTimeOriginal] = date;
    // exif[piexif.ExifIFD.LensMake] = 'LensMake';
    // exif[piexif.ExifIFD.Sharpness] = 777;
    // exif[piexif.ExifIFD.LensSpecification] = [
    //   [1, 1],
    //   [1, 1],
    //   [1, 1],
    //   [1, 1],
    // ];
    // gps[piexif.GPSIFD.GPSVersionID] = [7, 7, 7, 7];
    // gps[piexif.GPSIFD.GPSDateStamp] = '1999:99:99 99:99:99';
    var exifObj = {
      '0th': zeroth,
      Exif: exif,
      //GPS: gps,
    };
    var exifStr = piexif.dump(exifObj);

    var reader = new FileReader();
    reader.onload = function (e) {
      var inserted = piexif.insert(exifStr, e.target.result);
      var image = new Image();
      image.src = inserted;
      image.width = 200;
      // var el = $('<div></div>').append(image);
      // $('#resized').prepend(el);
      // What do we do with the file?
    };

    reader.readAsDataURL(file);
  }

  const draw = ({ processFaces = true } = {}) => {
    if (canvas && loaded) {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      drawLogo(ctx);
      if (processFaces) {
        faces = [];
        detections.forEach((d, i) => {
          const { rX, rY, rW, rH } = d;
          // We add half rW/rH in to get the correct center point, so remove here
          const chunk = ctx.getImageData(rX - rW / 2, rY - rH / 2, rW, rH);
          faces.push(imagedata_to_image(chunk));
        });
      }

      detections.forEach((d, i) => {
        if (!removed[i + clicks.length]) {
          const { rX, rY, rW, rH, radius } = d;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(rX, rY, radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fill();
        }
      });

      clicks.forEach(({ offsetX, offsetY, radius }) => {
        const rX = offsetX,
          rY = offsetY;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(rX, rY, radius, 0, 2 * Math.PI);
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
    display: none;
  }

  .selected {
    border: 4px solid red;
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
  <Row style="height: {h / 2 - 5}px;">
    <Row>
      <Col>
        <canvas
          on:click={canvasClick}
          width="600"
          height="400"
          bind:this={canvas} />
      </Col>
    </Row>
  </Row>
  <Row style="height: {h / 2 - 5}px;">
    <Row>
      <Col>
        <div class="faces">
          {#if clicks}
            {#each clicks as click, i}
              <span
                class:selected={selected === i}
                on:click={() => select(i)}
                style="background-color: {click.color};"
                class="avatar">
                r:{click.radius}
              </span>
            {/each}
          {/if}
          {#if faces}
            {#each faces as face, i}
              <img
                on:click={() => selectFace(i + clicks.length)}
                alt="face"
                class:selected={selected === i + clicks.length}
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
                type="color"
                name="color"
                id="exampleColor"
                bind:value={color}
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
        <Button on:click={togglePreferences}>
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            class="bi bi-sliders"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              d="M14 3.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM11.5 5a1.5 1.5 0 1
              0 0-3 1.5 1.5 0 0 0 0 3zM7 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5
              0zM4.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9.5 3.5a2.5 2.5 0 1
              1-5 0 2.5 2.5 0 0 1 5 0zM11.5 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0
              3z" />
            <path
              fill-rule="evenodd"
              d="M9.5 4H0V3h9.5v1zM16 4h-2.5V3H16v1zM9.5 14H0v-1h9.5v1zm6.5
              0h-2.5v-1H16v1zM6.5 9H16V8H6.5v1zM0 9h2.5V8H0v1z" />
          </svg>
        </Button>
      </Col>
      <!-- <Col>
      {#if files && files[0]}
        <p>{files[0].name}</p>
      {/if}
    </Col> -->
    </Row>
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

<Modal isOpen={showPreferences} toggle={togglePreferences}>
  <ModalHeader toggle={togglePreferences}>Image Export Preferences</ModalHeader>
  <ModalBody>
    Choose EXIF date:
    <select value={date}>
      <option val="1775:05:25">
        May 25, 1775: British troops arrive in US
      </option>
    </select>

  </ModalBody>
  <ModalFooter>
    <Button color="secondary" on:click={() => (showPreferences = false)}>
      Cancel
    </Button>
  </ModalFooter>
</Modal>

<img class="img" alt="picture" bind:this={img} />
