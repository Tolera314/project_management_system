#!/bin/bash
# Run from the repo root on a machine with git available:
#   bash scripts/purge_history.sh
#
# Then force-push to remote:
#   git push origin --force --all
#   git push origin --force --tags

set -e
cd "$(git rev-parse --show-toplevel)"

echo "==> Removing sensitive files from all git history..."
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
  --index-filter 'git rm -r --cached --ignore-unmatch \
    backend/.env \
    frontend/.env \
    documents/ \
    deployment_guide.md \
    frontend/README.md' \
  --prune-empty \
  --tag-name-filter cat \
  -- --all

echo "==> Cleaning up git refs..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ History rewrite complete."
echo ""
echo "==> IMPORTANT: Force-push to remote to apply:"
echo "    git push origin --force --all"
echo "    git push origin --force --tags"
echo ""
echo "⚠️  All collaborators must re-clone the repository after this operation."
