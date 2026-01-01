

export function createPageUrl(pageName: string) {
    // Check if there's a query string (e.g., "ListingDetail?id=123")
    const queryIndex = pageName.indexOf('?');
    if (queryIndex !== -1) {
        // Split page name and query string
        const page = pageName.substring(0, queryIndex);
        const queryString = pageName.substring(queryIndex);
        // Only lowercase the page name, keep query string as is
        return '/' + page.toLowerCase().replace(/ /g, '-') + queryString;
    }
    // No query string, just lowercase the page name
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}