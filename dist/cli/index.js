#!/usr/bin/env node
/**
 * 🐝 HIVEMIND CLI
 *
 * Decentralized AI Compute Network - Command Line Interface
 *
 * This is how users join your network!
 *
 * Features:
 * - Interactive setup wizard
 * - Security warnings and opt-in confirmations
 * - Resource configuration
 * - Real-time monitoring
 * - Dashboard access
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { HiveDrone } from './commands/drone.js';
import { InteractiveSetup } from './ui/setup.js';
import { Monitor } from './ui/monitor.js';
const BANNER = `
${chalk.yellow('╔════════════════════════════════════════════════════════════════╗')}
${chalk.yellow('║')}                                                                ${chalk.yellow('║')}
${chalk.yellow('║')}   ${chalk.bold('🐝  H I V E M I N D')}                                        ${chalk.yellow('║')}
${chalk.yellow('║')}                                                                ${chalk.yellow('║')}
${chalk.yellow('║')}   ${chalk.white('Decentralized AI Compute Network')}                          ${chalk.yellow('║')}
${chalk.yellow('║')}                                                                ${chalk.yellow('║')}
${chalk.yellow('║')}   ${chalk.dim('Share your compute. Run massive models. Earn credits.')}    ${chalk.yellow('║')}
${chalk.yellow('║')}                                                                ${chalk.yellow('║')}
${chalk.yellow('╚════════════════════════════════════════════════════════════════╝')}
`;
async function main() {
    console.clear();
    console.log(BANNER);
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // Check for command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }
    if (args.includes('--monitor') || args.includes('-m')) {
        await runMonitor();
        return;
    }
    if (args.includes('--setup') || args.includes('-s')) {
        await runSetup();
        return;
    }
    if (args.includes('--quick')) {
        await quickJoin();
        return;
    }
    // Interactive main menu
    await showMainMenu();
}
function showHelp() {
    console.log(`
${chalk.bold('🐝 HIVEMIND CLI')} - Join the decentralized AI network

${chalk.bold('USAGE')}
  hivemind [OPTIONS]

${chalk.bold('OPTIONS')}
  --setup, -s      Interactive setup wizard
  --monitor, -m    Run in monitoring mode
  --quick          Quick join with default settings
  --dashboard      Open web dashboard in browser
  --status         Show current status
  --help, -h       Show this help message

${chalk.bold('EXAMPLES')}
  hivemind --setup          # Run the interactive setup wizard
  hivemind --monitor        # Monitor your contribution in real-time
  hivemind --dashboard      # Open the web dashboard
  hivemind --quick          # Join with default settings

${chalk.bold('DOCUMENTATION')}
  https://docs.hivemind.ai
  https://github.com/your-repo/hivemind
`);
}
async function showMainMenu() {
    console.log(chalk.dim('\nWhat would you like to do?\n'));
    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: chalk.white('Choose an action:'),
            choices: [
                {
                    name: `${chalk.green('🚀')} Join HIVEMIND - Contribute your compute`,
                    value: 'join'
                },
                {
                    name: `${chalk.blue('📊')} View Dashboard - Open web interface`,
                    value: 'dashboard'
                },
                {
                    name: `${chalk.yellow('⚙️')} Settings - Configure your contribution`,
                    value: 'settings'
                },
                {
                    name: `${chalk.red('❌')} Exit`,
                    value: 'exit'
                }
            ]
        }
    ]);
    switch (choice) {
        case 'join':
            await runSetup();
            break;
        case 'dashboard':
            await openDashboard();
            break;
        case 'settings':
            await showSettings();
            break;
        case 'exit':
            console.log(chalk.dim('\n👋 Thanks for checking out HIVEMIND!\n'));
            process.exit(0);
    }
}
async function runSetup() {
    console.clear();
    console.log(BANNER);
    const setup = new InteractiveSetup();
    await setup.run();
}
async function runMonitor() {
    console.clear();
    console.log(BANNER);
    const monitor = new Monitor();
    await monitor.run();
}
async function quickJoin() {
    console.clear();
    console.log(BANNER);
    console.log(chalk.yellow('\n🔒 Quick Join - Setting up with default security...\n'));
    // Quick setup with defaults
    const drone = new HiveDrone();
    await drone.start();
    console.log(chalk.green('\n✅ You are now connected to HIVEMIND!\n'));
    console.log(chalk.white('Press Ctrl+C to stop.\n'));
    // Keep alive
    await new Promise(() => { });
}
async function openDashboard() {
    console.log(chalk.blue('\nOpening dashboard...\n'));
    try {
        const { exec } = await import('child_process');
        const platform = process.platform;
        let command = 'open';
        if (platform === 'win32') {
            command = 'start';
        }
        else if (platform === 'linux') {
            command = 'xdg-open';
        }
        exec(command + ' http://localhost:3000');
        console.log(chalk.green('Dashboard should be opening in your browser.\n'));
    }
    catch (error) {
        console.log(chalk.yellow('Could not open browser automatically.'));
        console.log(chalk.white('Please open: http://localhost:3000\n'));
    }
}
async function showSettings() {
    console.log(chalk.yellow('\n⚙️ Settings - Coming soon!\n'));
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Go back to main menu?',
            default: true
        }
    ]);
    if (confirm) {
        await showMainMenu();
    }
}
// Run the CLI
main().catch(error => {
    console.error(chalk.red('\n❌ An error occurred:'), error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map