#!/usr/bin/env node
/**
 * HIVEMIND Task Runner
 * Executes AI tasks inside Docker container with resource limits
 */

const si = require('systeminformation');

async function runTask() {
  const taskPrompt = process.env.TASK_PROMPT || '';
  const taskType = process.env.TASK_TYPE || 'inference';

  console.log(`🚀 Starting task: ${taskType}`);
  console.log(`📝 Prompt: ${taskPrompt.substring(0, 100)}...`);

  const startTime = Date.now();
  const startMem = process.memoryUsage();

  try {
    // Simulated AI inference (replace with actual model loading)
    let result;
    
    if (taskType === 'inference') {
      // In production, load model and run inference here
      // const model = await loadModel();
      // result = await model.generate(taskPrompt);
      
      // Simulated response
      result = {
        output: `Simulated response to: ${taskPrompt.substring(0, 50)}...`,
        model: 'hivemind-runtime',
        tokensGenerated: Math.floor(Math.random() * 100) + 50
      };
    } else if (taskType === 'embedding') {
      result = {
        embedding: Array(384).fill(0).map(() => Math.random()),
        dimensions: 384
      };
    } else {
      result = { status: 'unknown_task_type' };
    }

    const endTime = Date.now();
    const endMem = process.memoryUsage();

    const output = {
      ...result,
      executionTimeMs: endTime - startTime,
      memoryUsed: Math.round((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024),
      peakMemory: Math.round(endMem.heapUsed / 1024 / 1024)
    };

    console.log('✅ Task completed');
    console.log(`⏱️  Time: ${output.executionTimeMs}ms`);
    console.log(`💾 Memory: ${output.memoryUsed}MB`);

    console.log('\n' + JSON.stringify(output, null, 2));
    
  } catch (error) {
    console.error('❌ Task failed:', error.message);
    process.exit(1);
  }
}

runTask();
