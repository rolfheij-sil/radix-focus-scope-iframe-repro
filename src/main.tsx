import { createRoot } from 'react-dom/client';
import { Host, PaneA, PaneB } from './App';

const params = new URLSearchParams(location.search);
const pane = params.get('pane');
if (pane === 'a' && params.get('patched') === '1') await import('./patch');
const Component = pane === 'a' ? PaneA : pane === 'b' ? PaneB : Host;
createRoot(document.getElementById('root')!).render(<Component />);
