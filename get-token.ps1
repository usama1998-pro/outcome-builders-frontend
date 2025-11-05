# PowerShell script to get JWT token from backend
# Usage: .\get-token.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Outcome Builder - Token Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "http://localhost:8000/api/v1/user/signin"
$email = Read-Host "Enter your email (e.g., usama@acme.com)"
$password = Read-Host "Enter your password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host ""
Write-Host "Requesting token from backend..." -ForegroundColor Yellow

try {
    # Make the API request
    $body = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $apiUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    # Extract token
    if ($response.data.token) {
        $token = $response.data.token
        
        Write-Host ""
        Write-Host "✅ Success! Token received." -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Your JWT Token:" -ForegroundColor Yellow
        Write-Host $token -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Copy the token above" -ForegroundColor White
        Write-Host "2. Open .env.local file (create if it doesn't exist)" -ForegroundColor White
        Write-Host "3. Add or update this line:" -ForegroundColor White
        Write-Host "   NEXT_PUBLIC_STATIC_TOKEN=$token" -ForegroundColor Gray
        Write-Host "4. Restart your dev server (npm run dev)" -ForegroundColor White
        Write-Host ""
        
        # Optionally copy to clipboard
        $copyToClipboard = Read-Host "Copy token to clipboard? (y/n)"
        if ($copyToClipboard -eq "y") {
            $token | Set-Clipboard
            Write-Host "✅ Token copied to clipboard!" -ForegroundColor Green
        }
        
    } else {
        Write-Host "❌ Error: No token in response" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
    }

} catch {
    Write-Host ""
    Write-Host "❌ Error: Failed to get token" -ForegroundColor Red
    Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "- Is your backend running? (check http://localhost:8000)" -ForegroundColor White
    Write-Host "- Are your credentials correct?" -ForegroundColor White
    Write-Host "- Check backend logs for errors" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

