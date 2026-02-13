#!/usr/bin/env node
/**
 * HIVEMIND Task Runner - Docker Container Version
 * Executes AI tasks inside container with real model inference
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

async function runTask() {
  const taskPrompt = process.env.TASK_PROMPT || '';
  const taskType = process.env.TASK_TYPE || 'inference';
  const taskModel = process.env.TASK_MODEL || 'tinyllama-1.1b';
  const maxTokens = parseInt(process.env.MAX_TOKENS || '256', 10);
  const temperature = parseFloat(process.env.TEMPERATURE || '0.7');

  console.log(`🚀 Task Runner Starting`);
  console.log(`   Type: ${taskType}`);
  console.log(`   Model: ${taskModel}`);
  console.log(`   Max Tokens: ${maxTokens}`);
  console.log(`   Temperature: ${temperature}`);

  const startTime = Date.now();
  const startMem = process.memoryUsage();

  try {
    // Check if we have model in mounted cache
    const modelCachePath = '/models';
    const hasModelCache = fs.existsSync(modelCachePath);
    
    let result;
    
    if (hasModelCache) {
      // Try to run real inference
      try {
        result = await runRealInference(taskModel, taskPrompt, taskType, maxTokens, temperature);
      } catch (inferenceError) {
        console.error('Inference failed, falling back to simulation:', inferenceError.message);
        result = runSimulated(taskPrompt, taskType, startTime, startMem);
      }
    } else {
      // No model available - simulate
      result = runSimulated(taskPrompt, taskType, startTime, startMem);
    }

    const endTime = Date.now();
    const endMem = process.memoryUsage();

    const output = {
      ...result,
      executionTimeMs: endTime - startTime,
      memoryUsed: Math.round((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024),
      peakMemory: Math.round(endMem.heapUsed / 1024 / 1024),
      container: {
        hostname: os.hostname(),
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemoryGB: Math.round(os.totalmem() / 1024 / 1024 / 1024)
      }
    };

    console.log('\n' + JSON.stringify(output, null, 2));
    
  } catch (error) {
    console.error('❌ Task failed:', error.message);
    const errorOutput = {
      success: false,
      error: error.message,
      executionTimeMs: Date.now() - startTime,
      memoryUsed: 0
    };
    console.log('\n' + JSON.stringify(errorOutput));
    process.exit(1);
  }
}

async function runRealInference(modelId, prompt, type, maxTokens, temperature) {
  // Import Python and run transformers inference
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const modelCache = '/models';
    
    const pythonScript = `
import sys
import json
import os

os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    
    model_id = "${modelId}"
    prompt = """${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""
    max_tokens = ${maxTokens}
    temp = ${temperature}
    
    # Find model in cache
    model_path = None
    cache_dir = "${modelCache}"
    
    for root, dirs, files in os.walk(cache_dir):
        if 'snapshots' in root and model_id in root:
            model_path = root
            break
    
    if not model_path:
        # Try direct from HuggingFace
        model_path = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    
    print(f"Loading model from: {model_path}", file=sys.stderr)
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        local_files_only=True,
        device_map='auto',
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        low_cpu_mem_usage=True,
        trust_remote_code=True
    )
    
    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
    if hasattr(model, 'device'):
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    # Generate
    import time
    start_gen = time.time()
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temp,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    gen_time = time.time() - start_gen
    
    # Decode
    input_length = inputs['input_ids'].shape[1]
    generated_tokens = outputs[0][input_length:]
    output_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    # Stats
    num_generated = len(generated_tokens)
    tokens_per_sec = num_generated / gen_time if gen_time > 0 else 0
    
    result = {
        "success": True,
        "output": {
            "text": output_text,
            "tokens": num_generated,
            "tokensPerSecond": round(tokens_per_sec, 2),
            "generationTimeMs": round(gen_time * 1000)
        },
        "model": model_id,
        "real": True
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

    const proc = spawn('python3', ['-c', pythonScript], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log progress to stderr
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) console.error(`   ${line}`);
      }
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const lines = stdout.trim().split('\n');
          let result = null;
          
          // Find JSON in output
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              result = JSON.parse(lines[i]);
              break;
            } catch {
              continue;
            }
          }
          
          if (result && result.success) {
            resolve(result);
          } else {
            reject(new Error(result?.error || 'Inference returned no result'));
          }
        } catch (e) {
          reject(new Error('Failed to parse inference output'));
        }
      } else {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Inference timeout'));
    }, 300000);
  });
}

function runSimulated(prompt, type, startTime, startMem) {
  // Simulated inference for when models aren't available
  const promptLength = prompt.length;
  const simulatedTokens = Math.floor(promptLength * 0.3) + 50;
  const simulatedOutput = `This is a simulated response to your prompt.\n\nIn production mode with downloaded models, this would be actual AI-generated text from models like Llama, Qwen, or TinyLlama.\n\nPrompt received (${promptLength} chars): "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
  
  // Simulate processing time
  const processingTime = Math.min(2000, 100 + promptLength);
  
  return {
    success: true,
    output: {
      text: simulatedOutput,
      tokens: simulatedTokens,
      simulated: true
    },
    model: 'simulated',
    real: false
  };
}

// Run the task
runTask().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
