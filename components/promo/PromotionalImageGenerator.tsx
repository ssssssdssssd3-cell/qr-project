import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { SparklesIcon } from '../ui/Icons';

interface PromotionalImageGeneratorProps {
    products: Product[];
    initialProductId?: string | null;
}

const PromotionalImageGenerator: React.FC<PromotionalImageGeneratorProps> = ({ products, initialProductId }) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [callToAction, setCallToAction] = useState('اكتشف الآن!');
    const [template, setTemplate] = useState('modern');
    const [accentColor, setAccentColor] = useState('#48BB78'); // Green
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isAnimatingDownload, setIsAnimatingDownload] = useState(false); // New state for animation
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (initialProductId) {
            const product = products.find(p => p.id === initialProductId);
            if (product) {
                setSelectedProduct(product);
            }
        } else if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0]);
        }
    }, [initialProductId, products]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !selectedProduct) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width; // 1080
        const H = canvas.height; // 1080

        // Background
        ctx.fillStyle = '#1A202C'; // bg-gray-900
        ctx.fillRect(0, 0, W, H);
        
        const productImage = new Image();
        productImage.crossOrigin = "anonymous"; // Handle CORS for picsum photos or other origins
        productImage.src = selectedProduct.imageUrl;
        
        productImage.onload = () => {
             // Redraw background in case image loads slow
            ctx.fillStyle = '#1A202C';
            ctx.fillRect(0, 0, W, H);
            if (template === 'modern') {
                drawModernTemplate(ctx, W, H, productImage);
            } else if (template === 'classic') {
                drawClassicTemplate(ctx, W, H, productImage);
            }
        };
        
        productImage.onerror = () => {
            ctx.fillStyle = '#1A202C';
            ctx.fillRect(0, 0, W, H);
             // Draw placeholder if image fails
            ctx.fillStyle = '#2D3748'; // bg-gray-700
            ctx.fillRect(W * 0.1, H * 0.1, W * 0.8, H * 0.4);
            ctx.fillStyle = 'white';
            ctx.font = '40px Tajawal';
            ctx.textAlign = 'center';
            ctx.fillText('Image not found', W / 2, H * 0.35);
             if (template === 'modern') drawModernTemplate(ctx, W, H, null);
             if (template === 'classic') drawClassicTemplate(ctx, W, H, null);
        }
    };
    
    useEffect(() => {
        if (selectedProduct && canvasRef.current) {
            drawCanvas();
        }
    }, [selectedProduct, callToAction, template, accentColor]);

    const drawModernTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number, img: HTMLImageElement | null) => {
        if(!selectedProduct) return;
        // Accent shape
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(W, H * 0.7);
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // Product Image (cropped circle)
        if (img) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(W / 2, H * 0.4, W * 0.25, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            const aspectRatio = img.width / img.height;
            let drawWidth = W * 0.5, drawHeight = W * 0.5;
            if(aspectRatio > 1) { // landscape
                drawHeight = drawWidth / aspectRatio;
            } else { // portrait
                drawWidth = drawHeight * aspectRatio;
            }
            ctx.drawImage(img, W/2 - drawWidth/2, H*0.4 - drawHeight/2, drawWidth, drawHeight);
            ctx.restore();
        }

        // Product Name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px Tajawal';
        ctx.textAlign = 'center';
        ctx.fillText(selectedProduct.name, W / 2, H * 0.75, W * 0.9);

        // Price
        ctx.font = '60px Tajawal';
        if (selectedProduct.discount && selectedProduct.discount > 0) {
            const finalPrice = (selectedProduct.price * (1 - selectedProduct.discount / 100)).toFixed(2);
            ctx.fillStyle = 'white';
            ctx.fillText(`$${finalPrice}`, W / 2, H * 0.85);

            ctx.font = '40px Tajawal';
            ctx.fillStyle = '#A0AEC0'; // gray-400
            const originalPriceText = `$${selectedProduct.price.toFixed(2)}`;
            const textWidth = ctx.measureText(originalPriceText).width;
            ctx.fillText(originalPriceText, W / 2, H * 0.91);
            ctx.strokeStyle = '#A0AEC0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(W / 2 - textWidth / 2, H * 0.90);
            ctx.lineTo(W / 2 + textWidth / 2, H * 0.90);
            ctx.stroke();

        } else {
             ctx.fillStyle = 'white';
             ctx.fillText(`$${selectedProduct.price.toFixed(2)}`, W / 2, H * 0.85);
        }

        // CTA
        ctx.fillStyle = '#1A202C'; // bg-gray-900
        ctx.font = 'bold 48px Tajawal';
        ctx.fillText(callToAction, W / 2, H * 0.95, W * 0.8);
    };
    
    const drawClassicTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number, img: HTMLImageElement | null) => {
        if(!selectedProduct) return;
        // Image takes top half
        if(img) {
             ctx.drawImage(img, 0, 0, W, H / 2);
        }
       
        // Info box
        ctx.fillStyle = '#2D3748'; // bg-gray-700
        ctx.fillRect(0, H/2, W, H/2);
        
        // Product Name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Tajawal';
        ctx.textAlign = 'center';
        ctx.fillText(selectedProduct.name, W / 2, H * 0.65, W * 0.9);

        // Price
        ctx.font = 'bold 96px Tajawal';
        ctx.fillStyle = accentColor;
        if (selectedProduct.discount && selectedProduct.discount > 0) {
            const finalPrice = (selectedProduct.price * (1 - selectedProduct.discount / 100)).toFixed(2);
            ctx.fillText(`$${finalPrice}`, W / 2, H * 0.80);

             ctx.font = '50px Tajawal';
             ctx.fillStyle = '#A0AEC0'; // gray-400
             const originalPriceText = `$${selectedProduct.price.toFixed(2)}`;
             const textWidth = ctx.measureText(originalPriceText).width;
             ctx.fillText(originalPriceText, W/2, H * 0.88);
             ctx.strokeStyle = '#A0AEC0';
             ctx.lineWidth = 4;
             ctx.beginPath();
             ctx.moveTo(W/2 - textWidth/2, H * 0.86);
             ctx.lineTo(W/2 + textWidth/2, H * 0.86);
             ctx.stroke();

        } else {
             ctx.fillText(`$${selectedProduct.price.toFixed(2)}`, W / 2, H * 0.80);
        }

        // CTA Button
        ctx.fillStyle = accentColor;
        // A simple rect as roundRect is not universally supported
        ctx.fillRect(W * 0.2, H * 0.9 - (H * 0.04), W * 0.6, H * 0.08);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Tajawal';
        ctx.fillText(callToAction, W / 2, H * 0.905);
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas && selectedProduct) {
            if (isMounted.current) {
                setIsAnimatingDownload(true); // Start animation
            }
            const link = document.createElement('a');
            link.download = `${selectedProduct.name.replace(/ /g, '_')}_promo.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Reset animation state after a short delay
            setTimeout(() => {
                if (isMounted.current) {
                    setIsAnimatingDownload(false);
                }
            }, 500); // Duration of the animation
        }
    };

    if (products.length === 0) {
        return (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-7xl mx-auto text-center flex flex-col items-center justify-center" style={{minHeight: '50vh'}}>
                <SparklesIcon className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">أضف منتجات أولاً</h2>
                <p className="text-gray-400 max-w-md">
                    لإنشاء صور ترويجية، يجب عليك إضافة بعض المنتجات إلى نظامك أولاً.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <SparklesIcon className="w-8 h-8 me-3 text-yellow-400" />
                منشئ الصور الترويجية
            </h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Controls Column */}
                <div className="md:col-span-1 space-y-6">
                    {/* Product Selector */}
                    <div>
                        <label htmlFor="product-select" className="block text-sm font-medium text-gray-300 mb-2">1. اختر منتجًا</label>
                        <select
                            id="product-select"
                            value={selectedProduct?.id || ''}
                            onChange={(e) => {
                                const product = products.find(p => p.id === e.target.value);
                                setSelectedProduct(product || null);
                            }}
                            className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {selectedProduct && (
                            <div className="mt-4 bg-gray-700 rounded-lg overflow-hidden">
                                <img src={selectedProduct.imageUrl} alt="Product preview" className="w-full h-auto object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Template Selector */}
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">2. اختر تصميمًا</label>
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => setTemplate('modern')} className={`px-4 py-2 rounded-md text-sm font-medium ${template === 'modern' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>حديث</button>
                             <button onClick={() => setTemplate('classic')} className={`px-4 py-2 rounded-md text-sm font-medium ${template === 'classic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>كلاسيكي</button>
                        </div>
                    </div>

                    {/* CTA Input */}
                    <div>
                        <label htmlFor="cta-input" className="block text-sm font-medium text-gray-300 mb-2">3. نص الحث على الشراء</label>
                        <input
                            id="cta-input"
                            type="text"
                            value={callToAction}
                            onChange={e => setCallToAction(e.target.value)}
                            className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="مثال: اشتر الآن!"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                         <label htmlFor="color-picker" className="block text-sm font-medium text-gray-300 mb-2">4. اختر لونًا مميزًا</label>
                         <input
                            id="color-picker"
                            type="color"
                            value={accentColor}
                            onChange={e => setAccentColor(e.target.value)}
                            className="w-full h-10 p-1 bg-gray-700 border-gray-600 rounded-md cursor-pointer"
                         />
                    </div>
                </div>

                {/* Preview and Download Column */}
                <div className="md:col-span-2 flex flex-col items-center">
                    <canvas 
                        ref={canvasRef} 
                        width={1080} 
                        height={1080} 
                        className={`w-full max-w-lg h-auto rounded-lg bg-gray-900 border border-gray-700 transition-all duration-300 ease-in-out ${isAnimatingDownload ? 'scale-105 shadow-lg shadow-green-500/50' : ''}`}
                    ></canvas>
                    <button
                        onClick={handleDownload}
                        disabled={!selectedProduct}
                        className="mt-6 w-full max-w-lg py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                    >
                        تحميل الصورة
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PromotionalImageGenerator;