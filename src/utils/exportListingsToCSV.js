import { createPageUrl } from '@/utils';

const BASE_HEADERS = [
  'ID',
  'Title',
  'Listing URL',
  'Category',
  'Subcategory',
  'Price',
  'Location',
  'Condition',
  'In Stock',
  'Listing Type',
];

function escapeCSVCell(val) {
  const cellStr = String(val ?? '');
  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
    return `"${cellStr.replace(/"/g, '""')}"`;
  }
  return cellStr;
}

function rowToCSV(listing, options = {}) {
  const { includeListingTypeExpires = false } = options;
  const createdDate = listing.created_date
    ? new Date(listing.created_date).toLocaleString('mn-MN')
    : '';
  const expiresDate = listing.listing_type_expires
    ? new Date(listing.listing_type_expires).toLocaleString('mn-MN')
    : '';
  const imageLinks = listing.images && Array.isArray(listing.images)
    ? listing.images
        .map((img) => (typeof img === 'string' ? img : img?.w800 || img?.w640 || img?.w400 || img?.w150 || ''))
        .filter(Boolean)
        .join('; ')
    : '';
  const listingUrl = listing.id
    ? `${window.location.origin}${createPageUrl(`ListingDetail?id=${listing.id}`)}`
    : '';

  const baseRow = [
    listing.id || '',
    listing.title || '',
    listingUrl,
    listing.category || '',
    listing.subcategory || '',
    listing.price || '',
    listing.location || '',
    listing.condition || '',
    'in stock',
    listing.listing_type || 'regular',
  ];
  const restRow = includeListingTypeExpires
    ? [
        expiresDate,
        listing.created_by || '',
        createdDate,
        listing.views || 0,
        imageLinks,
        listing.phone || '',
        listing.kakao_id || '',
        listing.wechat_id || '',
        listing.whatsapp || '',
        listing.facebook || '',
        (listing.description || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      ]
    : [
        listing.created_by || '',
        createdDate,
        listing.views || 0,
        imageLinks,
        listing.phone || '',
        listing.kakao_id || '',
        listing.wechat_id || '',
        listing.whatsapp || '',
        listing.facebook || '',
        (listing.description || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      ];
  return [...baseRow, ...restRow];
}

/**
 * Export listings to CSV and trigger download
 * @param {Array} listings - Listings to export
 * @param {string} filename - Base filename (without .csv)
 * @param {Object} options - { includeListingTypeExpires: boolean }
 */
export function exportListingsToCSV(listings, filename, options = {}) {
  if (!listings?.length) {
    alert('Экспортлох зар байхгүй байна.');
    return;
  }

  const { includeListingTypeExpires = false } = options;
  const headers = [
    ...BASE_HEADERS,
    ...(includeListingTypeExpires ? ['Listing Type Expires'] : []),
    'Created By',
    'Created Date',
    'Views',
    'Image Links',
    'Phone',
    'Kakao ID',
    'WeChat ID',
    'WhatsApp',
    'Facebook',
    'Description',
  ];
  const rows = listings.map((l) => rowToCSV(l, { includeListingTypeExpires }));

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(',')),
  ].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
