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
export declare class InteractiveSetup {
    private config;
    private systemInfo;
    constructor();
    run(): Promise<void>;
    private welcome;
    private showSecurityInfo;
    private detectSystem;
    private configureResources;
    private setupAccount;
    private finalConfirmation;
    private saveAndStart;
}
//# sourceMappingURL=setup.d.ts.map