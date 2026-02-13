/**
 * Model Manager - Download, cache, and manage AI models
 * Handles HuggingFace models, local caching, and memory management
 */
export interface ModelConfig {
    id: string;
    name: string;
    repo: string;
    sizeGB: number;
    parameters: string;
    quantization?: '4bit' | '8bit' | '16bit';
    contextLength: number;
    license: string;
    tags: string[];
}
export interface ModelStatus {
    config: ModelConfig;
    downloaded: boolean;
    path?: string;
    cacheSizeMB: number;
    lastUsed?: Date;
}
export declare const SUPPORTED_MODELS: ModelConfig[];
export declare class ModelManager {
    private cacheDir;
    private models;
    private pythonAvailable;
    private transformersAvailable;
    constructor();
    private ensureCacheDir;
    /**
     * Check if Python and required packages are available
     */
    checkDependencies(): Promise<{
        python: boolean;
        transformers: boolean;
        torch: boolean;
        cuda: boolean;
    }>;
    /**
     * Initialize and scan cache for downloaded models
     */
    initialize(): Promise<void>;
    /**
     * Get available models with download status
     */
    getAvailableModels(): ModelStatus[];
    /**
     * Check if a model is downloaded and ready
     */
    isModelReady(modelId: string): boolean;
    /**
     * Get model path if downloaded
     */
    getModelPath(modelId: string): string | null;
    /**
     * Download a model from HuggingFace
     */
    downloadModel(modelId: string, onProgress?: (percent: number) => void): Promise<ModelStatus>;
    /**
     * Remove a model from cache
     */
    removeModel(modelId: string): Promise<void>;
    /**
     * Get total cache size
     */
    getCacheStats(): {
        totalMB: number;
        modelCount: number;
    };
    /**
     * Clear all cached models
     */
    clearCache(): Promise<void>;
    /**
     * Find best model for available resources
     */
    recommendModel(availableRAM_GB: number, preferFast?: boolean): ModelConfig | null;
    private getDirectorySize;
}
//# sourceMappingURL=manager.d.ts.map