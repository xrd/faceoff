<script>
  import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Button,
  } from 'sveltestrap';

  let open = false;

  const toggle = () => {
    open = !open;
  }

</script>

<style>

.center {
  margin: 0 auto;
  text-align: center;
}

.split {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
  .wrapper {
    text-align: center;
  }

  .text {
    font-size: 1.05rem;
    font-weight: bold;
  }

  .before_and_after {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    height: 100%;
    vertical-align: middle;
  }

  .img {
    width: 70%;
    text-align: center;
  }

.uses {
  font-size: 0.6rem;
  text-align: left;
  padding: 1rem;
}

  img {
    width: 70%;
  }
</style>

<div class="wrapper">

  <div class="text">
    FaceOffUs.com makes it easy to obscure faces in your pictures.
  </div>

  <div class="before_and_after">
    <div class="img">
      <img src="before.png" alt="Before..." />
      <div class="text">Go from this...</div>
    </div>
    <div class="img">
      <img src="after.png" alt="After..." />
      <div class="text">... to this, with one click.</div>
    </div>
  </div>

  <div class="uses">
<div class="split">
  <div>
    <ul>
      <li>
        share photos on social media but avoid entry into their facial recogntion database.
      </li>
      <li>
        Protect your kids from social media companies.
      </li>
      <li>
        Share photos of public events without compromising people in the
        photo.
      </li>
    </ul>
  </div>
  <div>
    <Button on:click={() => open = true}>Watch video</Button>
</div>
</div>
  </div>
</div>

<Modal isOpen={open} {toggle}>
  <ModalHeader {toggle}>Video</ModalHeader>
  <ModalBody>


  <div class="center">
    <video controls="true" width="216" height="432" src="low.mp4"></video>
  </div>
  </ModalBody>
  <ModalFooter>
    <Button on:click={toggle}>Close</Button>
  </ModalFooter>
</Modal>
