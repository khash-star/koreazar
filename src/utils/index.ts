

export function createPageUrl(pageName: string) {
    // Handle query parameters (e.g., "ListingDetail?id=123")
    if (pageName.includes('?')) {
        const [page, query] = pageName.split('?');
        const pagePath = '/' + page.toLowerCase().replace(/ /g, '-');
        return `${pagePath}?${query}`;
    }
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}