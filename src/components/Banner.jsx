import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export default function Banner({ imageUrl, link, title, className = "" }) {
  const defaultBanner = {
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=200&fit=crop',
    title: 'Баннер зар байршуулах',
    link: '#'
  };

  const bannerData = {
    imageUrl: imageUrl || defaultBanner.imageUrl,
    link: link || defaultBanner.link,
    title: title || defaultBanner.title
  };

  return (
    <motion.a
      href={bannerData.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`block relative overflow-hidden rounded-2xl shadow-lg group ${className}`}
    >
      <img
        src={bannerData.imageUrl}
        alt={bannerData.title}
        width={300}
        height={160}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent group-hover:from-black/30 transition-all" />
      <div className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
        <ExternalLink className="w-3 h-3" />
        Sponsored
      </div>
    </motion.a>
  );
}