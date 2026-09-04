import { PLACEHOLDER_PATHS } from '$lib/shell';

// adapter-static prerenders what it can reach by crawling plus what a route declares.
// The menu links to all of these, so the crawl would find most of them; declaring them
// is what makes the set the record's rather than the crawler's.
export const entries = () => PLACEHOLDER_PATHS.map((path) => ({ path: path.slice(1) }));
