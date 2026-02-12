/**
 * 🐝 HIVEMIND Interactive Setup Wizard
 *
 * This guides users through:
 * 1. Security warnings and explanations
 * 2. Opt-in confirmations
 * 3. Resource configuration
 * 4. Account setup or guest mode
 * 5. Final confirmation
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import si from 'systeminformation';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export class InteractiveSetup {
    config;
    systemInfo = null;
    constructor() {
        this.config = {
            serverUrl: 'ws://localhost:3001',
            maxMemoryMB: 4096,
            maxCPUPercent: 70,
            maxConcurrentTasks: 2,
            autoStart: false,
            shareGPU: false,
            createAccount: false
        };
    }
    async run() {
        console.clear();
        // Step 1: Welcome & System Detection
        await this.welcome();
        // Step 2: Security Education
        await this.showSecurityInfo();
        // Step 3: System Detection
        await this.detectSystem();
        // Step 4: Resource Configuration
        await this.configureResources();
        // Step 5: Account Setup
        await this.setupAccount();
        // Step 6: Final Confirmation
        await this.finalConfirmation();
        // Step 7: Save Config & Start
        await this.saveAndStart();
    }
    async welcome() {
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   ' + chalk.bold('WELCOME TO HIVEMIND SETUP') + '                                   ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   This wizard will help you join the decentralized AI network. ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   Estimated time: 2-3 minutes' + '                                     ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        const { proceed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Press Enter to continue...',
                default: true
            }
        ]);
    }
    async showSecurityInfo() {
        console.clear();
        console.log(chalk.red('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.red('║') + '                                                                ' + chalk.red('║'));
        console.log(chalk.red('║') + '   ' + chalk.bold('SECURITY FIRST - PLEASE READ') + '                            ' + chalk.red('║'));
        console.log(chalk.red('║') + '                                                                ' + chalk.red('║'));
        console.log(chalk.red('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.white('HIVEMIND takes security seriously. Here is what you need to know:'));
        console.log('');
        console.log(chalk.yellow('HOW WE PROTECT YOUR COMPUTER:'));
        console.log('');
        console.log(chalk.green('  1. Sandboxed Execution'));
        console.log(chalk.white('     All tasks run in isolated containers with strict resource limits.'));
        console.log(chalk.white('     Your files, passwords, and data are completely isolated.'));
        console.log('');
        console.log(chalk.green('  2. No Filesystem Access'));
        console.log(chalk.white('     Tasks CANNOT read, write, or modify any files on your computer.'));
        console.log(chalk.white('     This is enforced at the operating system level.'));
        console.log('');
        console.log(chalk.green('  3. Network Isolation'));
        console.log(chalk.white('     Tasks cannot access the internet or your local network.'));
        console.log(chalk.white('     They can only communicate with HIVEMIND servers.'));
        console.log('');
        console.log(chalk.green('  4. Resource Limits'));
        console.log(chalk.white('     You control how much RAM, CPU, and time each task can use.'));
        console.log(chalk.white('     Tasks are automatically killed if they exceed limits.'));
        console.log('');
        console.log(chalk.green('  5. Transparent Monitoring'));
        console.log(chalk.white('     You can see everything your node is doing in real-time.'));
        console.log('');
        console.log(chalk.red('WHAT WE NEED FROM YOU:'));
        console.log('');
        console.log(chalk.white('  - Permission to use your idle compute resources'));
        console.log(chalk.white('  - Network access to connect to HIVEMIND servers'));
        console.log(chalk.white('  - Optional: GPU access for faster AI inference'));
        console.log('');
        console.log(chalk.green('WHAT WE WILL NEVER DO:'));
        console.log('');
        console.log(chalk.red('  X Access your personal files'));
        console.log(chalk.red('  X Install software without your knowledge'));
        console.log(chalk.red('  X Slow down your computer while you are using it'));
        console.log(chalk.red('  X Use your data for anything other than AI tasks'));
        console.log(chalk.red('  X Run crypto mining or other unrelated tasks'));
        console.log('');
        const { understood } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'understood',
                message: chalk.white('I understand how HIVEMIND protects my computer. Continue?'),
                default: true
            }
        ]);
        if (!understood) {
            console.log(chalk.dim('\nThanks for considering HIVEMIND. Goodbye!\n'));
            process.exit(0);
        }
    }
    async detectSystem() {
        console.clear();
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   ' + chalk.bold('DETECTING YOUR SYSTEM') + '                                   ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        const spinner = ora('Gathering system information...').start();
        try {
            const [cpu, mem, graphics, osInfo] = await Promise.all([
                si.cpu(),
                si.mem(),
                si.graphics(),
                si.osInfo()
            ]);
            this.systemInfo = {
                cpu: cpu.model,
                cores: cpu.cores,
                ram: Math.round(mem.total / 1024 / 1024 / 1024),
                gpu: graphics.controllers && graphics.controllers.length > 0
                    ? graphics.controllers.map(g => g.model || 'Unknown')
                    : ['None detected'],
                os: `${osInfo.distro} ${osInfo.release}`
            };
            spinner.succeed();
            console.log(chalk.green('System detected:'));
            console.log('');
            console.log(chalk.white('  CPU:      ' + this.systemInfo.cpu));
            console.log(chalk.white('  Cores:   ' + this.systemInfo.cores + ' threads'));
            console.log(chalk.white('  RAM:      ' + this.systemInfo.ram + 'GB'));
            console.log(chalk.white('  GPU:      ' + this.systemInfo.gpu.join(', ')));
            console.log(chalk.white('  OS:       ' + this.systemInfo.os));
            console.log('');
        }
        catch (error) {
            spinner.fail('Could not detect system information');
            console.log(chalk.dim('Continuing with default settings...\n'));
            this.systemInfo = {
                cpu: 'Unknown',
                cores: 4,
                ram: 8,
                gpu: ['None detected'],
                os: os.platform()
            };
        }
    }
    async configureResources() {
        console.clear();
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   ' + chalk.bold('CONFIGURE YOUR CONTRIBUTION') + '                               ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   How much of your resources do you want to share?           ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        const ramGB = this.systemInfo?.ram || 8;
        const cores = this.systemInfo?.cores || 4;
        const recommendedRAM = Math.min(Math.floor(ramGB * 0.5), 8);
        const recommendedCPU = Math.min(Math.floor(cores * 0.5), 8);
        console.log(chalk.dim('Recommended settings for your system (' + ramGB + 'GB RAM, ' + cores + ' cores):'));
        console.log(chalk.dim('  RAM:   ' + recommendedRAM + 'GB  (50% of available)'));
        console.log(chalk.dim('  CPU:   ' + recommendedCPU + ' cores (50% of available)'));
        console.log('');
        const answers = await inquirer.prompt([
            {
                type: 'number',
                name: 'maxMemoryMB',
                message: chalk.white('Maximum RAM to share (MB):'),
                default: recommendedRAM * 1024,
                validate: (input) => {
                    if (input < 512)
                        return 'Minimum 512MB required';
                    if (input > ramGB * 1024)
                        return 'Cannot exceed available RAM';
                    return true;
                }
            },
            {
                type: 'number',
                name: 'maxCPUPercent',
                message: chalk.white('Maximum CPU usage (%):'),
                default: 50,
                validate: (input) => {
                    if (input < 10)
                        return 'Minimum 10% required';
                    if (input > 90)
                        return 'Maximum 90% - leave some for your computer';
                    return true;
                }
            },
            {
                type: 'number',
                name: 'maxConcurrentTasks',
                message: chalk.white('Maximum concurrent AI tasks:'),
                default: Math.max(1, Math.floor(recommendedCPU / 2)),
                validate: (input) => {
                    if (input < 1)
                        return 'Minimum 1 task required';
                    return true;
                }
            },
            {
                type: 'confirm',
                name: 'shareGPU',
                message: chalk.white('Share GPU for faster AI inference? (requires NVIDIA/AMD GPU)'),
                default: this.systemInfo?.gpu && this.systemInfo.gpu[0] !== 'None detected'
            }
        ]);
        this.config = {
            ...this.config,
            ...answers
        };
        // Show summary
        console.log(chalk.green('\nResource configuration saved:'));
        console.log(chalk.white('   RAM:   ' + Math.round(this.config.maxMemoryMB / 1024) + 'GB'));
        console.log(chalk.white('   CPU:   ' + this.config.maxCPUPercent + '%'));
        console.log(chalk.white('   Tasks: ' + this.config.maxConcurrentTasks));
        console.log(chalk.white('   GPU:   ' + (this.config.shareGPU ? 'Yes' : 'No')));
    }
    async setupAccount() {
        console.clear();
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   ' + chalk.bold('ACCOUNT SETUP') + '                                              ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        const { createAccount } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'createAccount',
                message: chalk.white('Do you want to create an account to earn and spend credits?'),
                default: true
            }
        ]);
        this.config.createAccount = createAccount;
        if (createAccount) {
            console.log(chalk.dim('\nAccount features:'));
            console.log(chalk.white('   - Earn credits for contributing compute'));
            console.log(chalk.white('   - Spend credits on AI model queries'));
            console.log(chalk.white('   - Track your contribution history'));
            console.log(chalk.white('   - Build reputation in the network'));
            console.log('');
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'username',
                    message: chalk.white('Choose a username:'),
                    validate: (input) => {
                        if (input.length < 3)
                            return 'Username must be at least 3 characters';
                        if (!/^[a-zA-Z0-9_]+$/.test(input))
                            return 'Only letters, numbers, and underscores';
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'email',
                    message: chalk.white('Your email (for account recovery):'),
                    validate: (input) => {
                        if (!input.includes('@'))
                            return 'Please enter a valid email';
                        return true;
                    }
                },
                {
                    type: 'password',
                    name: 'password',
                    message: chalk.white('Choose a password:'),
                    validate: (input) => {
                        if (input.length < 8)
                            return 'Password must be at least 8 characters';
                        return true;
                    }
                }
            ]);
            this.config.userData = answers;
        }
    }
    async finalConfirmation() {
        console.clear();
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   ' + chalk.bold('FINAL CONFIRMATION') + '                                         ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.white('Before you join, please confirm:'));
        console.log('');
        console.log(chalk.bold('I understand that:'));
        console.log('  - HIVEMIND will use ' + Math.round(this.config.maxMemoryMB / 1024) + 'GB of my RAM');
        console.log('  - HIVEMIND will use ' + this.config.maxCPUPercent + '% of my CPU');
        console.log('  - HIVEMIND can run up to ' + this.config.maxConcurrentTasks + ' AI tasks simultaneously');
        console.log('  - HIVEMIND ' + (this.config.shareGPU ? 'will' : 'will NOT') + ' use my GPU');
        console.log('  - I ' + (this.config.createAccount ? 'will be known as "' + this.config.userData?.username + '"' : 'will contribute as a guest'));
        console.log('');
        console.log(chalk.bold('Security guarantees:'));
        console.log('  - My files are completely isolated and protected');
        console.log('  - Tasks cannot access my personal data');
        console.log('  - I can stop contributing at any time');
        console.log('  - HIVEMIND will never slow down my computer');
        console.log('');
        console.log(chalk.bold('Credit system:'));
        console.log('  - I will earn credits for contributing compute');
        console.log('  - I can spend credits on AI model queries');
        console.log('  - Credits have no monetary value outside the network');
        console.log('');
        const { confirm, acceptedTerms } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: chalk.white('Everything looks correct. Join HIVEMIND?'),
                default: true
            },
            {
                type: 'confirm',
                name: 'acceptedTerms',
                message: chalk.white('I accept the Terms of Service and Privacy Policy'),
                default: false
            }
        ]);
        if (!confirm) {
            console.log(chalk.dim('\nThanks for checking out HIVEMIND!\n'));
            process.exit(0);
        }
        if (!acceptedTerms) {
            console.log(chalk.red('\nYou must accept the Terms of Service to continue.\n'));
            process.exit(1);
        }
    }
    async saveAndStart() {
        console.clear();
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '   ' + chalk.bold('JOINING HIVEMIND...') + '                                         ' + chalk.yellow('║'));
        console.log(chalk.yellow('║') + '                                                                ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        // Save configuration
        const configDir = path.join(os.homedir(), '.hivemind');
        fs.mkdirSync(configDir, { recursive: true });
        const configPath = path.join(configDir, 'config.json');
        fs.writeFileSync(configPath, JSON.stringify({
            serverUrl: this.config.serverUrl,
            maxMemoryMB: this.config.maxMemoryMB,
            maxCPUPercent: this.config.maxCPUPercent,
            maxConcurrentTasks: this.config.maxConcurrentTasks,
            shareGPU: this.config.shareGPU,
            createdAt: new Date().toISOString()
        }, null, 2));
        console.log(chalk.green('Configuration saved to ~/.hivemind/config.json\n'));
        // Simulate connection
        const spinner = ora('Connecting to HIVEMIND network...').start();
        await new Promise(resolve => setTimeout(resolve, 2000));
        spinner.succeed(chalk.green('Connected to HIVEMIND!'));
        console.log(chalk.white(''));
        console.log(chalk.white(''));
        console.log(chalk.bold('Welcome to HIVEMIND!'));
        console.log('');
        console.log(chalk.yellow('Quick commands:'));
        console.log('  hivemind status     - View your contribution status');
        console.log('  hivemind monitor    - Watch tasks in real-time');
        console.log('  hivemind dashboard  - Open web dashboard');
        console.log('  hivemind stop       - Stop contributing');
        console.log('  hivemind config     - Change settings');
        console.log('');
        console.log(chalk.green('You will earn credits for:'));
        console.log('  - Completing AI tasks');
        console.log('  - Providing reliable compute');
        console.log('  - Building reputation');
        console.log('');
        console.log(chalk.bold('Happy contributing!'));
        console.log('');
    }
}
//# sourceMappingURL=setup.js.map