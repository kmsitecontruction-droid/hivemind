/**
 * HIVEMIND HTTP Server
 * REST API for web and mobile clients
 */
import express from 'express';
import cors from 'cors';
export function createHttpServer(options) {
    const app = express();
    // Middleware
    app.use(cors());
    app.use(express.json());
    // Request logging
    app.use((req, res, next) => {
        console.log(`[HTTP] ${req.method} ${req.path}`);
        next();
    });
    // ============ AUTH ENDPOINTS ============
    app.post('/api/auth/register', (req, res) => {
        try {
            const { username, email, password } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const { user, token } = options.auth.register(username, email, password);
            res.json({
                success: true,
                user: sanitizeUser(user),
                token
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
        }
    });
    app.post('/api/auth/login', (req, res) => {
        try {
            const { username, email, password } = req.body;
            if (!password || (!username && !email)) {
                return res.status(400).json({ error: 'Missing credentials' });
            }
            const loginUser = username || email;
            const result = options.auth.login(loginUser, password);
            res.json({
                success: true,
                user: sanitizeUser(result.user),
                token: result.token
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
    app.get('/api/auth/me', (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }
            const session = options.auth.verifyToken(token);
            if (!session) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            const user = options.auth.getUserById(session.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, user: sanitizeUser(user) });
        }
        catch (error) {
            console.error('Auth verification error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });
    // ============ USER ENDPOINTS ============
    app.get('/api/users', (req, res) => {
        try {
            // TODO: Add admin authentication check
            const users = options.auth.getAllUsers();
            res.json({ success: true, users: users.map(sanitizeUser) });
        }
        catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    });
    app.get('/api/users/:id', (req, res) => {
        try {
            const user = options.auth.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, user: sanitizeUser(user) });
        }
        catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    });
    // ============ CREDIT ENDPOINTS ============
    app.get('/api/credits/:userId', (req, res) => {
        try {
            const balance = options.credits.getBalance(req.params.userId);
            res.json({ success: true, credits: balance });
        }
        catch (error) {
            console.error('Get credits error:', error);
            res.status(500).json({ error: 'Failed to get credits' });
        }
    });
    app.get('/api/credits/:userId/history', (req, res) => {
        try {
            const history = options.credits.getTransactionHistory(req.params.userId);
            res.json({ success: true, history });
        }
        catch (error) {
            console.error('Get credit history error:', error);
            res.status(500).json({ error: 'Failed to get history' });
        }
    });
    // ============ WORKER ENDPOINTS ============
    app.get('/api/workers', (req, res) => {
        try {
            const workers = options.workers.getAllWorkers();
            res.json({ success: true, workers });
        }
        catch (error) {
            console.error('Get workers error:', error);
            res.status(500).json({ error: 'Failed to get workers' });
        }
    });
    app.get('/api/workers/online', (req, res) => {
        try {
            const workers = options.workers.getAvailableWorkers();
            res.json({ success: true, workers });
        }
        catch (error) {
            console.error('Get online workers error:', error);
            res.status(500).json({ error: 'Failed to get workers' });
        }
    });
    app.get('/api/workers/stats', (req, res) => {
        try {
            const stats = options.workers.getStats();
            res.json({ success: true, stats });
        }
        catch (error) {
            console.error('Get worker stats error:', error);
            res.status(500).json({ error: 'Failed to get stats' });
        }
    });
    // ============ TASK ENDPOINTS ============
    app.get('/api/tasks', (req, res) => {
        try {
            const { userId, status, limit } = req.query;
            let tasks;
            if (userId) {
                tasks = options.tasks.getByUser(userId);
            }
            else if (status) {
                tasks = options.tasks.getByStatus(status);
            }
            else {
                tasks = options.tasks.getAll();
            }
            if (limit) {
                tasks = tasks.slice(0, parseInt(limit));
            }
            res.json({ success: true, tasks });
        }
        catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ error: 'Failed to get tasks' });
        }
    });
    app.get('/api/tasks/:id', (req, res) => {
        try {
            const task = options.tasks.getById(req.params.id);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ success: true, task });
        }
        catch (error) {
            console.error('Get task error:', error);
            res.status(500).json({ error: 'Failed to get task' });
        }
    });
    app.post('/api/tasks', (req, res) => {
        try {
            const { userId, type, prompt, maxTokens, priority } = req.body;
            if (!userId || !type || !prompt) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // Check user has enough credits
            const creditEstimate = estimateTaskCredits(type, prompt);
            const balance = options.credits.getBalance(userId);
            if (balance < creditEstimate) {
                return res.status(400).json({ error: 'Insufficient credits', required: creditEstimate, current: balance });
            }
            const task = options.tasks.create(userId, {
                type,
                inputData: { prompt, maxTokens },
                creditsEstimate: creditEstimate,
                priority: priority || 1
            });
            // Deduct credits
            options.credits.spend(userId, creditEstimate, `Task: ${task.id}`);
            res.json({ success: true, task, creditsDeducted: creditEstimate });
        }
        catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create task' });
        }
    });
    app.get('/api/tasks/stats', (req, res) => {
        try {
            const stats = options.tasks.getStats();
            res.json({ success: true, stats });
        }
        catch (error) {
            console.error('Get task stats error:', error);
            res.status(500).json({ error: 'Failed to get stats' });
        }
    });
    // ============ STATS ENDPOINTS ============
    app.get('/api/stats', (req, res) => {
        try {
            const workerStats = options.workers.getStats();
            const taskStats = options.tasks.getStats();
            const totalUsers = options.auth.getAllUsers().length;
            res.json({
                success: true,
                stats: {
                    users: totalUsers,
                    workers: workerStats,
                    tasks: taskStats
                }
            });
        }
        catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to get stats' });
        }
    });
    // ============ NETWORK ENDPOINTS ============
    app.get('/api/network/status', (req, res) => {
        try {
            const workers = options.workers.getStats();
            const tasks = options.tasks.getStats();
            const users = options.auth.getAllUsers();
            res.json({
                success: true,
                status: {
                    onlineWorkers: workers.online,
                    totalWorkers: workers.total,
                    pendingTasks: tasks.pending,
                    runningTasks: tasks.running,
                    completedTasks: tasks.completed,
                    totalUsers: users.length,
                    totalCredits: users.reduce((sum, u) => sum + (u.credits || 0), 0)
                }
            });
        }
        catch (error) {
            console.error('Get network status error:', error);
            res.status(500).json({ error: 'Failed to get status' });
        }
    });
    // Error handler
    app.use((err, req, res, next) => {
        console.error('HTTP error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
    return app;
}
// Helper functions
function sanitizeUser(user) {
    if (!user)
        return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
}
function estimateTaskCredits(type, prompt) {
    // Simple credit estimation based on prompt length and type
    const baseCredits = {
        'inference': 1,
        'embedding': 2,
        'tokenization': 0.5,
        'training': 5
    };
    const base = baseCredits[type] || 1;
    const lengthMultiplier = Math.ceil(prompt.length / 1000);
    return base * lengthMultiplier;
}
//# sourceMappingURL=http.js.map