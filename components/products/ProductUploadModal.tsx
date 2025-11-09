
import React, { useState, useEffect, useRef } from 'react';

// Forward declaration for XLSX
declare var XLSX: any;

interface ProductUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (products: { id: string, name: string, price: number, discount?: number, sales?: number, stock?: number, discountExpiration?: string }[]) => void;
}

const ProductUploadModal: React.FC<ProductUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const isMounted = useRef(false); // Add mounted ref

    useEffect(() => {
        isMounted.current = true; // Component is mounted
        return () => {
            isMounted.current = false; // Component is unmounted
        };
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (isMounted.current) { // Check if mounted before updating state
                setFileName(file.name);
                setIsProcessing(true);
                setError('');
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!isMounted.current) return; // Crucial check to prevent updates on unmounted component
                try {
                    if (typeof XLSX === 'undefined') {
                        throw new Error("مكتبة Excel (XLSX) فشلت في التحميل. يرجى التحقق من اتصالك بالإنترنت.");
                    }

                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    const productsData: { id: string, name: string, price: number, discount?: number, sales?: number, stock?: number, discountExpiration?: string }[] = json.map((row: any) => ({
                        id: String(row.product_id),
                        name: String(row.name),
                        price: Number(row.price),
                        discount: row.discount ? Number(row.discount) : undefined,
                        sales: row.sales ? Number(row.sales) : undefined,
                        stock: row.stock ? Number(row.stock) : undefined,
                        discountExpiration: row.discount_expiration ? String(row.discount_expiration) : undefined,
                    })).filter(p => p.id && p.name && !isNaN(p.price) && p.price >= 0);

                    if (productsData.length === 0) {
                        throw new Error("لم يتم العثور على منتجات صالحة في الملف.");
                    }

                    onUpload(productsData);
                    alert(`تمت معالجة ${productsData.length} منتجًا بنجاح!`);
                    resetState(); // Reset local states AFTER onUpload and alert
                    onClose(); // Then close the modal
                } catch (err: any) {
                    if (isMounted.current) { // Check if mounted before updating state
                        setError(err.message || "فشل في تحليل الملف. تأكد من أنه يحتوي على الأعمدة المطلوبة.");
                        console.error(err);
                        setIsProcessing(false); // Ensure processing state is cleared on error
                    }
                }
            };
            reader.onerror = (e) => {
                if (isMounted.current) { // Check if mounted before updating state
                    setError("حدث خطأ أثناء قراءة الملف.");
                    setIsProcessing(false);
                    console.error("File reader error:", e);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };
    
    const resetState = () => {
        if (isMounted.current) { // Check if mounted before resetting state
            setFileName('');
            setIsProcessing(false);
            setError('');
        }
    }

    const handleClose = () => {
        resetState();
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-white">استيراد المنتجات من ملف Excel</h2>
                <p className="text-gray-400 mb-6">
                    ارفع ملف Excel أو CSV. الأعمدة الإلزامية: 
                    <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">product_id</code>, 
                    <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">name</code>, 
                    <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">price</code>.
                    <br/>
                    الأعمدة الاختيارية: <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">discount</code>, <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">sales</code>, <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">stock</code>, <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">discount_expiration</code>.
                    <br/>
                    إذا كان <code className="bg-gray-700 text-yellow-300 rounded px-1 mx-1">product_id</code> موجودًا بالفعل، سيتم تحديث بيانات المنتج.
                </p>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-10 text-center">
                    <input type="file" id="product-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                    <label htmlFor="product-upload" className="cursor-pointer text-blue-400 hover:text-blue-500 font-semibold">
                        {isProcessing ? 'جاري المعالجة...' : (fileName || 'اختر ملفًا للرفع')}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">XLSX, XLS, أو CSV</p>
                </div>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                <div className="mt-8 flex justify-end">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">إغلاق</button>
                </div>
            </div>
        </div>
    );
};

export default ProductUploadModal;