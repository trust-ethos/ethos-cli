#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Building Docker test image..."
docker build -t ethos-update-test -f "$SCRIPT_DIR/Dockerfile.update-test" "$SCRIPT_DIR"

echo ""
echo "Running update tests in Docker container..."
echo ""

docker run --rm \
    -v "$SCRIPT_DIR/test-update.sh:/home/testuser/test-update.sh:ro" \
    ethos-update-test \
    bash /home/testuser/test-update.sh

echo ""
echo "Docker test completed successfully!"
