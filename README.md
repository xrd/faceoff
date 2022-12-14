## Introduction

![Face Off](faceoff.png)

## UI

![Face Off](faceoff-ui.png)


## Details

This is a svelte app that wraps the face-api-js code and permits you to easily add circles around faces. 

## Caveats

I recall that some devices, like iOS (?) might not load the libraries correctly, so I wrote some retry functions. YMMV.

## Installation

To install dependencies:

```
yarn # or npm i or pnpm i
```

# Local Development

To play with it locally:

```
yarn dev # or npm run dev or pnpm run dev
```

Then, open http://localhost:8080

## Storybook

You can run storybook as well to see a few of the components used.

```
yarn storybook
```


