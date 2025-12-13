#!/bin/bash

# Bird API Explorer
# Quick scripts to explore Bird Conversations API
# Usage: Export BIRD_ACCESS_KEY and BIRD_WORKSPACE_ID before running

set -e

if [ -z "$BIRD_ACCESS_KEY" ] || [ -z "$BIRD_WORKSPACE_ID" ]; then
  echo "Error: Set BIRD_ACCESS_KEY and BIRD_WORKSPACE_ID environment variables"
  exit 1
fi

BASE_URL="https://api.bird.com/workspaces/$BIRD_WORKSPACE_ID"

# List conversations
list_conversations() {
  local limit=${1:-10}
  echo "Fetching last $limit conversations..."
  curl -s "$BASE_URL/conversations?limit=$limit" \
    -H "Authorization: AccessKey $BIRD_ACCESS_KEY" \
    -H "Content-Type: application/json" | jq '.'
}

# Get conversation messages
get_messages() {
  local conversation_id=$1
  local limit=${2:-10}

  if [ -z "$conversation_id" ]; then
    echo "Usage: get_messages <conversation_id> [limit]"
    exit 1
  fi

  echo "Fetching messages from conversation $conversation_id..."
  curl -s "$BASE_URL/conversations/$conversation_id/messages?limit=$limit" \
    -H "Authorization: AccessKey $BIRD_ACCESS_KEY" \
    -H "Content-Type: application/json" | jq '.'
}

# Get conversation details
get_conversation() {
  local conversation_id=$1

  if [ -z "$conversation_id" ]; then
    echo "Usage: get_conversation <conversation_id>"
    exit 1
  fi

  echo "Fetching conversation $conversation_id..."
  curl -s "$BASE_URL/conversations/$conversation_id" \
    -H "Authorization: AccessKey $BIRD_ACCESS_KEY" \
    -H "Content-Type: application/json" | jq '.'
}

# Main menu
case "${1:-}" in
  "conversations")
    list_conversations "${2:-10}"
    ;;
  "messages")
    get_messages "$2" "${3:-10}"
    ;;
  "conversation")
    get_conversation "$2"
    ;;
  *)
    echo "Bird API Explorer"
    echo ""
    echo "Usage:"
    echo "  $0 conversations [limit]           # List conversations"
    echo "  $0 messages <conv_id> [limit]      # Get conversation messages"
    echo "  $0 conversation <conv_id>          # Get conversation details"
    echo ""
    echo "Examples:"
    echo "  $0 conversations 5"
    echo "  $0 messages ef146edd-eff1-460d-b968-af87d1b63d62 10"
    ;;
esac
