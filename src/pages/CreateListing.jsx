import React, { useState } from 'react';
import { redirectToLogin } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '@/services/storageService';
import { createListing, filterListings } from '@/services/listingService';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, X, Loader2, Check, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryInfo } from '@/components/listings/CategoryCard';
import { subcategoryConfig } from '@/components/listings/subcategoryConfig';
import { compressImage } from '@/components/utils/imageCompressor';
import { LIMITS, canCreateListing } from '@/utils/limits';

const locations = [
  'Seoul',
  'Busan',
  'Incheon',
  'Daegu',
  'Gyeonggi-do',
  'Gyeongsangnam-do'
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user: firebaseUser, user, userData, loading: authLoading, isAuthenticated } = useAuth();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
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

  const availableSubcategories = formData.category ? subcategoryConfig[formData.category] || [] : [];

  // Check authentication and auto-fill user data
  React.useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return; // Still loading, wait...
    }
    
    // Check if user is authenticated
    // Note: userData might be null temporarily if Firestore is slow, but user should exist if authenticated
    if (!isAuthenticated || !user) {
      // Not authenticated - redirect to login
      redirectToLogin(window.location.href);
      return;
    }

    // If authenticated but userData not loaded yet, wait a bit more
    // (Firestore might be slow, but user is authenticated so we can show the form)
    if (!userData) {
      // Wait a bit more for userData to load from Firestore
      const timeout = setTimeout(() => {
        if (!userData) {
          // Still no userData after waiting - redirect to login
          redirectToLogin(window.location.href);
        }
      }, 2000); // Wait 2 seconds for Firestore to respond
      
      return () => clearTimeout(timeout);
    }

    // Auto-fill contact info from user profile
    if (userData.phone || userData.kakao_id || userData.wechat_id || userData.whatsapp || userData.facebook) {
      setFormData(prev => ({
        ...prev,
        phone: userData.phone || prev.phone,
        kakao_id: userData.kakao_id || prev.kakao_id,
        wechat_id: userData.wechat_id || prev.wechat_id,
        whatsapp: userData.whatsapp || prev.whatsapp,
        facebook: userData.facebook || prev.facebook
      }));
    }
  }, [authLoading, isAuthenticated, user, userData]);

  // Check user's listing count
  const { data: userListings = [] } = useQuery({
    queryKey: ['userListingsCount', userEmail],
    queryFn: () => filterListings({ created_by: userEmail }, '-created_date', 50),
    enabled: !!userEmail
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating listing with data:', data);
      const result = await createListing(data);
      console.log('Listing created successfully:', result);
      return result;
    },
    onSuccess: (result) => {
      if (result && result.id) {
        console.log('Navigating to listing detail:', result.id);
        navigate(createPageUrl(`ListingDetail?id=${result.id}`));
      } else {
        console.error('Listing created but no ID returned:', result);
        alert('Зар үүсгэгдсэн боловч алдаа гарлаа. Дахин оролдоно уу.');
      }
    },
    onError: (error) => {
      console.error('Error creating listing:', error);
      const errorMessage = error?.message || error?.code || 'Тодорхойгүй алдаа';
      alert(`Зар үүсгэхэд алдаа гарлаа: ${errorMessage}`);
    }
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Check image count limit
    const MAX_IMAGES = 10;
    if (images.length >= MAX_IMAGES) {
      alert(`Хамгийн ихдээ ${MAX_IMAGES} зураг оруулж болно.`);
      return;
    }
    
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles = [];
    const errors = [];
    
    // Calculate how many images can still be added
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      alert(`Зөвхөн ${remainingSlots} зураг нэмж болно (нийт ${MAX_IMAGES} хүртэл).`);
    }
    
    for (const file of filesToProcess) {
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
        // Compress image before upload
        const compressedFile = await compressImage(file);
        // Use Firebase Storage instead of base44
        const result = await uploadFile(compressedFile, 'listings');
        const fileUrl = result?.file_url || result; // Handle both object and string return
        setImages(prev => [...prev, fileUrl]);
      }
    } catch (error) {
      const errorMessage = error.message || 'Зураг upload хийхэд алдаа гарлаа. Дахин оролдоно уу.';
      alert(errorMessage);
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
    
    // Check authentication before submitting
    if (!isAuthenticated || !userData) {
      alert('Зар оруулахын тулд нэвтэрнэ үү.');
      redirectToLogin(window.location.href);
      return;
    }
    
    const userEmail = userData?.email || firebaseUser?.email;
    if (!userEmail) {
      alert('Хэрэглэгчийн мэдээлэл олдсонгүй. Дахин нэвтэрнэ үү.');
      redirectToLogin(window.location.href);
      return;
    }
    
    // Check listing limit
    if (userListings.length >= LIMITS.MAX_LISTINGS_PER_USER) {
      alert(`Та хамгийн ихдээ ${LIMITS.MAX_LISTINGS_PER_USER} зар оруулж болно. Зарим заруудыг устгаад дахин оролдоно уу.`);
      return;
    }
    
    // Validation: Required fields
    const errors = [];
    
    if (!formData.title || formData.title.trim() === '') {
      errors.push('Гарчиг заавал бөглөнө үү.');
    }
    
    if (!formData.category || formData.category === '') {
      errors.push('Ангилал заавал сонгоно уу.');
    }
    
    if (!formData.price || formData.price === '' || formData.price === '0') {
      if (!formData.is_negotiable) {
        errors.push('Үнэ заавал оруулна уу эсвэл "Үнэ тохирно" гэж сонгоно уу.');
      }
    } else {
      // Validate price is a positive number
      const priceNum = Number(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push('Үнэ зөв тоо байх ёстой.');
      }
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      errors.push('Утасны дугаар заавал оруулна уу.');
    } else {
      // Validate phone format (should be numeric)
      const phoneRegex = /^[\d\s\-\+()]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.push('Утасны дугаар зөв формат байх ёстой.');
      }
    }
    
    // Validate numeric fields if they have values
    const numericFields = [
      { key: 'vehicle_year', label: 'Жилийн утга' },
      { key: 'vehicle_mileage', label: 'Зайлын утга' },
      { key: 'realestate_size', label: 'Талбайн утга' },
      { key: 'realestate_rooms', label: 'Өрөөний тоо' },
      { key: 'realestate_bathrooms', label: 'Угаалгын өрөөний тоо' }
    ];
    
    numericFields.forEach(({ key, label }) => {
      if (formData[key] && formData[key] !== '') {
        const numValue = Number(formData[key]);
        if (isNaN(numValue) || numValue < 0) {
          errors.push(`${label} зөв тоо байх ёстой.`);
        }
      }
    });
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return; // Stop submission
    }
    
    // Check if user is admin - admins' listings should be automatically approved
    const isAdmin = userData?.role === 'admin';
    
    const submitData = {
      ...formData,
      price: formData.is_negotiable && (!formData.price || formData.price === '' || formData.price === '0') 
        ? 0 
        : Number(formData.price) || 0,
      images,
      status: isAdmin ? 'active' : 'pending', // Admins' listings are auto-approved
      views: 0,
      created_by: userEmail
    };

    // Convert numeric fields
    if (formData.vehicle_year && formData.vehicle_year !== '') {
      submitData.vehicle_year = Number(formData.vehicle_year);
    }
    if (formData.vehicle_mileage && formData.vehicle_mileage !== '') {
      submitData.vehicle_mileage = Number(formData.vehicle_mileage);
    }
    if (formData.realestate_size && formData.realestate_size !== '') {
      submitData.realestate_size = Number(formData.realestate_size);
    }
    if (formData.realestate_rooms && formData.realestate_rooms !== '') {
      submitData.realestate_rooms = Number(formData.realestate_rooms);
    }
    if (formData.realestate_bathrooms && formData.realestate_bathrooms !== '') {
      submitData.realestate_bathrooms = Number(formData.realestate_bathrooms);
    }

    // Remove empty category-specific fields
    Object.keys(submitData).forEach(key => {
      if ((key.startsWith('vehicle_') || key.startsWith('electronics_') || 
           key.startsWith('realestate_') || key.startsWith('job_')) && !submitData[key]) {
        delete submitData[key];
      }
    });
    
    createMutation.mutate(submitData);
  };

  const handleNumberInput = (field) => (e) => {
    const value = e.target.value;
    // Allow empty or valid numbers (including decimals if needed)
    if (value === '' || /^\d+\.?\d*$/.test(value)) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handlePriceInput = (e) => {
    const value = e.target.value;
    // Allow empty or valid positive numbers
    if (value === '' || /^\d+$/.test(value)) {
      setFormData({ ...formData, price: value });
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  // Note: Allow rendering if user is authenticated (even if userData is still loading from Firestore)
  if (!isAuthenticated || !user) {
    // Don't render anything - redirect will happen in useEffect
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Шинэ зар нэмэх</h1>
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
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
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
                min="0"
                step="1"
                value={formData.price}
                onChange={handlePriceInput}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                    e.preventDefault();
                  }
                }}
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
                      min="1900"
                      max="2100"
                      step="1"
                      value={formData.vehicle_year}
                      onChange={handleNumberInput('vehicle_year')}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="2020"
                      className="mt-2 h-11 rounded-lg"
                    />
                </div>
                <div>
                  <Label className="text-sm font-medium">Гүйлт (км)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.vehicle_mileage}
                      onChange={handleNumberInput('vehicle_mileage')}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
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
                      min="0"
                      step="0.01"
                      value={formData.realestate_size}
                      onChange={handleNumberInput('realestate_size')}
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="85"
                      className="mt-2 h-11 rounded-lg"
                    />
                </div>
                <div>
                  <Label className="text-sm font-medium">Өрөөний тоо</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.realestate_rooms}
                      onChange={handleNumberInput('realestate_rooms')}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
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
                      min="0"
                      step="1"
                      value={formData.realestate_bathrooms}
                      onChange={handleNumberInput('realestate_bathrooms')}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
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
              disabled={createMutation.isPending || !formData.title || !formData.category || !isAuthenticated}
              className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold disabled:opacity-50"
              onClick={(e) => {
                if (!isAuthenticated || !userData) {
                  e.preventDefault();
                  alert('Зар оруулахын тулд нэвтэрнэ үү.');
                  redirectToLogin(window.location.href);
                }
              }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Нийтэлж байна...
                </>
              ) : !isAuthenticated ? (
                <>
                  Нэвтрэх
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Зар нийтлэх
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}