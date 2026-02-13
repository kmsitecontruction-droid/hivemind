/**
 * HIVEMIND CLI - Model Management
 * Download, list, and manage AI models
 */
export interface ModelInfo {
    id: string;
    name: string;
    size: string;
    params: string;
    context: string;
    status: 'available' | 'downloaded' | 'downloading';
    cacheSize?: string;
}
export declare const SUPPORTED_MODELS: {
    id: string;
    name: string;
    repo: string;
    sizeGB: number;
    parameters: string;
    contextLength: number;
}[];
export declare class ModelManagerCLI {
    private cacheDir;
    constructor();
    /**
     * Show all available models
     */
    listModels(): Promise<void>;
    /**
     * Get list of downloaded models
     */
    private getDownloadedModels;
    /**
     * Interactive model selection and download
     */
    interactiveDownload(): Promise<void>;
    /**
     * Download a specific model using Python/HuggingFace
     */
    downloadModel(modelId: string): Promise<boolean>;
    /**
     * Check Python dependencies
     */
    private checkDependencies;
    /**
     * Check installed models
     */
    checkInstalled(): Promise<void>;
    /**
     * Remove a downloaded model
     */
    removeModel(modelId: string): Promise<boolean>;
    /**
     * Run a test inference
     */
    testInference(modelId?: string): Promise<void>;
}
//# sourceMappingURL=models.d.ts.map