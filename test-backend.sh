#!/bin/bash
echo "=== Testing Backend API ==="
echo "Sending test request to backend..."
curl -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com","pageTitle":"Test Page","tags":["test"]}' http://localhost:3001/api/v1/urls
echo -e "

=== Test Complete ==="
