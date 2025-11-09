import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Corrected import to use the newly created `generateVideo` function.
import { generateVideo } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/fileUtils';
import { UploadIcon } from '../ui/Icons';

// Mock window.aistudio for development
if (typeof window !== 'undefined' && !(window as any).aistudio) {
    (window as any).aistudio = {
        hasSelectedApiKey: () => Promise.resolve(!!process.env.API_KEY),
        openSelectKey: () => {
            console.log("Mock openSelectKey called. Please set API_KEY in your env.");
            return Promise.resolve();
        }
    };
}

const VeoGenerator: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(false);

    const checkApiKey = useCallback(async () => {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (isMounted.current) {
            setApiKeySelected(hasKey);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        checkApiKey();
        return () => {
            isMounted.current = false;
        };
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        await (window as any).aistudio.openSelectKey();
        // Assume success after dialog opens to avoid race conditions
        if (isMounted.current) {
            setApiKeySelected(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (isMounted.current) {
                setImageFile(file);
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isMounted.current) {
                    setImagePreview(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile) {
            if (isMounted.current) setError('الرجاء رفع صورة.');
            return;
        }
        if (!prompt) {
            if (isMounted.current) setError('الرجاء إدخال وصف.');
            return;
        }
        
        if (isMounted.current) {
            setIsLoading(true);
            setError(null);
            setGeneratedVideoUrl(null);
        }

        try {
            const imageBase64 = await fileToBase64(imageFile);
            const videoUrl = await generateVideo(prompt, imageBase64, imageFile.type, aspectRatio);
            if (isMounted.current) {
                setGeneratedVideoUrl(videoUrl);
            }
        } catch (e: any) {
             if (isMounted.current) {
                if (e.message.includes("API key invalid")) {
                    setError("مفتاح API غير صالح. الرجاء إعادة تحديد مفتاح API الخاص بك.");
                    setApiKeySelected(false);
                } else {
                    setError(e.message || 'فشل إنشاء الفيديو. الرجاء المحاولة مرة أخرى.');
                }
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };
    
    if (!apiKeySelected) {
        return (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-white mb-4">مفتاح API مطلوب</h2>
                <p className="text-gray-400 mb-6">لاستخدام ميزة إنشاء الفيديو باستخدام Veo، تحتاج إلى تحديد مفتاح API. سيتم استخدامه لأغراض الفوترة.</p>
                <p className="text-sm text-gray-500 mb-6">لمزيد من المعلومات، راجع <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">وثائق الفوترة</a>.</p>
                <button onClick={handleSelectKey} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                    تحديد مفتاح API
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">إنشاء فيديو بالذكاء الاصطناعي مع Veo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">1. ارفع صورة بداية</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto rounded-md" />
                                    ) : (
                                        <>
                                            <UploadIcon className="mx-auto h-12 w-12 text-gray-500"/>
                                            <div className="flex text-sm text-gray-400">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500 px-2">
                                                    <span>ارفع ملفًا</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                                                </label>
                                                <p className="ps-1">أو اسحب وأفلت</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF حتى 10 ميجابايت</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">2. صف ما يجب أن يحدث</label>
                            <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="مثال: الروبوت يبدأ في التلويح بيده ويبتسم..."></textarea>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300">3. اختر نسبة العرض إلى الارتفاع</label>
                            <div className="mt-2 flex space-x-4">
                                <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded-md text-sm font-medium ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>أفقي (16:9)</button>
                                <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded-md text-sm font-medium ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>عمودي (9:16)</button>
                            </div>
                        </div>

                        <button onClick={handleGenerate} disabled={isLoading || !imageFile || !prompt} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500">
                            {isLoading ? 'جاري إنشاء الفيديو...' : 'إنشاء الفيديو'}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-gray-900 rounded-lg p-4">
                    {isLoading && (
                        <div className="text-center">
                           <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
                           <p className="text-gray-300 mt-4">جاري إنشاء الفيديو، قد يستغرق هذا بضع دقائق...</p>
                           <p className="text-gray-400 text-sm mt-2">لا تتردد في إبقاء هذه النافذة مفتوحة في الخلفية.</p>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="text-center">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={handleGenerate}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                إعادة المحاولة
                            </button>
                        </div>
                    )}
                    {generatedVideoUrl && (
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-auto rounded-lg" />
                    )}
                    {!isLoading && !generatedVideoUrl && !error && <p className="text-gray-500">سيظهر الفيديو الذي تم إنشاؤه هنا</p>}
                </div>
            </div>
        </div>
    );
};

export default VeoGenerator;