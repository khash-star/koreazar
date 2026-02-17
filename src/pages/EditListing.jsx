import React, { useState, useEffect } from 'react';
import * as entities from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Loader2, Check, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLogin } from '@/services/authService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryInfo } from '@/components/listings/CategoryCard';
import { subcategoryConfig } from '@/components/listings/subcategoryConfig';
import { createImageVariants } from '@/components/utils/imageCompressor';
import { getListingImageUrl } from '@/utils/imageUrl';

const locations = [
  'Seoul',
  'Busan',
  'Incheon',
  'Daegu',
  'Gyeonggi-do',
  'Gyeongsangnam-do'
];

export default function EditListing() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [listingId, setListingId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setListingId(urlParams.get('id'));
  }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const listings = await entities.Listing.filter({ id: listingId });
      return listings[0];
    },
    enabled: !!listingId
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    location: '',
    phone: '',
    kakao_id: '',
    wechat_id: '',
    whatsapp: '',
    facebook: '',
    condition: 'used',
    is_negotiable: true,
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_mileage: '',
    vehicle_fuel_type: '',
    vehicle_transmission: '',
    electronics_brand: '',
    electronics_model: '',
    realestate_size: '',
    realestate_rooms: '',
    realestate_bathrooms: '',
    realestate_floor: '',
    job_type: '',
    job_salary: ''
  });

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price || '',
        category: listing.category || '',
        subcategory: listing.subcategory || '',
        location: listing.location || '',
        phone: listing.phone || '',
        kakao_id: listing.kakao_id || '',
        wechat_id: listing.wechat_id || '',
        whatsapp: listing.whatsapp || '',
        facebook: listing.facebook || '',
        condition: listing.condition || 'used',
        is_negotiable: listing.is_negotiable !== undefined ? listing.is_negotiable : true,
        vehicle_make: listing.vehicle_make || '',
        vehicle_model: listing.vehicle_model || '',
        vehicle_year: listing.vehicle_year || '',
        vehicle_mileage: listing.vehicle_mileage || '',
        vehicle_fuel_type: listing.vehicle_fuel_type || '',
        vehicle_transmission: listing.vehicle_transmission || '',
        electronics_brand: listing.electronics_brand || '',
        electronics_model: listing.electronics_model || '',
        realestate_size: listing.realestate_size || '',
        realestate_rooms: listing.realestate_rooms || '',
        realestate_bathrooms: listing.realestate_bathrooms || '',
        realestate_floor: listing.realestate_floor || '',
        job_type: listing.job_type || '',
        job_salary: listing.job_salary || ''
      });
      setImages(listing.images || []);
    }
  }, [listing]);

  const availableSubcategories = formData.category ? subcategoryConfig[formData.category] || [] : [];

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return entities.Listing.update(listingId, data);
    },
    onSuccess: () => {
      navigate(createPageUrl(`ListingDetail?id=${listingId}`));
    }
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      if (!validFormats.includes(file.type)) {
        errors.push(`${file.name}: Зөвхөн JPG, PNG, WEBP зураг оруулна уу`);
        continue;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: Зургийн хэмжээ 5MB-аас бага байх ёстой`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of validFiles) {
        const variants = await createImageVariants(file);
        const [r800, r400, r150] = await Promise.all([
          UploadFile({ file: variants.w800 }),
          UploadFile({ file: variants.w400 }),
          UploadFile({ file: variants.w150 }),
        ]);
        setImages(prev => [...prev, { w800: r800.file_url, w400: r400.file_url, w150: r150.file_url }]);
      }
    } catch (error) {
      alert('Зураг upload хийхэд алдаа гарлаа. Дахин оролдоно уу.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      price: Number(formData.price) || 0,
      images
    };

    if (formData.vehicle_year) submitData.vehicle_year = Number(formData.vehicle_year);
    if (formData.vehicle_mileage) submitData.vehicle_mileage = Number(formData.vehicle_mileage);
    if (formData.realestate_size) submitData.realestate_size = Number(formData.realestate_size);
    if (formData.realestate_rooms) submitData.realestate_rooms = Number(formData.realestate_rooms);
    if (formData.realestate_bathrooms) submitData.realestate_bathrooms = Number(formData.realestate_bathrooms);

    Object.keys(submitData).forEach(key => {
      if ((key.startsWith('vehicle_') || key.startsWith('electronics_') || 
           key.startsWith('realestate_') || key.startsWith('job_')) && !submitData[key]) {
        delete submitData[key];
      }
    });
    
    updateMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Зар олдсонгүй</h2>
          <Link to={createPageUrl('MyListings')}>
            <Button className="bg-amber-500 hover:bg-amber-600">
              Миний зар руу буцах
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is the owner of the listing
  const userEmail = userData?.email || user?.email;
  const isOwner = listing.created_by === userEmail;
  
  if (!user || !userData) {
    redirectToLogin(window.location.href);
    return null;
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Хандах эрхгүй</h2>
          <p className="text-gray-600 mb-4">Та зөвхөн өөрийн зарыг засах боломжтой</p>
          <Link to={createPageUrl(`ListingDetail?id=${listingId}`)}>
            <Button className="bg-amber-500 hover:bg-amber-600">
              Зарын дэлгэрэнгүй руу буцах
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('MyListings')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Зар засах</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <Label className="text-base font-semibold mb-4 block">Зургууд</Label>
            
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={getListingImageUrl(img, 'w400')} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      Гол зураг
                    </span>
                  )}
                </div>
              ))}
              
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Зураг нэмэх</span>
                  </>
                )}
              </label>
            </div>
          </motion.div>

          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div>
              <Label htmlFor="title" className="text-base font-semibold">Гарчиг *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Зарын гарчиг"
                className="mt-2 h-12 rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base font-semibold">Тайлбар</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Дэлгэрэнгүй тайлбар бичнэ үү..."
                className="mt-2 min-h-[120px] rounded-xl"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold">Ангилал *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: '' })}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl">
                      <SelectValue placeholder="Сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryInfo).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.icon} {info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold">Төлөв</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Шинэ</SelectItem>
                      <SelectItem value="like_new">Бараг шинэ</SelectItem>
                      <SelectItem value="used">Хэрэглэсэн</SelectItem>
                      <SelectItem value="for_parts">Сэлбэгт</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {availableSubcategories.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Дэд ангилал</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl">
                      <SelectValue placeholder="Сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map(sub => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </motion.div>

          {/* Category-Specific Fields */}
          {formData.category === 'vehicles' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h3 className="text-base font-semibold text-gray-900">Тээврийн хэрэгслийн мэдээлэл</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Үйлдвэрлэгч</Label>
                  <Input
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                    placeholder="Hyundai, Kia, Toyota..."
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Загвар</Label>
                  <Input
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    placeholder="Sonata, Sportage..."
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Үйлдвэрлэсэн он</Label>
                  <Input
                    type="number"
                    value={formData.vehicle_year}
                    onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                    placeholder="2020"
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Гүйлт (км)</Label>
                  <Input
                    type="number"
                    value={formData.vehicle_mileage}
                    onChange={(e) => setFormData({ ...formData, vehicle_mileage: e.target.value })}
                    placeholder="50000"
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Түлшний төрөл</Label>
                  <Select
                    value={formData.vehicle_fuel_type}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_fuel_type: value })}
                  >
                    <SelectTrigger className="mt-2 h-11 rounded-lg">
                      <SelectValue placeholder="Сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Бензин</SelectItem>
                      <SelectItem value="diesel">Дизель</SelectItem>
                      <SelectItem value="electric">Цахилгаан</SelectItem>
                      <SelectItem value="hybrid">Хайбрид</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Хурдны хайрцаг</Label>
                  <Select
                    value={formData.vehicle_transmission}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_transmission: value })}
                  >
                    <SelectTrigger className="mt-2 h-11 rounded-lg">
                      <SelectValue placeholder="Сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Автомат</SelectItem>
                      <SelectItem value="manual">Механик</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.section>
          )}

          {formData.category === 'electronics' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h3 className="text-base font-semibold text-gray-900">Электроникийн мэдээлэл</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Брэнд</Label>
                  <Input
                    value={formData.electronics_brand}
                    onChange={(e) => setFormData({ ...formData, electronics_brand: e.target.value })}
                    placeholder="Samsung, Apple, LG..."
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Загвар</Label>
                  <Input
                    value={formData.electronics_model}
                    onChange={(e) => setFormData({ ...formData, electronics_model: e.target.value })}
                    placeholder="Galaxy S23, iPhone 14..."
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>
            </motion.section>
          )}

          {formData.category === 'realestate' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h3 className="text-base font-semibold text-gray-900">Үл хөдлөх хөрөнгийн мэдээлэл</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Талбай (㎡)</Label>
                  <Input
                    type="number"
                    value={formData.realestate_size}
                    onChange={(e) => setFormData({ ...formData, realestate_size: e.target.value })}
                    placeholder="85"
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Өрөөний тоо</Label>
                  <Input
                    type="number"
                    value={formData.realestate_rooms}
                    onChange={(e) => setFormData({ ...formData, realestate_rooms: e.target.value })}
                    placeholder="3"
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Угаалгын өрөө</Label>
                  <Input
                    type="number"
                    value={formData.realestate_bathrooms}
                    onChange={(e) => setFormData({ ...formData, realestate_bathrooms: e.target.value })}
                    placeholder="2"
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Давхар</Label>
                  <Input
                    value={formData.realestate_floor}
                    onChange={(e) => setFormData({ ...formData, realestate_floor: e.target.value })}
                    placeholder="5/15"
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>
            </motion.section>
          )}

          {formData.category === 'jobs' && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h3 className="text-base font-semibold text-gray-900">Ажлын мэдээлэл</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Ажлын төрөл</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger className="mt-2 h-11 rounded-lg">
                      <SelectValue placeholder="Сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Бүтэн цагийн</SelectItem>
                      <SelectItem value="part_time">Хагас цагийн</SelectItem>
                      <SelectItem value="contract">Гэрээт</SelectItem>
                      <SelectItem value="freelance">Фрилансер</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Цалин</Label>
                  <Input
                    value={formData.job_salary}
                    onChange={(e) => setFormData({ ...formData, job_salary: e.target.value })}
                    placeholder="협의, 3,000,000원/월..."
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* Price & Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div>
              <Label htmlFor="price" className="text-base font-semibold">Үнэ (₩) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="mt-2 h-12 rounded-xl text-lg"
                required
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-base font-semibold">Үнэ тохирно</Label>
                <p className="text-sm text-gray-500">Үнийн хэлэлцээ хийх боломжтой</p>
              </div>
              <Switch
                checked={formData.is_negotiable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_negotiable: checked })}
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Байршил</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl">
                  <SelectValue placeholder="Сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h3 className="text-base font-semibold text-gray-900">Холбоо барих</h3>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Утасны дугаар *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="010-1234-5678"
                className="mt-2 h-11 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kakao" className="text-sm font-medium">KakaoTalk ID</Label>
                <Input
                  id="kakao"
                  value={formData.kakao_id}
                  onChange={(e) => setFormData({ ...formData, kakao_id: e.target.value })}
                  placeholder="kakaoid"
                  className="mt-2 h-11 rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="wechat" className="text-sm font-medium">WeChat ID</Label>
                <Input
                  id="wechat"
                  value={formData.wechat_id}
                  onChange={(e) => setFormData({ ...formData, wechat_id: e.target.value })}
                  placeholder="wechatid"
                  className="mt-2 h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+82-10-1234-5678"
                  className="mt-2 h-11 rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="facebook" className="text-sm font-medium">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="facebook.com/username"
                  className="mt-2 h-11 rounded-lg"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">* Заавал 1-ээс илүү холбоо барих хэрэгсэл оруулна уу</p>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              disabled={updateMutation.isPending || !formData.title || !formData.category}
              className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Өөрчлөлт хадгалах
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}