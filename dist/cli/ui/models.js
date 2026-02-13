/**
 * HIVEMIND CLI - Model Management
 * Download, list, and manage AI models
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// Model list - shared across CLI and client
export const SUPPORTED_MODELS = [
    { id: 'tinyllama-1.1b', name: 'TinyLlama 1.1B', repo: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0', sizeGB: 2.2, parameters: '1.1B', contextLength: 2048 },
    { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', repo: 'unsloth/Llama-3.2-1B-Instruct', sizeGB: 2.5, parameters: '1B', contextLength: 2048 },
    { id: 'llama-3.2-3b', name: 'Llama 3.2 3B', repo: 'unsloth/Llama-3.2-3B-Instruct', sizeGB: 5.5, parameters: '3B', contextLength: 4096 },
    { id: 'qwen-2.5-1.5b', name: 'Qwen 2.5 1.5B', repo: 'Qwen/Qwen2.5-1.5B-Instruct', sizeGB: 3.0, parameters: '1.5B', contextLength: 32768 },
    { id: 'phi-3-mini', name: 'Phi-3 Mini', repo: 'microsoft/Phi-3-mini-4k-instruct', sizeGB: 3.8, parameters: '3.8B', contextLength: 4096 },
    { id: 'gemma-2b', name: 'Gemma 2B', repo: 'google/gemma-2-2b-it', sizeGB: 4.5, parameters: '2B', contextLength: 4096 }
];
export class ModelManagerCLI {
    cacheDir;
    constructor() {
        this.cacheDir = process.env.HIVEMIND_CACHE || path.join(os.homedir(), '.hivemind', 'models');
    }
    /**
     * Show all available models
     */
    async listModels() {
        console.log(chalk.bold('\n🧠 Available Models\n'));
        console.log(chalk.dim('ID'.padEnd(20)) + chalk.dim('Name'.padEnd(20)) + chalk.dim('Size'.padEnd(10)) + chalk.dim('Params'.padEnd(10)) + 'Status');
        console.log(chalk.dim('─'.repeat(80)));
        // Check which models are downloaded
        const downloaded = await this.getDownloadedModels();
        for (const model of SUPPORTED_MODELS) {
            const id = model.id.padEnd(20);
            const name = model.name.padEnd(20);
            const size = `~${model.sizeGB}GB`.padEnd(10);
            const params = model.parameters.padEnd(10);
            const status = downloaded.includes(model.id)
                ? chalk.green('✓ downloaded')
                : chalk.gray('available');
            console.log(`${id}${name}${size}${params}${status}`);
        }
        console.log(chalk.dim('\nRun with: hivemind models --download <model-id>\n'));
    }
    /**
     * Get list of downloaded models
     */
    async getDownloadedModels() {
        if (!fs.existsSync(this.cacheDir)) {
            return [];
        }
        try {
            const entries = fs.readdirSync(this.cacheDir);
            return entries.filter(e => {
                const stat = fs.statSync(path.join(this.cacheDir, e));
                return stat.isDirectory();
            });
        }
        catch {
            return [];
        }
    }
    /**
     * Interactive model selection and download
     */
    async interactiveDownload() {
        console.clear();
        console.log(chalk.bold('\n📥 Download Models\n'));
        console.log(chalk.dim('Choose a model to download for offline inference\n'));
        const choices = SUPPORTED_MODELS.map(m => ({
            name: `${m.name} (${m.sizeGB}GB, ${m.parameters})`,
            value: m.id,
            short: m.name
        }));
        const { selectedModel } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedModel',
                message: 'Select model to download:',
                choices: [
                    ...choices,
                    { name: '← Back to main menu', value: 'back' }
                ]
            }
        ]);
        if (selectedModel === 'back') {
            return;
        }
        await this.downloadModel(selectedModel);
    }
    /**
     * Download a specific model using Python/HuggingFace
     */
    async downloadModel(modelId) {
        const model = SUPPORTED_MODELS.find(m => m.id === modelId);
        if (!model) {
            console.log(chalk.red(`❌ Unknown model: ${modelId}`));
            console.log(chalk.gray('Available: ') + SUPPORTED_MODELS.map(m => m.id).join(', '));
            return false;
        }
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        console.log(chalk.bold(`\n⬇️  Downloading ${model.name}...`));
        console.log(chalk.gray(`   Size: ~${model.sizeGB}GB`));
        console.log(chalk.gray(`   From: ${model.repo}`));
        console.log(chalk.gray(`   Cache: ${this.cacheDir}`));
        console.log(chalk.yellow(`   This may take several minutes...\n`));
        try {
            // Check Python dependencies first
            await this.checkDependencies();
            // Download using Python script
            const downloadScript = `
import os
from transformers import AutoModelForCausalLM, AutoTokenizer

os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

try:
    print("Downloading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained('${model.repo}')
    print("Downloading model...")
    model = AutoModelForCausalLM.from_pretrained('${model.repo}', device_map='cpu', torch_dtype='float32')
    print("DOWNLOAD_COMPLETE")
except Exception as e:
    print(f"ERROR: {e}")
`;
            const { stdout, stderr } = await execAsync(`python3 -c "${downloadScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
                cwd: this.cacheDir,
                maxBuffer: 1024 * 1024 * 1024 // 1GB buffer
            });
            if (stdout.includes('DOWNLOAD_COMPLETE') || stdout.includes('already')) {
                console.log(chalk.green(`\n✅ ${model.name} downloaded successfully!`));
                console.log(chalk.gray('You can now run inference with this model.'));
                return true;
            }
            else {
                console.log(chalk.red(`\n❌ Failed: ${stderr || stdout}`));
                return false;
            }
        }
        catch (error) {
            console.log(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
            console.log(chalk.gray('\nMake sure you have Python and transformers installed:'));
            console.log(chalk.gray('   pip install transformers torch'));
            return false;
        }
    }
    /**
     * Check Python dependencies
     */
    async checkDependencies() {
        try {
            await execAsync('python3 -c "import transformers; import torch"');
            return true;
        }
        catch {
            console.log(chalk.yellow('\n⚠️  Python dependencies not found.'));
            console.log(chalk.gray('Installing required packages...'));
            try {
                await execAsync('pip install transformers torch --quiet');
                console.log(chalk.green('✓ Dependencies installed'));
                return true;
            }
            catch {
                console.log(chalk.red('❌ Failed to install dependencies'));
                return false;
            }
        }
    }
    /**
     * Check installed models
     */
    async checkInstalled() {
        console.log(chalk.bold('\n📦 Installed Models\n'));
        console.log(chalk.gray(`Cache directory: ${this.cacheDir}`));
        const downloaded = await this.getDownloadedModels();
        if (downloaded.length === 0) {
            console.log(chalk.yellow('\n⚠️  No models downloaded yet.'));
            console.log(chalk.gray('Run: hivemind models --download <model-id>'));
        }
        else {
            console.log(chalk.green(`\n✓ ${downloaded.length} model(s) installed:`));
            for (const id of downloaded) {
                const model = SUPPORTED_MODELS.find(m => m.id === id);
                console.log(`   • ${model?.name || id}`);
            }
        }
    }
    /**
     * Remove a downloaded model
     */
    async removeModel(modelId) {
        const modelPath = path.join(this.cacheDir, modelId);
        if (!fs.existsSync(modelPath)) {
            console.log(chalk.yellow(`⚠️  Model ${modelId} is not installed.`));
            return false;
        }
        console.log(chalk.bold(`\n🗑️  Removing ${modelId}...`));
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete ${modelId}?`,
                default: false
            }
        ]);
        if (!confirm) {
            console.log(chalk.gray('Cancelled.'));
            return false;
        }
        try {
            fs.rmSync(modelPath, { recursive: true, force: true });
            console.log(chalk.green(`✅ Removed ${modelId}`));
            return true;
        }
        catch (error) {
            console.log(chalk.red(`❌ Error removing model: ${error}`));
            return false;
        }
    }
    /**
     * Run a test inference
     */
    async testInference(modelId) {
        console.log(chalk.bold('\n🧪 Running Test Inference\n'));
        const testPrompt = "Write a haiku about computers:";
        const model = modelId || 'tinyllama-1.1b';
        console.log(chalk.gray(`Model: ${model}`));
        console.log(chalk.gray(`Prompt: "${testPrompt}"\n`));
        console.log(chalk.yellow('Running inference...'));
        try {
            // Check if model is downloaded
            const downloaded = await this.getDownloadedModels();
            if (!downloaded.includes(model)) {
                console.log(chalk.yellow(`\n⚠️  Model ${model} not downloaded.`));
                console.log(chalk.gray(`Run: hivemind models --download ${model}`));
                return;
            }
            // Run actual inference
            const inferenceScript = `
from transformers import AutoModelForCausalLM, AutoTokenizer
import json

model_id = "${model}"
tokenizer = AutoModelForCausalLM.from_pretrained(model_id, device_map='cpu')
model = AutoModelForCausalLM.from_pretrained(model_id, device_map='cpu')

prompt = """${testPrompt}"""
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=50, temperature=0.7)
response = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(response)
`;
            const { stdout } = await execAsync(`python3 -c "${inferenceScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
                maxBuffer: 100 * 1024 * 1024
            });
            console.log(chalk.green('\n✅ Inference complete!\n'));
            console.log(chalk.white('Output:'));
            console.log(chalk.white('─'.repeat(40)));
            console.log(stdout.trim());
            console.log(chalk.white('─'.repeat(40)));
        }
        catch (error) {
            console.log(chalk.red(`\n❌ Inference failed: ${error instanceof Error ? error.message : 'Unknown'}`));
        }
    }
}
// CLI entry point
async function main() {
    const args = process.argv.slice(2);
    const modelMgr = new ModelManagerCLI();
    if (args.includes('--list') || args.includes('-l')) {
        await modelMgr.listModels();
    }
    else if (args.includes('--download') || args.includes('-d')) {
        const modelId = args[args.indexOf('--download') + 1] || args[args.indexOf('-d') + 1];
        if (modelId && !modelId.startsWith('-')) {
            await modelMgr.downloadModel(modelId);
        }
        else {
            await modelMgr.interactiveDownload();
        }
    }
    else if (args.includes('--interactive') || args.includes('-i')) {
        await modelMgr.interactiveDownload();
    }
    else if (args.includes('--test')) {
        const modelId = args.includes('--model') ? args[args.indexOf('--model') + 1] : undefined;
        await modelMgr.testInference(modelId);
    }
    else if (args.includes('--help') || args.includes('-h')) {
        console.log(`
${chalk.bold('🧠 HIVEMIND Model Manager')}

${chalk.bold('Usage:')}
  hivemind models [options]

${chalk.bold('Options:')}
  --list, -l          List all available models
  --download, -d [id]  Download a model (or -i for interactive)
  --interactive, -i    Interactive model selection
  --test [model]      Run test inference
  --remove <id>       Remove downloaded model
  --help, -h          Show this help

${chalk.bold('Examples:')}
  hivemind models --list
  hivemind models --download tinyllama-1.1b
  hivemind models --interactive
  hivemind models --test --model llama-3.2-1b

${chalk.bold('Available Models:')}
  tinyllama-1.1b      TinyLlama 1.1B (fastest)
  llama-3.2-1b        Llama 3.2 1B
  llama-3.2-3b        Llama 3.2 3B (best quality)
  qwen-2.5-1.5b       Qwen 2.5 1.5B (long context)
  phi-3-mini          Phi-3 Mini (Microsoft)
  gemma-2b            Gemma 2B (Google)
`);
    }
    else {
        await modelMgr.listModels();
    }
}
main().catch(console.error);
//# sourceMappingURL=models.js.map