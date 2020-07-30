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

  import { getRelativeBox } from './dimensions';

  export let w, h;
  export let skipDetection = false;
  export let altImgDims = {};
  export let img;
  let src;
  let ctx;
  let canvasWidth = parseInt(w - 20, 10);
  let canvasHeight = parseInt(h / 2 - 20, 10);
  let canvas;
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
      console.log('Processing canned detections');
      processDetections(cannedDetections);
    }
  };

  const download = () => {
    const link = document.createElement('a');
    link.download = 'faceoffus.png';
    link.href = canvas.toDataURL();
    link.click();
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
  };

  const drawWhenCanvasReady = (c) => {
    if (c) {
      draw();
    }
  };

  const load = (fs) => {
    if (fs) {
      file = fs[0];
      console.log('File dimensions', file.height, file.width);
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

  const draw = () => {
    if (canvas && loaded && img) {
      ctx = canvas.getContext('2d');
      // console.log('Drawing the image');
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      if (!faces) {
        // console.log('CHANGE, grabbing faces here again');
        faces = [];
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
        if (!removed[i]) {
          const { rX, rY, rW, rH, radius } = d;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(rX, rY, radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fill();
        }
      });
      drawLogo(ctx);
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

  onMount(() => {
    if (!skipDetection) {
      // console.log(console.log(faceapi.nets));
      // console.log(faceapi.nets);
      faceapi.nets.ssdMobilenetv1.loadFromUri('/weights');
    }
  });
</script>

<style>
  .faces {
    overflow-x: scroll;
    white-space: nowrap;
    height: 100px;
    width: 100%;
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
      {#if loaded}
        <canvas
          on:click={canvasClick}
          width={imgWidth}
          height={imgHeight}
          bind:this={canvas} />
      {:else}
      {#if processing}
      <div class="processing">Analyzing image for faces...</div>
      {/if}
      {/if}
      </Col>
      </Row>
  </Row>

  <Row style="height: {h / 2 - 5}px;">
    <Row>
      <Col>
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

        {#if loaded}
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
                Choose a file for processing. This file is NOT sent to any other
                server; it never leaves your browser.
              </FormText>
            </div>
          </Col>
        </Row>
        {#if loaded}
        <Row>
          <Col>
            <div class="row">
              <Button block color="primary" on:click={download}>
                Download Modified Image
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

<img class="img" alt="picture" {src} bind:this={img} />
