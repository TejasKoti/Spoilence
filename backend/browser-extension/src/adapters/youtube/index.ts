import selectors from './selectors.json';
import type { Adapter } from '../contracts.js';
export const youtube: Adapter = { site: 'youtube', ...selectors };
