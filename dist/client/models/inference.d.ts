/**
 * Inference Engine - Execute real AI model inference
 * Handles text generation, embeddings, and chat completion
 */
export interface InferenceRequest {
    modelId: string;
    prompt: string;
    type: 'text-generation' | 'chat' | 'embedding';
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
}
export interface InferenceResult {
    success: boolean;
    output?: string;
    embedding?: number[];
    tokensGenerated: number;
    tokensPerSecond: number;
    executionTimeMs: number;
    memoryUsedMB: number;
    error?: string;
}
export declare class InferenceEngine {
    private modelManager;
    private activeModels;
    constructor();
    initialize(): Promise<void>;
    /**
     * Run inference on a downloaded model
     */
    runInference(request: InferenceRequest): Promise<InferenceResult>;
    private buildInferenceScript;
    private executePython;
    /**
     * Generate embeddings for text
     */
    generateEmbeddings(text: string, modelId?: string): Promise<number[]>;
    /**
     * Check if a model can be loaded with available RAM
     */
    canLoadModel(modelId: string, availableRAM_GB: number): boolean;
    /**
     * Get model stats
     */
    getStats(): {
        availableModels: number;
        downloadedModels: number;
        cacheSizeMB: number;
        pythonAvailable: boolean;
    };
}
//# sourceMappingURL=inference.d.ts.map