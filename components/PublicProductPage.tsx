import React from 'react';
import { Product } from '../types';

interface PublicProductPageProps {
    productId: string;
    products: Product[];
}

const PublicProductPage: React.FC<PublicProductPageProps> = ({ productId, products }) => {
    const product = products.find(p => p.id === productId);

    if (!product) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-center p-4">
                <div>
                    <h1 className="text-4xl font-bold mb-4">لم يتم العثور على المنتج</h1>
                    <p className="text-gray-400">قد يكون رمز QR هذا غير صالح أو أن المنتج لم يعد متاحًا.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen">
            <main className="max-w-2xl mx-auto">
                <div className="bg-gray-800 shadow-xl rounded-b-3xl">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-80 object-cover rounded-b-3xl" />
                </div>

                <div className="p-6 text-white">
                    <h1 className="text-4xl font-bold mb-3">{product.name}</h1>
                    
                    <div className="text-3xl mb-6">
                        {product.discount && product.discount > 0 ? (
                            <div className="flex items-baseline space-x-3 rtl:space-x-reverse">
                                <span className="font-bold text-green-400">${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                                <span className="text-xl text-gray-500 line-through">${product.price.toFixed(2)}</span>
                                <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">{product.discount}% خصم</span>
                            </div>
                        ) : (
                            <span className="font-bold text-green-400">${product.price.toFixed(2)}</span>
                        )}
                    </div>

                    <p className="text-gray-300 leading-relaxed text-lg mb-8">{product.description}</p>
                    
                    <button className="w-full py-4 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                        أضف إلى السلة
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PublicProductPage;
