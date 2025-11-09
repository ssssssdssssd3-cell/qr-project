import { useState, useEffect } from 'react';
import { Product, ProductStatus } from '../types';

const initialProducts: Product[] = [];

const getProductStatus = (product: Product): ProductStatus => {
    const conversionRate = product.sales > 0 ? (product.sales / product.scans) * 100 : 0;
    if (conversionRate > 25 && product.scans > 100) return ProductStatus.Hot;
    if (conversionRate > 10 || product.scans > 150) return ProductStatus.Interesting;
    return ProductStatus.Cold;
};

type UploadedProduct = {
    id: string;
    name: string;
    price: number;
    discount?: number;
    sales?: number;
    stock?: number; // New field
    discountExpiration?: string; // New field
};

export const useMockData = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProductsFromStorage = () => {
         try {
            const storedProducts = localStorage.getItem('scanprice_products');
            if (storedProducts) {
                setProducts(JSON.parse(storedProducts) as Product[]);
            } else {
                setProducts(initialProducts);
                localStorage.setItem('scanprice_products', JSON.stringify(initialProducts));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            setProducts(initialProducts);
        }
    };

    useEffect(() => {
        loadProductsFromStorage();
        setLoading(false);
    }, []);

    const refreshProducts = () => {
        loadProductsFromStorage();
    };

    const updateProducts = (newProducts: Product[]): boolean => {
        try {
            localStorage.setItem('scanprice_products', JSON.stringify(newProducts));
            setProducts(newProducts);
            return true;
        } catch (error) {
            console.error("Failed to save products to localStorage", error);
            return false;
        }
    };
    
    const addProduct = (product: Omit<Product, 'id' | 'scans' | 'sales' | 'lastScanned'>): boolean => {
        const newProduct: Product = {
            ...product,
            id: `p${Date.now()}`,
            scans: 0,
            sales: 0,
            discount: product.discount ?? 0,
            imageUrl: product.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`,
            stock: product.stock ?? 100, // Default stock
            discountExpiration: product.discountExpiration ?? undefined,
        };
        return updateProducts([...products, newProduct]);
    };

    const editProduct = (updatedProduct: Product): boolean => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        return updateProducts(newProducts);
    };

    const deleteProduct = (productId: string): boolean => {
        const newProducts = products.filter(p => p.id !== productId);
        return updateProducts(newProducts);
    };
    
    const incrementScan = (productId: string): boolean => {
        const newProducts = products.map(p => p.id === productId ? { ...p, scans: p.scans + 1, lastScanned: new Date().toISOString() } : p);
        return updateProducts(newProducts);
    };

    const decrementStock = (productId: string, quantity: number = 1): boolean => {
        const newProducts = products.map(p => p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p);
        return updateProducts(newProducts);
    }

    const bulkIncrementScan = (productIds: string[]): boolean => {
        const idSet = new Set(productIds);
        const now = new Date().toISOString();
        const newProducts = products.map(p => idSet.has(p.id) ? { ...p, scans: p.scans + 1, lastScanned: now } : p);
        return updateProducts(newProducts);
    };

    const processSales = (salesData: { productId: string; quantity: number }[]): boolean => {
         const newProducts = [...products];
         salesData.forEach(sale => {
            const productIndex = newProducts.findIndex(p => p.id === sale.productId);
            if (productIndex !== -1) {
                newProducts[productIndex].sales += sale.quantity;
                newProducts[productIndex].stock -= sale.quantity; // Decrement stock
                if (newProducts[productIndex].stock < 0) newProducts[productIndex].stock = 0; // Prevent negative stock
            }
        });
        return updateProducts(newProducts);
    };

    const addProductsBatch = (uploadedProducts: UploadedProduct[]): boolean => {
        // Explicitly type `productMap` to ensure it stores Product objects
        const productMap = new Map<string, Product>(products.map(p => [p.id, p]));

        // FIX: Explicitly type `uploadedProduct` in the `forEach` callback to ensure correct type inference.
        uploadedProducts.forEach((uploadedProduct: UploadedProduct) => {
            const existingProduct = productMap.get(uploadedProduct.id);
            if (existingProduct) {
                // Update existing product by creating a new object and explicitly merging properties.
                // This resolves the "Spread types may only be created from object types" error
                // by avoiding direct spreading of `existingProduct` if TypeScript incorrectly infers it as non-object.
                const updatedProduct: Product = {
                    id: existingProduct.id,
                    name: uploadedProduct.name,
                    price: uploadedProduct.price,
                    description: existingProduct.description,
                    scans: existingProduct.scans,
                    sales: uploadedProduct.sales ?? existingProduct.sales,
                    imageUrl: existingProduct.imageUrl,
                    lastScanned: existingProduct.lastScanned,
                    stock: uploadedProduct.stock ?? existingProduct.stock, // Update stock
                    discount: uploadedProduct.discount ?? existingProduct.discount,
                    discountExpiration: uploadedProduct.discountExpiration ?? existingProduct.discountExpiration, // Update discountExpiration
                };
                productMap.set(uploadedProduct.id, updatedProduct);
            } else {
                // Add new product with default values
                const newProduct: Product = {
                    id: uploadedProduct.id,
                    name: uploadedProduct.name,
                    price: uploadedProduct.price,
                    discount: uploadedProduct.discount ?? 0,
                    description: `وصف المنتج لـ ${uploadedProduct.name}`,
                    scans: 0,
                    sales: uploadedProduct.sales ?? 0,
                    imageUrl: `https://picsum.photos/seed/${uploadedProduct.id}/400/400`,
                    stock: uploadedProduct.stock ?? 100, // Default stock for new products
                    discountExpiration: uploadedProduct.discountExpiration ?? undefined,
                };
                productMap.set(uploadedProduct.id, newProduct);
            }
        });

        // FIX: The type for `newProductsList` is now correctly inferred as `Product[]`
        // due to `productMap` being explicitly typed as `Map<string, Product>`.
        const newProductsList: Product[] = Array.from(productMap.values());
        return updateProducts(newProductsList);
    };


    const productsWithStatus = products.map(p => ({ ...p, status: getProductStatus(p) }));
    
    return { loading, products: productsWithStatus, addProduct, editProduct, deleteProduct, processSales, incrementScan, bulkIncrementScan, refreshProducts, addProductsBatch, decrementStock };
};