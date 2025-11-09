import { GoogleGenAI } from "@google/genai";

const getGenAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateDescription = async (productName: string): Promise<string> => {
    try {
        const ai = getGenAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a short, compelling product description for: "${productName}". Keep it under 30 words.`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating description:", error);
        return "Failed to generate description.";
    }
};

// FIX: Added missing generateVideo function to call the Veo model.
export const generateVideo = async (
    prompt: string,
    imageBase64: string,
    mimeType: string,
    aspectRatio: '16:9' | '9:16'
): Promise<string> => {
    try {
        const ai = getGenAIClient();
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            },
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was provided.");
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set for fetching video.");
        }
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404 && errorText.includes("Requested entity was not found")) {
                 throw new Error("API key invalid: Requested entity was not found.");
            }
            throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error: any) {
        console.error("Error generating video:", error);
        if (error.message.includes("API key not valid") || error.message.includes("API key invalid")) {
            throw new Error("API key invalid. Please select a valid API key.");
        }
        throw error;
    }
};
