import { mount } from 'svelte';
import './ui/styles/global.css';
import App from './ui/App.svelte';
import { auth } from './auth';
import { initI18n } from './i18n';

async function bootstrap(): Promise<void> {
  // Language first, so the first paint is already translated and has the right direction.
  await initI18n();
  auth.init();
  mount(App, { target: document.getElementById('app')! });
}

void bootstrap();

