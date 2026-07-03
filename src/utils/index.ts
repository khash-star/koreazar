

export function createPageUrl(pageName: string) {
    // Handle query parameters (e.g., "ListingDetail?id=123")
    if (pageName.includes('?')) {
        const [page, query] = pageName.split('?');
        const pagePath = page.toLowerCase() === 'home' ? '/' : '/' + page.replace(/ /g, '-');
        return `${pagePath}?${query}`;
    }
    // Home page should route to root
    if (pageName.toLowerCase() === 'home') {
        return '/';
    }
    return '/' + pageName.replace(/ /g, '-');
}

/**
 * Same as `createPageUrl`, but keeps the current country prefix (e.g. `/us`)
 * so in-app navigation doesn't drop a user back into the KR/legacy context
 * while browsing `/kr`, `/us`, or `/jp`.
 *
 * Pass `null`/`undefined` for `routePrefix` (e.g. when on the un-prefixed
 * root `/`) to get the exact legacy URL — this keeps root-path navigation
 * byte-for-byte identical to current production.
 * @param {string} pageName - See `createPageUrl`.
 * @param {string | null | undefined} routePrefix - e.g. `/us`, or falsy for none.
 */
export function createCountryPageUrl(pageName: string, routePrefix?: string | null) {
    const base = createPageUrl(pageName);
    if (!routePrefix) return base;
    return base === '/' ? routePrefix : `${routePrefix}${base}`;
}