import React, { useState, useEffect, useRef } from 'react';

// Forward declaration for XLSX
declare var XLSX: any;

interface SalesUploadProps {
    onSalesProcess: (sales: { productId: string, quantity: number }[]) => void;
}

const SalesUpload: React.FC<SalesUploadProps> = ({ onSalesProcess }) => {
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (isMounted.current) {
                setFileName(file.name);
                setIsProcessing(true);
                setError('');
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!isMounted.current) return;
                try {
                    if (typeof XLSX === 'undefined') {
                        throw new Error("مكتبة Excel (XLSX) فشلت في التحميل. يرجى التحقق من اتصالك بالإنترنت.");
                    }
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    const salesData = json.map((row: any) => ({
                        productId: String(row.product_id),
                        quantity: Number(row.quantity_sold),
                    })).filter(sale => sale.productId && !isNaN(sale.quantity) && sale.quantity > 0);

                    onSalesProcess(salesData);
                    alert(`تمت معالجة ${salesData.length} سجل مبيعات بنجاح!`);

                } catch (err) {
                    if (isMounted.current) {
                        setError((err as Error).message || "فشل في تحليل الملف. تأكد من أنه يحتوي على عمودي 'product_id' و 'quantity_sold'.");
                        console.error(err);
                    }
                } finally {
                    if (isMounted.current) {
                        setIsProcessing(false);
                    }
                }
            };
            reader.onerror = () => {
                if (isMounted.current) {
                    setError("حدث خطأ أثناء قراءة الملف.");
                    setIsProcessing(false);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">رفع بيانات المبيعات</h2>
            <p className="text-gray-400 mb-6">ارفع ملف Excel أو CSV يحتوي على بيانات المبيعات. يجب أن يحتوي الملف على عمودي 'product_id' و 'quantity_sold'.</p>
            
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-10 text-center">
                <input type="file" id="sales-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                <label htmlFor="sales-upload" className="cursor-pointer text-blue-400 hover:text-blue-500 font-semibold">
                    {isProcessing ? 'جاري المعالجة...' : (fileName || 'اختر ملفًا للرفع')}
                </label>
                <p className="text-xs text-gray-500 mt-2">XLSX, XLS, أو CSV حتى 10 ميجابايت</p>
            </div>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>
    );
};

export default SalesUpload;