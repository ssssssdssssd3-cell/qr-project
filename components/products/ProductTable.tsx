import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductStatus, Page } from '../../types';
import ProductStatusBadge from './ProductStatusBadge';
import { WarningIcon, PackageIcon } from '../ui/Icons';

// Forward declaration for QRCode
declare var QRCode: any;
declare var JSZip: any;

interface ProductWithStatus extends Product {
    status: ProductStatus;
}

interface ProductTableProps {
    products: ProductWithStatus[];
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    onScan: (productId: string) => void;
    onBulkScan: (productIds: string[]) => void;
    onNavigate: (page: Page, payload?: any) => void;
    onRefresh: () => void;
    onDecrementStock: (productId: string, quantity?: number) => void; // New prop for stock decrement
}

// Helper hook to get the previous value of a prop or state.
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}


const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete, onScan, onBulkScan, onNavigate, onRefresh, onDecrementStock }) => {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<ProductWithStatus | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    // FIX: Corrected useState initialization for selectedProducts to use a function initializer.
    // This ensures the Set is created only once on initial render, preventing potential React re-initialization issues.
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(() => new Set<string>());
    const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set());
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    const prevProducts = usePrevious(products);

    // Ref to track if the component is mounted
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true; // Component is mounted
        return () => {
            isMounted.current = false; // Component is unmounted
        };
    }, []); // Empty dependency array means this runs once on mount and once on unmount


    const qrCodeProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;
    
    const filteredProducts = products.filter((product: ProductWithStatus) => {
        const term = searchTerm.toLowerCase();
        const lastScannedText = product.lastScanned ? new Date(product.lastScanned).toLocaleString('ar-AE').toLowerCase() : '';
        const discountText = product.discount ? `${product.discount}%` : '';
        return (
            product.name.toLowerCase().includes(term) ||
            product.price.toString().includes(term) ||
            product.status.toLowerCase().includes(term) ||
            discountText.includes(term) ||
            lastScannedText.includes(term)
        );
    });

    const generateProductUrl = (productId: string): string => {
        // Use hash-based routing, which is the standard and most reliable way to handle
        // client-side routing on static hosting environments, preventing 404 errors.
        const baseUrl = window.location.href.split('?')[0].split('#')[0];
        return `${baseUrl}#/product/${productId}`;
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            // No isMounted check needed here, as onRefresh itself (in App.tsx) contains the check
            onRefresh();
        }, 60000); // Refresh every 60 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [onRefresh]);

    useEffect(() => {
        if (!prevProducts || prevProducts.length !== products.length) return;

        const changedProductIds = new Set<string>();
        const prevProductsMap = new Map(prevProducts.map(p => [p.id, p]));

        products.forEach((currentProduct: ProductWithStatus) => {
            const prevProduct = prevProductsMap.get(currentProduct.id);
            // Highlight if status, stock, or discountExpiration changes
            if (prevProduct && (
                // FIX: Add type assertion to ensure `prevProduct` is treated as `ProductWithStatus` for property access.
                (prevProduct as ProductWithStatus).status !== currentProduct.status ||
                (prevProduct as ProductWithStatus).stock !== currentProduct.stock ||
                (prevProduct as ProductWithStatus).discountExpiration !== currentProduct.discountExpiration
            )) {
                changedProductIds.add(currentProduct.id);
            }
        });

        if (changedProductIds.size > 0) {
            if (isMounted.current) { // Check if mounted before initial state update
                setHighlightedRows(changedProductIds);
            }
            const timer = setTimeout(() => {
                if (isMounted.current) { // Only update if component is still mounted
                    setHighlightedRows(new Set());
                }
            }, 3000); // Highlight for 3 seconds

            return () => clearTimeout(timer);
        }
    }, [products, prevProducts]);


    useEffect(() => {
        if (qrCodeProduct && qrCodeRef.current) {
            if (typeof QRCode === 'undefined') {
                alert("مكتبة QR Code فشلت في التحميل. يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.");
                return;
            }
            qrCodeRef.current.innerHTML = '';
            const url = generateProductUrl(qrCodeProduct.id);
            new QRCode(qrCodeRef.current, {
                text: url,
                width: 256,
                height: 256,
                colorDark : "#ffffff",
                colorLight : "#1a202c",
            });
        }
    }, [qrCodeProduct]);

    useEffect(() => {
        const filteredIds = new Set(filteredProducts.map(p => p.id));
        const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id));
        
        if (headerCheckboxRef.current) {
            const someFilteredSelected = filteredProducts.some(p => selectedProducts.has(p.id));
            headerCheckboxRef.current.checked = allFilteredSelected;
            headerCheckboxRef.current.indeterminate = !allFilteredSelected && someFilteredSelected;
        }
    }, [selectedProducts, filteredProducts]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelectedProducts = new Set(selectedProducts);
        const filteredIds = filteredProducts.map(p => p.id);
        if (e.target.checked) {
            filteredIds.forEach(id => newSelectedProducts.add(id));
        } else {
            filteredIds.forEach(id => newSelectedProducts.delete(id));
        }
        setSelectedProducts(newSelectedProducts);
    };

    const handleSelectProduct = (productId: string) => {
        const newSelectedProducts = new Set(selectedProducts);
        if (newSelectedProducts.has(productId)) {
            newSelectedProducts.delete(productId);
        } else {
            newSelectedProducts.add(productId);
        }
        setSelectedProducts(newSelectedProducts);
    };

    const downloadSelectedQrCodes = async () => {
        if (selectedProducts.size === 0) return;

        if (typeof JSZip === 'undefined' || typeof QRCode === 'undefined') {
            alert("فشلت إحدى المكتبات المطلوبة (JSZip or QRCode.js) في التحميل. يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.");
            return;
        }
    
        const zip = new JSZip();
        
        // Create a hidden container for all QR codes to avoid re-appending/removing in a loop
        const qrContainer = document.createElement('div');
        qrContainer.style.position = 'absolute';
        qrContainer.style.left = '-9999px'; // Move it off-screen
        document.body.appendChild(qrContainer);
    
        for (const productId of selectedProducts) {
            const product = products.find(p => p.id === productId);
            if (product) {
                const productQrElement = document.createElement('div');
                qrContainer.appendChild(productQrElement);
    
                const url = generateProductUrl(product.id);
                new QRCode(productQrElement, {
                    text: url,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                });
    
                const canvas = productQrElement.querySelector('canvas');
                if(canvas) {
                    const dataUrl = canvas.toDataURL('image/png');
                    const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
                    zip.file(`${product.name.replace(/ /g, '_')}_qr.png`, base64Data, { base64: true });
                }
            }
        }
        
        document.body.removeChild(qrContainer); // Clean up the container
    
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "qr_codes.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const downloadQrCode = () => {
        if (qrCodeRef.current && qrCodeProduct) {
            const canvas = qrCodeRef.current.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `${qrCodeProduct.name}_qr.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        }
    };

    const printQrCode = () => {
        if (selectedProductId) {
            document.body.classList.add('printing-qr');
            window.print();
            document.body.classList.remove('printing-qr');
        }
    };

    const confirmDelete = (product: ProductWithStatus) => {
        setProductToDelete(product);
    };

    const executeDelete = () => {
        if (productToDelete) {
            onDelete(productToDelete.id);
            setProductToDelete(null);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="ابحث عن المنتجات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 bg-gray-700 border-gray-600 text-white rounded-md p-2 mb-2 md:mb-0 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedProducts.size > 0 && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                         <span className="text-sm text-gray-400">{selectedProducts.size} محدد</span>
                         <button onClick={downloadSelectedQrCodes} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition">تنزيل المحدد (ZIP)</button>
                         <button onClick={() => onBulkScan(Array.from(selectedProducts))} className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition">زيادة مسح المحدد</button>
                    </div>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="p-4">
                                <div className="flex items-center">
                                    <input ref={headerCheckboxRef} id="checkbox-all" type="checkbox" onChange={handleSelectAll} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>
                                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3">صورة</th>
                            <th scope="col" className="px-6 py-3">اسم المنتج</th>
                            <th scope="col" className="px-6 py-3">الحالة</th>
                            <th scope="col" className="px-6 py-3">السعر</th>
                            <th scope="col" className="px-6 py-3">الخصم</th>
                            <th scope="col" className="px-6 py-3">المسحات</th>
                            <th scope="col" className="px-6 py-3">المبيعات</th>
                            <th scope="col" className="px-6 py-3">المخزون</th> {/* New column */}
                            <th scope="col" className="px-6 py-3">انتهاء الخصم</th> {/* New column */}
                            <th scope="col" className="px-6 py-3">آخر مسح</th>
                            <th scope="col" className="px-6 py-3">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="text-center py-16 text-gray-400">
                                    <div className="flex flex-col items-center">
                                        <PackageIcon className="w-16 h-16 text-gray-600 mb-4" />
                                        <h3 className="text-xl font-semibold text-white">لا توجد منتجات حتى الآن</h3>
                                        <p className="mt-2">ابدأ بإضافة منتج جديد أو استيراد قائمة منتجاتك.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map(product => (
                                <tr key={product.id} className={`border-b bg-gray-800 border-gray-700 hover:bg-gray-600 transition-colors duration-300 ${highlightedRows.has(product.id) ? 'bg-blue-900' : ''}`}>
                                    <td className="w-4 p-4">
                                        <div className="flex items-center">
                                            <input id={`checkbox-${product.id}`} type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => handleSelectProduct(product.id)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>
                                            <label htmlFor={`checkbox-${product.id}`} className="sr-only">checkbox</label>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                                    </td>
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        {product.name}
                                    </th>
                                    <td className="px-6 py-4">
                                        <ProductStatusBadge status={product.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        ${product.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.discount ? `${product.discount}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.scans}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.sales}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.stock} {/* New column */}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.discountExpiration ? new Date(product.discountExpiration).toLocaleDateString('ar-AE') : '-'} {/* New column */}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.lastScanned ? new Date(product.lastScanned).toLocaleString('ar-AE') : 'لم يتم مسحه'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <button onClick={() => {
                                                const url = generateProductUrl(product.id);
                                                window.open(url, '_blank');
                                                onScan(product.id);
                                                onDecrementStock(product.id); // Decrement stock on simulate scan
                                            }} className="font-medium text-yellow-400 hover:underline">محاكاة</button>
                                            <button onClick={() => onEdit(product)} className="font-medium text-blue-400 hover:underline">تعديل</button>
                                            <button onClick={() => setSelectedProductId(product.id)} className="font-medium text-green-400 hover:underline">QR</button>
                                            <button onClick={() => confirmDelete(product)} className="font-medium text-red-500 hover:underline">حذف</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedProductId && qrCodeProduct && (
                <div id="qr-modal-backdrop" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div id="qr-modal-content" className="bg-gray-800 rounded-lg p-8 shadow-xl text-center">
                        <div id="printable-qr-area">
                            <h3 className="text-2xl font-bold mb-2 text-white">{qrCodeProduct.name}</h3>
                            <p className="text-gray-400 mb-4">امسح هذا الرمز لعرض صفحة المنتج. السعر يتحدث تلقائيا عند الخصم.</p>
                            <div ref={qrCodeRef} className="p-4 bg-gray-900 inline-block rounded-lg"></div>
                        </div>
                        <div className="mt-6 flex justify-center space-x-4 non-printable">
                            <button onClick={() => setSelectedProductId(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">إغلاق</button>
                            <button onClick={downloadQrCode} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">تنزيل</button>
                            <button onClick={printQrCode} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">طباعة</button>
                        </div>
                    </div>
                </div>
            )}
            
            {productToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-md text-center">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900">
                             <WarningIcon className="h-6 w-6 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold mt-4 text-white">حذف المنتج</h3>
                        <p className="text-gray-400 mt-2">هل أنت متأكد من رغبتك في حذف "{productToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
                        <div className="mt-8 flex justify-center space-x-4">
                            <button onClick={() => setProductToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition w-24">إلغاء</button>
                            <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition w-24">حذف</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ProductTable;