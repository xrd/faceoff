import { action } from '@storybook/addon-actions';

import Button from './button.svelte';
import Frame from './Frame.svelte';

export default {
  title: 'Button',
  component: Button,
};

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
