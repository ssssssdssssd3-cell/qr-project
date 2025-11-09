
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { generateDescription } from '../../services/geminiService';
import { SparklesIcon } from '../ui/Icons';

interface AddEditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Omit<Product, 'id' | 'scans' | 'sales' | 'lastScanned'> | Product) => void;
    productToEdit?: Product | null;
}

const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stock, setStock] = useState('');
    const [discountExpiration, setDiscountExpiration] = useState('');

    const isMounted = useRef(false); // Add mounted ref

    useEffect(() => {
        isMounted.current = true; // Component is mounted
        return () => {
            isMounted.current = false; // Component is unmounted
        };
    }, []);

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name);
            setPrice(productToEdit.price.toString());
            setDiscount(productToEdit.discount?.toString() || '');
            setDescription(productToEdit.description);
            setImagePreview(productToEdit.imageUrl);
            setStock(productToEdit.stock?.toString() || '');
            setDiscountExpiration(productToEdit.discountExpiration ? new Date(productToEdit.discountExpiration).toISOString().substring(0, 10) : '');
        } else {
            setName('');
            setPrice('');
            setDiscount('');
            setDescription('');
            setImagePreview(null);
            setStock('');
            setDiscountExpiration('');
        }
    }, [productToEdit, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isMounted.current) { // Check if mounted before updating state
                    setImagePreview(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const productData = {
            name,
            price: parseFloat(price) || 0,
            discount: discount ? parseFloat(discount) : 0,
            description,
            imageUrl: imagePreview || '',
            stock: parseInt(stock) || 0,
            discountExpiration: discountExpiration ? new Date(discountExpiration).toISOString() : undefined,
        };
        if (productToEdit) {
            onSave({ ...productToEdit, ...productData });
        } else {
            onSave(productData as Omit<Product, 'id' | 'scans' | 'sales' | 'lastScanned'>);
        }
        onClose();
    };

    const handleGenerateDescription = async () => {
        if(!name) {
            alert("الرجاء إدخال اسم المنتج أولاً.");
            return;
        }
        if (isMounted.current) { // Check before setting initial state for async op
            setIsGenerating(true);
        }
        try {
            const generatedDesc = await generateDescription(name);
            if (isMounted.current) { // Only update if component is still mounted
                setDescription(generatedDesc);
            }
        } catch (error) {
            console.error(error);
            // alert is a browser API, not a React state update, so no mounted check needed.
            alert("فشل في إنشاء الوصف.");
        } finally {
            if (isMounted.current) { // Only update if component is still mounted
                setIsGenerating(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-white">{productToEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">صورة المنتج</label>
                        <div className="mt-1 flex items-center space-x-4 rtl:space-x-reverse">
                            <span className="inline-block h-24 w-24 rounded-lg overflow-hidden bg-gray-700">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
                                ) : (
                                    <svg className="h-full w-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 20.993V24H0v-2.993A2 2 0 002 18h20a2 2 0 002 2.993zM8 11a4 4 0 110-8 4 4 0 010 8zm8 0a4 4 0 110-8 4 4 0 010 8z" />
                                    </svg>
                                )}
                            </span>
                             <label htmlFor="file-upload" className="cursor-pointer bg-gray-600 py-2 px-3 border border-gray-500 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700">
                                <span>تغيير</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400">اسم المنتج</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-400">السعر</label>
                            <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div>
                            <label htmlFor="discount" className="block text-sm font-medium text-gray-400">الخصم (%)</label>
                            <input type="number" id="discount" value={discount} onChange={(e) => setDiscount(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-400">المخزون</label>
                        <input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="discountExpiration" className="block text-sm font-medium text-gray-400">تاريخ انتهاء الخصم</label>
                        <input type="date" id="discountExpiration" value={discountExpiration} onChange={(e) => setDiscountExpiration(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-400">الوصف</label>
                        <div className="relative">
                            <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ps-28"/>
                            <button 
                                onClick={handleGenerateDescription} 
                                disabled={isGenerating}
                                className="absolute top-2 start-2 flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:bg-gray-500 transition"
                            >
                                <SparklesIcon className="w-4 h-4 ms-1"/>
                                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء بالذكاء الاصطناعي'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">إلغاء</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">حفظ المنتج</button>
                </div>
            </div>
        </div>
    );
};

export default AddEditProductModal;
    