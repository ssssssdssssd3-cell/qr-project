import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import { Page, Product, Notification } from './types';
import { useMockData } from './hooks/useMockData';
import StatCard from './components/dashboard/StatCard';
import SalesChart from './components/dashboard/SalesChart';
import ProductTable from './components/products/ProductTable';
import AddEditProductModal from './components/products/AddEditProductModal';
import ProductUploadModal from './components/products/ProductUploadModal';
import SalesUpload from './components/sales/SalesUpload';
import PosScreen from './components/pos/PosScreen';
import PromotionalImageGenerator from './components/promo/PromotionalImageGenerator';
import NotificationToast from './components/ui/NotificationToast'; // New import
import { DashboardIcon, QrScanIcon, PackageIcon, MenuIcon, ShoppingCartIcon } from './components/ui/Icons';
import PublicProductPage from './components/PublicProductPage';

const LOW_STOCK_THRESHOLD = 10;
const PROMO_EXPIRATION_DAYS = 7; // days

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const { loading, products, addProduct, editProduct, deleteProduct, processSales, incrementScan, bulkIncrementScan, refreshProducts, addProductsBatch, decrementStock } = useMockData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [navigationPayload, setNavigationPayload] = useState<any>(null);
    const [publicProductId, setPublicProductId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]); // New state for notifications

    // Ref to track if the component is mounted
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true; // Component is mounted
        return () => {
            isMounted.current = false; // Component is unmounted
        };
    }, []); // Empty dependency array means this runs once on mount and once on unmount


    useEffect(() => {
        // This effect handles client-side routing based on the URL hash.
        // This is the most robust method for single-page apps on static hosting,
        // as it prevents the server from trying to interpret the route.
        const handleHashChange = () => {
            const hash = window.location.hash; // e.g., #/product/p1
            const match = hash.match(/^#\/product\/(.+)$/);
            if (match && match[1]) {
                setPublicProductId(match[1]);
            } else {
                setPublicProductId(null);
            }
        };

        // Listen for hash changes (e.g., from browser back/forward buttons)
        window.addEventListener('hashchange', handleHashChange);
        
        // Initial check when the component mounts
        handleHashChange();

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    // Helper to add a notification if not already present for the same product and type
    const addUniqueNotification = useCallback((newNotification: Notification) => {
        if (!isMounted.current) return; // Prevent state update if component is unmounted
        setNotifications(prev => {
            if (prev.some(n => n.productId === newNotification.productId && n.type === newNotification.type)) {
                return prev; // Notification already exists for this product and type
            }
            return [...prev, newNotification];
        });
    }, []); // Empty dependency array is fine for setNotifications with functional updates

    const removeNotification = useCallback((id: string) => {
        if (!isMounted.current) return; // Prevent state update if component is unmounted
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []); // Empty dependency array is fine for setNotifications with functional updates

    const checkNotifications = useCallback(() => {
        const now = new Date();
        products.forEach(product => {
            // Low Stock Notification
            if (product.stock <= LOW_STOCK_THRESHOLD) {
                addUniqueNotification({
                    id: `low-stock-${product.id}`,
                    type: 'low_stock',
                    message: `⚠️ مخزون منخفض لـ ${product.name}! (${product.stock} وحدات متبقية)`,
                    productId: product.id,
                    timestamp: now.toISOString(),
                });
            } else {
                 // Remove notification if stock is no longer low
                if (isMounted.current) { // Prevent state update if component is unmounted
                    setNotifications(prev => prev.filter(n => !(n.productId === product.id && n.type === 'low_stock')));
                }
            }

            // Expiring Promotion Notification
            if (product.discount && product.discount > 0 && product.discountExpiration) {
                const expirationDate = new Date(product.discountExpiration);
                const diffTime = expirationDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0 && diffDays <= PROMO_EXPIRATION_DAYS) {
                    addUniqueNotification({
                        id: `expiring-promo-${product.id}`,
                        type: 'expiring_promo',
                        message: `⏳ عرض ${product.name} ينتهي خلال ${diffDays} أيام!`,
                        productId: product.id,
                        timestamp: now.toISOString(),
                    });
                } else {
                     // Remove notification if promo is no longer expiring or has passed
                    if (isMounted.current) { // Prevent state update if component is unmounted
                        setNotifications(prev => prev.filter(n => !(n.productId === product.id && n.type === 'expiring_promo')));
                    }
                }
            } else {
                 // Remove notification if discount or expiration is removed
                if (isMounted.current) { // Prevent state update if component is unmounted
                    setNotifications(prev => prev.filter(n => !(n.productId === product.id && n.type === 'expiring_promo')));
                }
            }
        });
    }, [products, addUniqueNotification]); // isMounted.current is a ref, so it doesn't need to be in dependencies

    useEffect(() => {
        checkNotifications();
        const intervalId = setInterval(checkNotifications, 60000); // Check every minute
        return () => clearInterval(intervalId);
    }, [checkNotifications]); // Run once on mount and then periodically

    const handleNavigation = (page: Page, payload: any = null) => {
        setNavigationPayload(payload);
        setActivePage(page);
    };

    const handleEditClick = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleSaveProduct = (productData: Omit<Product, 'id' | 'scans' | 'sales' | 'lastScanned'> | Product) => {
        let success = false;
        if ('id' in productData) {
            success = editProduct(productData as Product);
        } else {
            success = addProduct(productData as Omit<Product, 'id' | 'scans' | 'sales' | 'lastScanned'>);
        }

        if (!success) {
            alert('فشل حفظ المنتج. قد تكون مساحة التخزين ممتلئة.');
        }
    };
    
    const handleUploadProducts = (uploadedProducts: { id: string, name: string, price: number, discount?: number, sales?: number, stock?: number, discountExpiration?: string }[]) => {
        const success = addProductsBatch(uploadedProducts);
        if (!success) {
            alert('فشل في حفظ المنتجات. قد تكون مساحة التخزين ممتلئة.');
        }
    };

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-10">جاري تحميل البيانات...</div>;
        }

        switch (activePage) {
            case 'dashboard':
                if (products.length === 0) {
                    return (
                        <div className="text-center bg-gray-800 p-10 rounded-lg shadow-lg flex flex-col items-center">
                            <h2 className="text-3xl font-bold text-white mb-4">أهلاً بك في سكان برايس+</h2>
                            <p className="text-gray-400 max-w-lg mb-8">
                                يبدو أن هذه هي المرة الأولى لك هنا. ابدأ بإضافة منتجاتك لإدارة المخزون، وتتبع المسحات، وإنشاء مواد ترويجية مذهلة.
                            </p>
                            <button 
                                onClick={() => handleNavigation('products')} 
                                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition flex items-center space-x-2 rtl:space-x-reverse"
                            >
                                <PackageIcon className="w-5 h-5" />
                                <span>اذهب إلى صفحة المنتجات</span>
                            </button>
                        </div>
                    );
                }
                const totalScans = products.reduce((sum, p) => sum + p.scans, 0);
                const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard title="إجمالي المسحات" value={totalScans.toLocaleString()} icon={<QrScanIcon className="w-6 h-6 text-blue-400" />} change="+12% هذا الأسبوع" />
                            <StatCard title="إجمالي المبيعات" value={totalSales.toLocaleString()} icon={<ShoppingCartIcon className="w-6 h-6 text-green-400" />} change="+8% هذا الأسبوع" />
                            <StatCard title="المنتجات النشطة" value={products.length.toString()} icon={<PackageIcon className="w-6 h-6 text-yellow-400" />} />
                        </div>
                        <SalesChart products={products} />
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-6">
                         <div className="flex justify-end space-x-4 rtl:space-x-reverse">
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">استيراد المنتجات</button>
                            <button onClick={handleAddClick} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">إضافة منتج جديد</button>
                        </div>
                        <ProductTable 
                            products={products} 
                            onEdit={handleEditClick} 
                            onDelete={deleteProduct} 
                            onScan={incrementScan} 
                            onBulkScan={bulkIncrementScan}
                            onNavigate={handleNavigation}
                            onRefresh={refreshProducts}
                            onDecrementStock={decrementStock} // Pass decrementStock to ProductTable
                        />
                    </div>
                );
            case 'sales':
                return <SalesUpload onSalesProcess={processSales} />;
            case 'pos':
                return <PosScreen products={products} onCompleteSale={processSales} />;
            case 'promo':
                return <PromotionalImageGenerator products={products} initialProductId={navigationPayload} />;
            default:
                return <div>الصفحة غير موجودة</div>;
        }
    };
    
    const pageTitles: Record<Page, string> = {
        dashboard: 'لوحة التحكم',
        products: 'إدارة المنتجات',
        sales: 'رفع بيانات المبيعات',
        pos: 'نقطة البيع (POS)',
        promo: 'منشئ الصور الترويجية',
    };

    if (publicProductId) {
        if (loading) {
            return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">جاري تحميل المنتج...</div>;
        }
        return <PublicProductPage productId={publicProductId} products={products} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar activePage={activePage} setActivePage={handleNavigation} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className="flex-1 flex flex-col overflow-hidden">
                 <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button className="md:hidden me-4" onClick={() => setIsSidebarOpen(true)}>
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-white">{pageTitles[activePage]}</h1>
                    </div>
                    <button
                        onClick={() => handleNavigation('dashboard')}
                        className="flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                        aria-label="الذهاب إلى لوحة التحكم"
                    >
                        <DashboardIcon className="w-5 h-5" />
                        <span className="hidden sm:inline sm:ms-2">الرئيسية</span>
                    </button>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                   {renderContent()}
                </div>
            </main>
            <AddEditProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProduct}
                productToEdit={productToEdit}
            />
            <ProductUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUploadProducts}
            />
            {/* Notification Toasts Container */}
            <div className="fixed top-4 end-4 z-50 w-full max-w-sm">
                {notifications.map(n => (
                    <NotificationToast key={n.id} notification={n} onDismiss={removeNotification} />
                ))}
            </div>
        </div>
    );
};

export default App;