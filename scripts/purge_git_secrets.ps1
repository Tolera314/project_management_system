# purge_git_secrets.ps1
# Run this script from the repository root to remove all sensitive files
# from the ENTIRE Git history across ALL branches.
#
# After running:
#   git push origin --force --all
#   git push origin --force --tags
#
# All collaborators MUST re-clone after this operation.

$ErrorActionPreference = "Continue"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$filesToPurge = @(
    "backend/.env",
    "frontend/.env",
    "documents/README.md",
    "documents/build_plan.md",
    "documents/white_box_testing_report.md",
    "deployment_guide.md",
    "frontend/README.md"
)

$filterArg = ($filesToPurge | ForEach-Object { "`"$_`"" }) -join " "
$indexFilter = "git rm -r --cached --ignore-unmatch $filterArg"

Write-Host "==> Rewriting git history to remove sensitive files across ALL branches..." -ForegroundColor Yellow
$env:FILTER_BRANCH_SQUELCH_WARNING = "1"

# Run filter-branch once across all branches and tags
& git filter-branch --force --index-filter $indexFilter --prune-empty --tag-name-filter cat -- --all 2>&1 | ForEach-Object {
    Write-Host $_
}

Write-Host ""
Write-Host "==> Cleaning up refs and running aggressive GC..." -ForegroundColor Yellow
git for-each-ref --format="%(refname)" refs/original/ | ForEach-Object {
    git update-ref -d $_ 2>&1 | Out-Null
}
git reflog expire --expire=now --all 2>&1 | Out-Null
git gc --prune=now --aggressive 2>&1

Write-Host ""
Write-Host "==> Verifying backend/.env no longer in history..." -ForegroundColor Yellow
$check = git log --all --oneline -- backend/.env
if ($check) {
    Write-Host "WARNING: backend/.env still found in commits:" -ForegroundColor Red
    Write-Host $check
} else {
    Write-Host "CONFIRMED: backend/.env removed from all history." -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " History rewrite complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Force-push all branches to remote:"
Write-Host "       git push origin --force --all"
Write-Host "       git push origin --force --tags"
Write-Host ""
Write-Host "  2. Rotate ALL compromised credentials:"
Write-Host "       - Neon database password"
Write-Host "       - JWT_SECRET (generate new 64-byte random key)"
Write-Host "       - Brevo SMTP password"
Write-Host "       - Cloudinary API secret"
Write-Host "       - Google OAuth client secret"
Write-Host ""
Write-Host "  3. Notify all team members to re-clone the repository."
Write-Host ""
Write-Host "  IMPORTANT: GitHub may cache old objects for up to 90 days."
Write-Host "  Open a GitHub support ticket to expedite cache invalidation."
