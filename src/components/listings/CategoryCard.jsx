import React from 'react';
import { motion } from 'framer-motion';
import { categoryInfo } from '@/constants/listings';

export default function CategoryCard({ category, count = 0, onClick }) {
  const info = categoryInfo[category] || categoryInfo.other;
  
  return (
    <motion.div
      onClick={() => onClick && onClick(category)}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl p-6 cursor-pointer group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative z-10">
        <span className="text-4xl mb-3 block">{info.icon}</span>
        <h3 className="font-semibold text-gray-900 text-lg">{info.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{count} зар</p>
      </div>
    </motion.div>
  );
}

export { categoryInfo };