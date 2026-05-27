$ErrorActionPreference = "Stop"

Write-Host "1. Signing up a new tenant..."
$signup = @{
  tenantName = "Test Tenant"
  slug = "test-tenant-$(Get-Random)"
  adminEmail = "admin$(Get-Random)@test.com"
  adminPassword = "Password123!"
  adminFullName = "Admin User"
} | ConvertTo-Json

$signupResp = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method Post -ContentType "application/json" -Body $signup
$token = $signupResp.accessToken
Write-Host "Signup complete! Token received."

Write-Host "`n2. Testing Surface Lookup (Request 6) - Cache hit (Empire State)..."
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

$lookupBodyHit = @{
  coords = @{
    lat = 40.7484
    lon = -73.9857
  }
} | ConvertTo-Json

$lookupRespHit = Invoke-RestMethod -Uri "http://localhost:3000/projects/123e4567-e89b-12d3-a456-426614174000/surface/lookup" -Method Post -Headers $headers -Body $lookupBodyHit
Write-Host "Cache Hit Lookup Success! Response:"
$lookupRespHit | ConvertTo-Json

Write-Host "`n3. Testing Surface Lookup (Request 7) - Cache miss (Space Needle)..."
$lookupBodyMiss = @{
  coords = @{
    lat = 34.0522
    lon = -118.2437
  }
} | ConvertTo-Json

$lookupRespMiss = Invoke-RestMethod -Uri "http://localhost:3000/projects/123e4567-e89b-12d3-a456-426614174000/surface/lookup" -Method Post -Headers $headers -Body $lookupBodyMiss
Write-Host "Cache Miss Lookup Success! Response:"
$lookupRespMiss | ConvertTo-Json
