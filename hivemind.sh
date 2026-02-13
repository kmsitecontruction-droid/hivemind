#!/bin/bash
# HIVEMIND - One Script to Start Everything

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🐝  H I V E M I N D                                        ║"
echo "║                                                                ║"
echo "║   Decentralized AI Network - Starting...                     ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check if virtualenv exists
VENV="/tmp/hivemind-env/bin/python3"
if [ ! -f "$VENV" ]; then
    echo -e "${YELLOW}⚠️  Setting up Python environment...${NC}"
    cd /tmp
    python3 -m venv hivemind-env
    source hivemind-env/bin/activate
    pip install torch transformers accelerate websockets --quiet 2>/dev/null || true
else
    echo -e "${GREEN}✅ Python environment ready${NC}"
fi

# Use our venv
export PATH="/tmp/hivemind-env/bin:$PATH"

# Change to script directory
cd "$(dirname "$0")"

# Parse command
MODE="${1:-help}"

case "$MODE" in
    "start")
        echo -e "${GREEN}🚀 Starting HIVEMIND...${NC}"
        echo ""
        echo "Options:"
        echo "  • Run inference: python3 hivemind-cli.py infer \"Your prompt\""
        echo "  • List models:   python3 hivemind-cli.py list"
        echo "  • Start server: python3 hivemind-cli.py server"
        echo "  • Start worker: python3 hivemind-cli.py worker"
        echo ""
        python3 hivemind-cli.py status
        ;;
    
    "inference"|"infer")
        shift
        PROMPT="$*"
        if [ -z "$PROMPT" ]; then
            PROMPT="Hello, how are you?"
        fi
        echo -e "${GREEN}🧠 Running inference...${NC}"
        python3 hivemind-cli.py infer "$PROMPT"
        ;;
    
    "server")
        echo -e "${GREEN}🌐 Starting HIVEMIND Server...${NC}"
        python3 hivemind-cli.py server
        ;;
    
    "worker")
        SERVER="${2:-ws://localhost:3001}"
        echo -e "${GREEN}🐝 Starting HIVEMIND Worker...${NC}"
        echo "   Connecting to: $SERVER"
        python3 hivemind-cli.py worker "$SERVER"
        ;;
    
    "download")
        MODEL="${2:-tinyllama-1.1b}"
        echo -e "${GREEN}⬇️  Downloading $MODEL...${NC}"
        python3 hivemind-cli.py download "$MODEL"
        ;;
    
    "test")
        echo -e "${GREEN}🧪 Running tests...${NC}"
        python3 hivemind-cli.py test
        ;;
    
    *)
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start              - Show status and options"
        echo "  infer [prompt]    - Run AI inference"
        echo "  server             - Start a HIVEMIND server"
        echo "  worker [url]      - Start a worker"
        echo "  download [model]  - Download AI model"
        echo "  test               - Run test inference"
        echo ""
        echo "Examples:"
        echo "  $0 infer \"Hello AI!\""
        echo "  $0 download qwen-2.5-1.5b"
        echo "  $0 server"
        echo "  $0 worker ws://localhost:3001"
        echo ""
        echo "Models: tinyllama-1.1b, qwen-2.5-1.5b, llama-3.2-1b, llama-3.2-3b, phi-3-mini, gemma-2b"
        ;;
esac
