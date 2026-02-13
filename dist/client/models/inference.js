/**
 * Inference Engine - Execute real AI model inference
 * Handles text generation, embeddings, and chat completion
 */
import { spawn } from 'child_process';
import { ModelManager, SUPPORTED_MODELS } from './manager.js';
export class InferenceEngine {
    modelManager;
    activeModels = new Map();
    constructor() {
        this.modelManager = new ModelManager();
    }
    async initialize() {
        await this.modelManager.initialize();
    }
    /**
     * Run inference on a downloaded model
     */
    async runInference(request) {
        const startTime = Date.now();
        // Validate model is available
        if (!this.modelManager.isModelReady(request.modelId)) {
            return {
                success: false,
                error: `Model ${request.modelId} not downloaded. Run download first.`,
                tokensGenerated: 0,
                tokensPerSecond: 0,
                executionTimeMs: 0,
                memoryUsedMB: 0
            };
        }
        const modelPath = this.modelManager.getModelPath(request.modelId);
        if (!modelPath) {
            return {
                success: false,
                error: 'Model path not found',
                tokensGenerated: 0,
                tokensPerSecond: 0,
                executionTimeMs: 0,
                memoryUsedMB: 0
            };
        }
        const modelConfig = SUPPORTED_MODELS.find(m => m.id === request.modelId);
        if (!modelConfig) {
            return {
                success: false,
                error: 'Model configuration not found',
                tokensGenerated: 0,
                tokensPerSecond: 0,
                executionTimeMs: 0,
                memoryUsedMB: 0
            };
        }
        try {
            // Build Python inference script
            const inferenceScript = this.buildInferenceScript(request, modelPath, modelConfig);
            // Execute with Python
            const result = await this.executePython(inferenceScript, startTime);
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Inference failed',
                tokensGenerated: 0,
                tokensPerSecond: 0,
                executionTimeMs: Date.now() - startTime,
                memoryUsedMB: 0
            };
        }
    }
    buildInferenceScript(request, modelPath, modelConfig) {
        const maxTokens = request.maxTokens || 256;
        const temperature = request.temperature ?? 0.7;
        const topP = request.topP ?? 0.9;
        // Escape the prompt for Python
        const escapedPrompt = request.prompt
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
        return `
import sys
import json
import os
import time
import gc

# Suppress warnings
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

try:
    import torch
    import transformers
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
    
    # Track memory
    start_mem = torch.cuda.memory_allocated() / 1024 / 1024 if torch.cuda.is_available() else 0
    
    # Load model and tokenizer
    start_load = time.time()
    tokenizer = AutoTokenizer.from_pretrained('${modelConfig.repo}', cache_dir='${modelPath}', local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(
        '${modelConfig.repo}',
        cache_dir='${modelPath}',
        local_files_only=True,
        device_map='auto',
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        low_cpu_mem_usage=True
    )
    load_time = time.time() - start_load
    
    # Prepare prompt
    prompt = '''${escapedPrompt}'''
    
    # Format for chat if needed
    if '${request.type}' == 'chat' and hasattr(tokenizer, 'apply_chat_template'):
        messages = [{"role": "user", "content": prompt}]
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    
    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=${modelConfig.contextLength - maxTokens})
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    input_tokens = inputs['input_ids'].shape[1]
    
    # Generate
    start_gen = time.time()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=${maxTokens},
            temperature=${temperature},
            top_p=${topP},
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    gen_time = time.time() - start_gen
    
    # Decode output
    generated_tokens = outputs[0][input_tokens:]
    output_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    # Calculate stats
    num_generated = len(generated_tokens)
    tokens_per_sec = num_generated / gen_time if gen_time > 0 else 0
    
    # Memory usage
    if torch.cuda.is_available():
        end_mem = torch.cuda.memory_allocated() / 1024 / 1024
        mem_used = max(0, end_mem - start_mem)
    else:
        import psutil
        process = psutil.Process()
        mem_info = process.memory_info()
        mem_used = mem_info.rss / 1024 / 1024
    
    # Cleanup
    del model
    del tokenizer
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Return result
    result = {
        "success": True,
        "output": output_text,
        "tokensGenerated": num_generated,
        "tokensPerSecond": round(tokens_per_sec, 2),
        "executionTimeMs": int((time.time() - start_load) * 1000),
        "memoryUsedMB": int(mem_used)
    }
    
    print(json.dumps(result))
    
except Exception as e:
    import traceback
    error_result = {
        "success": False,
        "error": str(e),
        "traceback": traceback.format_exc()
    }
    print(json.dumps(error_result))
    sys.exit(1)
`;
    }
    executePython(script, startTime) {
        return new Promise((resolve) => {
            const proc = spawn('python3', ['-c', script], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    PYTHONUNBUFFERED: '1',
                    OMP_NUM_THREADS: '4',
                    MKL_NUM_THREADS: '4'
                }
            });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                // Stream progress to console
                const lines = data.toString().trim().split('\n');
                for (const line of lines) {
                    if (line.includes('Downloading') || line.includes('Loading')) {
                        console.log(`   ${line}`);
                    }
                }
            });
            proc.on('close', (code) => {
                const executionTime = Date.now() - startTime;
                if (code === 0) {
                    try {
                        // Find the JSON output (last line with valid JSON)
                        const lines = stdout.trim().split('\n');
                        let result = null;
                        for (let i = lines.length - 1; i >= 0; i--) {
                            try {
                                result = JSON.parse(lines[i]);
                                break;
                            }
                            catch {
                                continue;
                            }
                        }
                        if (result && result.success) {
                            resolve({
                                success: true,
                                output: result.output,
                                tokensGenerated: result.tokensGenerated,
                                tokensPerSecond: result.tokensPerSecond,
                                executionTimeMs: result.executionTimeMs,
                                memoryUsedMB: result.memoryUsedMB
                            });
                        }
                        else {
                            resolve({
                                success: false,
                                error: result?.error || stderr || 'Unknown error',
                                tokensGenerated: 0,
                                tokensPerSecond: 0,
                                executionTimeMs: executionTime,
                                memoryUsedMB: 0
                            });
                        }
                    }
                    catch (e) {
                        resolve({
                            success: false,
                            error: `Failed to parse output: ${e instanceof Error ? e.message : 'unknown'}`,
                            tokensGenerated: 0,
                            tokensPerSecond: 0,
                            executionTimeMs: executionTime,
                            memoryUsedMB: 0
                        });
                    }
                }
                else {
                    resolve({
                        success: false,
                        error: stderr || `Process exited with code ${code}`,
                        tokensGenerated: 0,
                        tokensPerSecond: 0,
                        executionTimeMs: executionTime,
                        memoryUsedMB: 0
                    });
                }
            });
            // Timeout after 5 minutes
            setTimeout(() => {
                proc.kill('SIGKILL');
                resolve({
                    success: false,
                    error: 'Inference timeout (5 minutes exceeded)',
                    tokensGenerated: 0,
                    tokensPerSecond: 0,
                    executionTimeMs: Date.now() - startTime,
                    memoryUsedMB: 0
                });
            }, 300000);
        });
    }
    /**
     * Generate embeddings for text
     */
    async generateEmbeddings(text, modelId = 'sentence-transformers/all-MiniLM-L6-v2') {
        const script = `
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('${modelId}')
embedding = model.encode("""${text.replace(/"/g, '\\"')}""")
print(json.dumps(embedding.tolist()))
`;
        return new Promise((resolve, reject) => {
            const proc = spawn('python3', ['-c', script]);
            let stdout = '';
            proc.stdout.on('data', (d) => stdout += d);
            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        resolve(JSON.parse(stdout));
                    }
                    catch {
                        reject(new Error('Failed to parse embeddings'));
                    }
                }
                else {
                    reject(new Error('Embedding generation failed'));
                }
            });
        });
    }
    /**
     * Check if a model can be loaded with available RAM
     */
    canLoadModel(modelId, availableRAM_GB) {
        const model = SUPPORTED_MODELS.find(m => m.id === modelId);
        if (!model)
            return false;
        // Need 1.5x model size for loading overhead
        return model.sizeGB * 1.5 <= availableRAM_GB;
    }
    /**
     * Get model stats
     */
    getStats() {
        const cache = this.modelManager.getCacheStats();
        return {
            availableModels: SUPPORTED_MODELS.length,
            downloadedModels: cache.modelCount,
            cacheSizeMB: cache.totalMB,
            pythonAvailable: true // TODO: check actual availability
        };
    }
}
//# sourceMappingURL=inference.js.map