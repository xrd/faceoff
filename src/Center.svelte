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
    Spinner,
  } from 'sveltestrap';
  import { onMount } from 'svelte';
  import * as faceapi from 'face-api.js';

  import { getRelativeBox } from './dimensions';
  import Introduction from './Introduction.svelte';

  export let w, h;
  export let skipDetection = false;
  export let altImgDims = {};
  export let img;
  let src;
  let ctx;
  let canvasWidth = parseInt(w - 20, 10);
  let canvasHeight = parseInt(h / 2 - 20, 10);
  let canvas;
  let offscreenCanvas;
  let files;
  let fullSizeHeight, fullSizeWidth;
  let imgHeight, imgWidth;
  let faces;
  let file;
  let color = 'red';

  let open = false;
  const toggle = () => (open = !open);
  let showPreferences = false;
  const togglePreferences = () => (showPreferences = !showPreferences);

  export let loaded = false;

  let removed = [];
  export let cannedDetections;
  let detections = [];
  let radius = 24;
  let selected = -1;

  $: changeRadiusOnSelection(selected);
  $: changeLastCircleRadius(radius);
  $: load(files);
  $: detect(img);
  $: sussOutDimensions(img);
  $: colorChanged(color);
  $: processDetections(cannedDetections);
  $: drawNewDetections(detections);

  const sussOutDimensions = (img) => {
    // console.log('Img is: ', img);
    if (img) {
      fullSizeHeight = altImgDims.height || img.height;
      fullSizeWidth = altImgDims.width || img.width;
      if (fullSizeHeight > fullSizeWidth) {
        // Make height max, and scale width
        imgHeight = canvasHeight;
        imgWidth = parseInt(
          canvasHeight * (fullSizeWidth / fullSizeHeight),
          10
        );

        if (imgWidth > canvasWidth) {
          imgWidth = canvasWidth;
          imgHeight = parseInt(
            canvasWidth * (fullSizeHeight / fullSizeWidth),
            10
          );
        }
      } else {
        imgWidth = canvasWidth;
        imgHeight = parseInt(
          canvasWidth * (fullSizeHeight / fullSizeWidth),
          10
        );

        if (imgHeight > canvasHeight) {
          imgHeight = canvasHeight;
          imgWidth = parseInt(
            canvasHeight * (fullSizeWidth / fullSizeHeight),
            10
          );
        }
      }

      // console.log(
      //   'Image dimensions',
      //   imgWidth,
      //   imgHeight,
      //   canvasWidth,
      //   canvasHeight
      // );
    }

    if (cannedDetections) {
      // console.log('Processing canned detections');
      processDetections(cannedDetections);
    }
  };

  let generating = false;

  const download = () => {
    // Allow UI to refresh.
      // Get the scale
    generating = true;
    setTimeout(() => {
      const scale = fullSizeHeight / imgHeight;
      draw({
        scale,
        _canvas: offscreenCanvas,
        h: fullSizeHeight,
        w: fullSizeWidth,
      });
      const link = document.createElement('a');
      link.download = 'faceoffus.png';
      link.href = offscreenCanvas.toDataURL();
      link.click();
      generating = false;
    }, 250);
  };

  const colorChanged = (c) => {
    draw();
  };

  const canvasClick = ({ offsetX, offsetY }) => {
    let rX = offsetX;
    let rY = offsetY;
    let defaultClickRadius = 12;
    const detection = {
      radius: defaultClickRadius,
      rX,
      rY,
      rW: defaultClickRadius,
      rH: defaultClickRadius,
      color,
    };
    detections = [detection, ...detections];
    // We add half rW/rH in to get the correct center point, so remove here
    const x = rX - defaultClickRadius / 2,
      y = rY - defaultClickRadius / 2,
      w = defaultClickRadius,
      h = defaultClickRadius;
    const face = getFace(x, y, w, h);
    if (face) {
      faces = [{ src: face, text: new Date().getTime() }, ...faces];
    }
    selected = 0;
    draw();

    // In a short while, get the new item, and scroll it into view
    setTimeout(() => {
      const faces = document.getElementsByClassName('avatar');
      faces[0].scrollIntoView({ behavior: 'smooth' });
    }, 250);
  };

  const drawWhenCanvasReady = (c) => {
    if (c) {
      draw();
    }
  };

  const load = (fs) => {
    if (fs) {
      file = fs[0];
      // console.log('File dimensions', file.height, file.width);
      const reader = new FileReader();
      reader.onloadend = function () {
        // console.log('Reader is:', reader);
        img.src = reader.result;
        loaded = true;
      };
      reader.readAsDataURL(file);
    }
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

  // const logFaceChange = (f) => {
  //   // console.log('CHANGE, faces changed');
  // };

  // $: logFaceChange(faces);

  const changeLastCircleRadius = (r) => {
    if (selected > -1) {
      // console.log('CENTER: Changing radius to:', r);
      detections[selected].radius = r;
      removed[selected] = false;
      const { rX, rY, rW, rH } = detections[selected];
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      const face = getFace(rX - r / 2, rY - r / 2, r, r);
      if (face) {
        faces[selected] = { src: face, text: new Date().getTime() };
        faces = [...faces];
        draw();
      }
    }
  };

  const changeRadiusOnSelection = (s) => {
    if (s > -1) {
      radius = parseInt(detections[s].radius, 10);
    }
  };

  const selectFace = (i) => {
    if (i === selected) {
      removed[i] = !removed[i];
      draw();
    } else {
      selected = i;
    }
  };

  const select = (i) => {
    selected = i;
  };

  const processDetections = (_detections) => {
    if (_detections) {
      faces = [];
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
    }
  };

  let processing = false;

  const detect = (i) => {
    // console.log('DETECING');
    if (i && i.src && !skipDetection) {
      // console.log('READY TO PROCESS', i.src);
      processing = true;
      faceapi.detectAllFaces(img).then((_detections) => {
        // faces = [];
        // console.log('Got detections: ', JSON.stringify(_detections));
        detections = [];
        removed = [];
        processing = false;
        processDetections(_detections);
      });
    }
  };

  const drawNewDetections = (d) => {
    if (d) {
      // console.log('CHANGE: Drawing new detections');
      draw();
    }
  };

  const getCircle = ({ d, imgHeight, imgWidth }) => {
    const { _x, _y, _width, _height } = getRelativeBox(d);
    const rX = _x * imgWidth,
      rY = _y * imgHeight,
      rW = _width * imgWidth,
      rH = _height * imgHeight;
    // console.log(
    //   'x, y, width, height, img width, img height ',
    //   _x,
    //   _y,
    //   _width,
    //   _height,
    //   imgWidth,
    //   imgHeight
    // );
    // console.log('rX, rY, rW, rH', rX, rY, rW, rH);
    return { rX, rY, rW, rH };
  };

  const drawLogo = (ctx, _canvas, scale) => {
    ctx.fillStyle = 'black';
    const factoredScale = scale > 5 ? 5 : 1;
    ctx.font = `${factoredScale * 20}px Arial`;
    const x = _canvas.width - factoredScale * 170;
    const y = _canvas.height - factoredScale * 5;
    console.log('Logo coordinates:', x, y);
    ctx.fillText('👺faceoffUS.com', x, y);
    ctx.fillStyle = 'red';
    ctx.fillText('👺faceoffUS.com', x - 2, y - 2);
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

  const draw = (
    { _canvas = canvas, w = imgWidth, h = imgHeight, scale = 1 } = {
      _canvas: canvas,
      w: imgWidth,
      h: imgHeight,
      scale: 1,
    }
  ) => {
    if (_canvas && loaded && img) {
      console.log('Scale is:', scale);
      ctx = _canvas.getContext('2d');
      // console.log('Drawing the image');
      ctx.drawImage(img, 0, 0, w, h);
      if (!faces || faces.length === 0) {
        detections.forEach((d, i) => {
          const { rX, rY, rW, rH } = d;
          // We add half rW/rH in to get the correct center point, so remove here
          const x = rX - rW / 2,
            y = rY - rH / 2,
            w = rW,
            h = rH;
          const face = getFace(x, y, w, h);
          if (face) {
            faces = [...faces, { src: face, text: new Date().getTime() }];
          }
        });
      }

      detections.forEach((d, i) => {
        // console.log('Checking detection');
        if (!removed[i]) {
          // console.log('Drawing detection', d);
          const { rX, rY, rW, rH, radius } = d;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(scale * rX, scale * rY, scale * radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fill();
        }
      });
      drawLogo(ctx, _canvas, scale);
    }
  };

  const getFace = (x, y, w, h) => {
    let face;
    try {
      const chunk = ctx.getImageData(x, y, w, h);
      face = imagedata_to_image(chunk);
    } catch (e) {
      console.error("Face couldn't be processed", e);
    }
    return face;
  };

  let aiLoaded = false;
  let online = true;

  onMount(() => {
    if (!skipDetection) {
      // console.log(console.log(faceapi.nets));
      // console.log(faceapi.nets);
      faceapi.nets.ssdMobilenetv1.loadFromUri('/weights');
      aiLoaded = true;
    }

    window.addEventListener('offline', () => {
      online = false;
    });
    window.addEventListener('online', () => {
      online = true;
    });
  });
</script>

<style>
  .generating {
    width: 4rem;
  }

  .offscreen {
    position: absolute;
    left: 3000px;
    right: 3000px;
  }
  .canvas {
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
  }
  .faces {
    overflow-x: scroll;
    white-space: nowrap;
    height: 100px;
    max-width: 800px;
  }

  .face_wrapper {
    display: inline-block;
  }

  .faces_wrapper {
    width: 98vw;
  }

  .text {
    font-size: 0.6rem;
    bottom: -20px;
    display: block;
    left: 0px;
    display: none;
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

  .row {
    padding-bottom: 0.6rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .container {
    width: 99%;
    height: 99%;
    overflow-x: hidden;
    overflow-y: hidden;
  }

  .extra {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
</style>

<svelte:head>
  <!-- https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css -->
  <link rel="stylesheet" href="bootstrap.min.css" />
</svelte:head>

<div class="container">
  <div style="height: {h / 2 - 5}px;">
    <Row>
      <Col>
        {#if loaded}
          <canvas
            class="canvas"
            on:click={canvasClick}
            width={imgWidth}
            height={imgHeight}
            bind:this={canvas} />
        {/if}
        {#if processing}
          <div class="processing">Analyzing image for faces...</div>
        {/if}
        {#if !loaded && !canvas}
          <Introduction />
        {/if}
      </Col>
    </Row>
  </div>

  <div style="height: {h / 2 - 5}px;">
    <Row>
      <Col>

        {#if loaded}
          <Row>
            <div class="faces_wrapper">
              <div class="faces">
                {#if faces}
                  {#each faces as face, i}
                    <div class="face_wrapper">
                      <img
                        on:click={() => selectFace(i)}
                        alt="face"
                        class:selected={selected === i}
                        class="avatar"
                        src={face.src} />
                      <span class="text">{face.text}</span>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          </Row>

          <Row>
            <Col>
              <div class="row">
                <Label for="exampleColor">Faceoff Color</Label>
                <Input
                  type="color"
                  name="color"
                  id="exampleColor"
                  bind:value={color}
                  placeholder="color placeholder" />
              </div>
            </Col>
            <Col>
              <div class="row">
                <Label for="radius">Faceoff Radius ({radius})</Label>
                <input
                  type="range"
                  disabled={selected < 0}
                  name="radius"
                  id="radius"
                  bind:value={radius}
                  min="0"
                  max="128" />
              </div>
            </Col>
          </Row>
        {/if}
        <Row>
          <Col>
            <div class="row">
              <Input bind:files type="file" name="file" id="exampleFile" />
              <FormText color="muted">
                Choose an image for processing. This file is NOT sent to any
                other server; the image never leaves your device.
                {#if !loaded}
                  <div class="extra">
                    FaceOffUS.com does not make any network connections to
                    analyze your images; you can even turn off your network
                    while using it. No Google/Facebook tracking/analytics are
                    used on FaceOffUS.com. A self-hosted Matomo is used for
                    analytics.
                  </div>
                {/if}

                {#if !online}
                  {#if aiLoaded}
                    Device is offline, AI is loaded, no problem!
                  {:else}
                    AI has not yet been loaded to device, you need to reconnect
                    and reload this page.
                  {/if}
                {/if}
              </FormText>
            </div>

          </Col>
        </Row>
        {#if loaded}
          <Row>
            <Col>
              <div class="row">
                <Button
                  block
                  disabled={generating}
                  color="primary"
                  on:click={download}>
                  {#if generating}
                    Generating image, please wait...
                  {:else}Download Modified Image{/if}
                </Button>
              </div>
            </Col>
          </Row>
        {/if}
      </Col>
    </Row>
    <Row>
      <!-- <Col>
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
      </Col> -->
    </Row>
  </div>
</div>

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

<img class="img" alt="picture" {src} bind:this={img} />

<canvas
  class="offscreen"
  width={fullSizeWidth}
  height={fullSizeHeight}
  bind:this={offscreenCanvas} />
