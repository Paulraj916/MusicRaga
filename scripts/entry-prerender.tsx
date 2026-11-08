import { renderToString } from 'react-dom/server';
import App from '../src/App';
export { ALL_ROUTES, resolveRoute, indexableRoute } from '../src/routes';
export { pageSeo, siteConfig } from '../src/seo';
export function render(path: string) {
  return renderToString(<App initialPath={path} />);
}

export { CATALOGUE } from '../src/realCatalogue';
export { FILTER_DIMENSIONS } from '../src/catalogue';
export { optionsFor } from '../src/lib';
