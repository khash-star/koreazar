import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const categoryInfo = {
  realestate: { name: 'Үл хөдлөх', icon: '🏠', color: 'from-blue-500 to-blue-600' },
  vehicles: { name: 'Автомашин', icon: '🚗', color: 'from-red-500 to-red-600' },
  electronics: { name: 'Электроник', icon: '📱', color: 'from-purple-500 to-purple-600' },
  jobs: { name: 'Ажлын байр', icon: '💼', color: 'from-green-500 to-green-600' },
  services: { name: 'Үйлчилгээ', icon: '🔧', color: 'from-yellow-500 to-yellow-600' },
  fashion: { name: 'Хувцас/Косметик', icon: '👕', color: 'from-pink-500 to-pink-600' },
  furniture: { name: 'Тавилга', icon: '🛋️', color: 'from-amber-500 to-amber-600' },
  cargo: { name: 'Карго', icon: '📦', color: 'from-teal-500 to-teal-600' },
  community: { name: 'Утас/Дугаар', icon: '📞', color: 'from-indigo-500 to-indigo-600' },
  other: { name: 'Бусад', icon: '📦', color: 'from-gray-500 to-gray-600' }
};

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