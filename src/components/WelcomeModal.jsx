import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 text-white p-8 rounded-t-3xl">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Хаах"
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
                
                <div className="text-center">
                  <div className="text-6xl mb-4">🇲🇳 🇰🇷</div>
                  <h2 className="text-3xl font-bold mb-2">Тавтай морил!</h2>
                  <p className="text-amber-50 text-lg">
                    Солонгос дахь Монголчуудын зарын нэгдсэн сайт
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Та Facebook-ийн олон группээс хэрэгтэй зараа хайж ухаж цаг заваа алдахгүйгээр...
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Бүх хэрэгтэй зар, мэдээллээ манай сайтаас хялбараар олж авна!
                  </p>
                </div>

                <div className="grid gap-4 mb-8">
                  <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Хялбар хайлт</h4>
                      <p className="text-sm text-gray-600">Ангилал, байршил, үнийн дүнгээр шүүж хурдан олоорой</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Цаг хэмнэх</h4>
                      <p className="text-sm text-gray-600">Олон Facebook групп хайх шаардлагагүй, бүх зар нэг газарт</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Найдвартай</h4>
                      <p className="text-sm text-gray-600">Админы зөвшөөрсөн зарууд, аюулгүй арилжаа</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onClose}
                  className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl"
                >
                  Сайтаа үзэх
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}