import React, { useState } from 'react';
import { Product } from '../../types';
import { PackageIcon } from '../ui/Icons';

interface PosScreenProps {
    products: Product[];
    onCompleteSale: (cart: { productId: string, quantity: number }[]) => void;
}

const PosScreen: React.FC<PosScreenProps> = ({ products, onCompleteSale }) => {
    const [cart, setCart] = useState<Map<string, number>>(new Map());
    const [searchTerm, setSearchTerm] = useState('');

    const addToCart = (productId: string) => {
        const newCart = new Map<string, number>(cart);
        newCart.set(productId, (newCart.get(productId) || 0) + 1);
        setCart(newCart);
    };

    const removeFromCart = (productId: string) => {
        const newCart = new Map<string, number>(cart);
        const currentQty = newCart.get(productId) || 0;
        if (currentQty > 1) {
            newCart.set(productId, currentQty - 1);
        } else {
            newCart.delete(productId);
        }
        setCart(newCart);
    };

    const handleCompleteSale = () => {
        if(cart.size === 0) return;
        const saleData = Array.from(cart.entries()).map(([productId, quantity]) => ({ productId, quantity }));
        onCompleteSale(saleData);
        setCart(new Map());
        alert("تمت عملية البيع بنجاح!");
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const cartItems = Array.from(cart.keys()).map(productId => {
        const product = products.find(p => p.id === productId);
        return { ...product!, quantity: cart.get(productId)! };
    });

    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">المنتجات</h2>
                <input
                    type="text"
                    placeholder="ابحث عن المنتجات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 mb-4 focus:ring-blue-500 focus:border-blue-500"
                    disabled={products.length === 0}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-250px)]">
                    {products.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                            <PackageIcon className="w-12 h-12 mb-4" />
                            <p className="font-semibold">لا توجد منتجات لإضافتها.</p>
                            <p className="text-sm">الرجاء إضافة المنتجات في صفحة 'المنتجات' أولاً.</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div key={product.id} onClick={() => addToCart(product.id)} className="bg-gray-700 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-600 transition">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-24 object-cover rounded-md mb-2"/>
                                <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">${product.price.toFixed(2)}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4">السلة</h2>
                <div className="flex-grow overflow-y-auto">
                    {cartItems.length === 0 ? (
                         <p className="text-gray-400">السلة فارغة</p>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center mb-3 text-white">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-400">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-gray-600 rounded-full">-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => addToCart(item.id)} className="w-6 h-6 bg-gray-600 rounded-full">+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between text-white text-xl font-bold">
                        <span>الإجمالي</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handleCompleteSale} 
                        disabled={cart.size === 0}
                        className="w-full mt-4 p-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 disabled:bg-gray-500 transition"
                    >
                        إتمام البيع
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosScreen;