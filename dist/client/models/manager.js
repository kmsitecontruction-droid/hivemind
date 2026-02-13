/**
 * Model Manager - Download, cache, and manage AI models
 * Handles HuggingFace models, local caching, and memory management
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
const execAsync = promisify(exec);
// Pre-configured models optimized for distributed inference
export const SUPPORTED_MODELS = [
    {
        id: 'llama-3.2-1b',
        name: 'Llama 3.2 1B',
        repo: 'unsloth/Llama-3.2-1B-Instruct',
        sizeGB: 2.5,
        parameters: '1B',
        quantization: '4bit',
        contextLength: 2048,
        license: 'llama3.2',
        tags: ['chat', 'instruction', 'fast']
    },
    {
        id: 'llama-3.2-3b',
        name: 'Llama 3.2 3B',
        repo: 'unsloth/Llama-3.2-3B-Instruct',
        sizeGB: 5.5,
        parameters: '3B',
        quantization: '4bit',
        contextLength: 4096,
        license: 'llama3.2',
        tags: ['chat', 'instruction', 'balanced']
    },
    {
        id: 'qwen-2.5-1.5b',
        name: 'Qwen 2.5 1.5B',
        repo: 'Qwen/Qwen2.5-1.5B-Instruct',
        sizeGB: 3.0,
        parameters: '1.5B',
        quantization: '4bit',
        contextLength: 32768,
        license: 'apache-2.0',
        tags: ['chat', 'instruction', 'long-context']
    },
    {
        id: 'tinyllama-1.1b',
        name: 'TinyLlama 1.1B',
        repo: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
        sizeGB: 2.2,
        parameters: '1.1B',
        quantization: '4bit',
        contextLength: 2048,
        license: 'apache-2.0',
        tags: ['chat', 'fast', 'tiny']
    },
    {
        id: 'phi-3-mini',
        name: 'Phi-3 Mini',
        repo: 'microsoft/Phi-3-mini-4k-instruct',
        sizeGB: 3.8,
        parameters: '3.8B',
        quantization: '4bit',
        contextLength: 4096,
        license: 'mit',
        tags: ['chat', 'instruction', 'microsoft']
    },
    {
        id: 'gemma-2b',
        name: 'Gemma 2B',
        repo: 'google/gemma-2-2b-it',
        sizeGB: 4.5,
        parameters: '2B',
        quantization: '4bit',
        contextLength: 4096,
        license: 'gemma',
        tags: ['chat', 'google', 'instruction']
    }
];
export class ModelManager {
    cacheDir;
    models = new Map();
    pythonAvailable = false;
    transformersAvailable = false;
    constructor() {
        // Use system cache or local .cache
        this.cacheDir = process.env.HIVEMIND_CACHE ||
            path.join(os.homedir(), '.hivemind', 'models');
        this.ensureCacheDir();
    }
    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
    /**
     * Check if Python and required packages are available
     */
    async checkDependencies() {
        try {
            // Check Python
            await execAsync('python3 --version');
            this.pythonAvailable = true;
            // Check packages via Python script
            const pyCheck = `
import sys
try:
    import torch
    print(f"torch:{torch.__version__}")
    print(f"cuda:{torch.cuda.is_available()}")
    import transformers
    print(f"transformers:{transformers.__version__}")
    print("OK")
except Exception as e:
    print(f"ERROR:{e}")
    sys.exit(1)
      `;
            const { stdout } = await execAsync(`python3 -c "${pyCheck}"`);
            const lines = stdout.trim().split('\n');
            const result = {
                python: true,
                transformers: lines.some(l => l.startsWith('transformers:')),
                torch: lines.some(l => l.startsWith('torch:')),
                cuda: lines.some(l => l.includes('cuda:True'))
            };
            this.transformersAvailable = result.transformers;
            return result;
        }
        catch {
            return { python: false, transformers: false, torch: false, cuda: false };
        }
    }
    /**
     * Initialize and scan cache for downloaded models
     */
    async initialize() {
        console.log('📦 Initializing Model Manager...');
        console.log(`   Cache: ${this.cacheDir}`);
        // Scan cache directory
        if (fs.existsSync(this.cacheDir)) {
            const entries = fs.readdirSync(this.cacheDir);
            for (const modelId of entries) {
                const modelPath = path.join(this.cacheDir, modelId);
                const config = SUPPORTED_MODELS.find(m => m.id === modelId);
                if (config && fs.statSync(modelPath).isDirectory()) {
                    const cacheSize = this.getDirectorySize(modelPath);
                    this.models.set(modelId, {
                        config,
                        downloaded: true,
                        path: modelPath,
                        cacheSizeMB: Math.round(cacheSize / 1024 / 1024)
                    });
                }
            }
        }
        // Check dependencies
        const deps = await this.checkDependencies();
        console.log(`   Python: ${deps.python ? '✅' : '❌'}`);
        console.log(`   PyTorch: ${deps.torch ? '✅' : '❌'}`);
        console.log(`   Transformers: ${deps.transformers ? '✅' : '❌'}`);
        console.log(`   CUDA: ${deps.cuda ? '✅' : '❌ CPU only'}`);
        console.log(`   ${this.models.size} models in cache`);
    }
    /**
     * Get available models with download status
     */
    getAvailableModels() {
        return SUPPORTED_MODELS.map(config => {
            const cached = this.models.get(config.id);
            return cached || {
                config,
                downloaded: false,
                cacheSizeMB: 0
            };
        });
    }
    /**
     * Check if a model is downloaded and ready
     */
    isModelReady(modelId) {
        const status = this.models.get(modelId);
        return status?.downloaded || false;
    }
    /**
     * Get model path if downloaded
     */
    getModelPath(modelId) {
        const status = this.models.get(modelId);
        return status?.path || null;
    }
    /**
     * Download a model from HuggingFace
     */
    async downloadModel(modelId, onProgress) {
        const config = SUPPORTED_MODELS.find(m => m.id === modelId);
        if (!config) {
            throw new Error(`Unknown model: ${modelId}`);
        }
        const deps = await this.checkDependencies();
        if (!deps.transformers) {
            throw new Error('Transformers library not available. Run: pip install transformers torch');
        }
        const modelPath = path.join(this.cacheDir, modelId);
        console.log(`⬇️  Downloading ${config.name}...`);
        console.log(`   From: ${config.repo}`);
        console.log(`   Size: ~${config.sizeGB}GB`);
        console.log(`   To: ${modelPath}`);
        // Use Python to download
        const downloadScript = `
import os
import sys
from transformers import AutoModelForCausalLM, AutoTokenizer

os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

try:
    print("Downloading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained('${config.repo}', cache_dir='${modelPath}')
    print("Downloading model...")
    model = AutoModelForCausalLM.from_pretrained(
        '${config.repo}',
        cache_dir='${modelPath}',
        device_map='auto' if ${deps.cuda} else 'cpu',
        torch_dtype='auto',
        low_cpu_mem_usage=True
    )
    print("DOWNLOAD_COMPLETE")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
    `;
        try {
            // Run download in background with progress simulation
            const { stdout, stderr } = await execAsync(`python3 -c "${downloadScript}"`, {
                timeout: 600000 // 10 minute timeout
            });
            if (stdout.includes('DOWNLOAD_COMPLETE')) {
                const cacheSize = this.getDirectorySize(modelPath);
                const status = {
                    config,
                    downloaded: true,
                    path: modelPath,
                    cacheSizeMB: Math.round(cacheSize / 1024 / 1024),
                    lastUsed: new Date()
                };
                this.models.set(modelId, status);
                console.log(`✅ ${config.name} downloaded successfully`);
                console.log(`   Cache size: ${status.cacheSizeMB}MB`);
                return status;
            }
            else {
                throw new Error('Download failed: ' + stderr);
            }
        }
        catch (error) {
            // Clean up partial download
            if (fs.existsSync(modelPath)) {
                fs.rmSync(modelPath, { recursive: true, force: true });
            }
            throw error;
        }
    }
    /**
     * Remove a model from cache
     */
    async removeModel(modelId) {
        const modelPath = path.join(this.cacheDir, modelId);
        if (fs.existsSync(modelPath)) {
            fs.rmSync(modelPath, { recursive: true, force: true });
        }
        this.models.delete(modelId);
        console.log(`🗑️  Removed ${modelId} from cache`);
    }
    /**
     * Get total cache size
     */
    getCacheStats() {
        let totalMB = 0;
        for (const status of this.models.values()) {
            totalMB += status.cacheSizeMB;
        }
        return { totalMB, modelCount: this.models.size };
    }
    /**
     * Clear all cached models
     */
    async clearCache() {
        if (fs.existsSync(this.cacheDir)) {
            fs.rmSync(this.cacheDir, { recursive: true, force: true });
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        this.models.clear();
        console.log('🧹 Cache cleared');
    }
    /**
     * Find best model for available resources
     */
    recommendModel(availableRAM_GB, preferFast = true) {
        const candidates = SUPPORTED_MODELS.filter(m => m.sizeGB <= availableRAM_GB * 0.8);
        if (candidates.length === 0)
            return null;
        if (preferFast) {
            // Prefer smallest model
            return candidates.reduce((smallest, current) => current.sizeGB < smallest.sizeGB ? current : smallest);
        }
        else {
            // Prefer largest model that fits
            return candidates.reduce((largest, current) => current.sizeGB > largest.sizeGB ? current : largest);
        }
    }
    getDirectorySize(dir) {
        let size = 0;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filepath = path.join(dir, file);
            const stats = fs.statSync(filepath);
            if (stats.isDirectory()) {
                size += this.getDirectorySize(filepath);
            }
            else {
                size += stats.size;
            }
        }
        return size;
    }
}
//# sourceMappingURL=manager.js.map