import { action } from '@storybook/addon-actions';

import Button from './button.svelte';
import Frame from './Frame.svelte';
import Detections from './Detections.svelte';
import Detections2 from './Detections2.svelte';
import Faces from './Faces.svelte';
import IntroWrapper from './IntroWrapper.svelte';

export default {
  title: 'Button',
  component: Button,
};

export const DetectionsStory = () => ({
  Component: Detections,
});

export const IntroStory = () => ({
  Component: IntroWrapper,
});

export const FacesStory = () => ({
  Component: Faces,
});

export const Detections2Story = () => ({
  Component: Detections2,
});

export const Text = () => ({
  Component: Button,
  props: { text: 'Hello Button' },
  on: { click: action('clicked') },
});

export const FrameStory = () => ({
  Component: Frame,
});

export const Emoji = () => ({
  Component: Button,
  props: {
    text: '😀 😎 👍 💯',
  },
  on: { click: action('clicked') },
});
