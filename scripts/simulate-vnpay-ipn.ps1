<#
.SYNOPSIS
    Kịch bản PowerShell mô phỏng IPN VNPay gửi về Backend MadK-Store cho môi trường Local.
.DESCRIPTION
    Script này hỗ trợ gửi payload IPN giả lập để kiểm thử:
    - IPN Thành công (ResponseCode 00, TransactionStatus 00)
    - IPN Thất bại (ResponseCode 24 - khách hủy giao dịch)
    - Thử nghiệm Idempotency (gọi 2 lần cùng một mã đơn)
    - Thử nghiệm Sai số tiền (Amount mismatch)
.EXAMPLE
    .\scripts\simulate-vnpay-ipn.ps1 -OrderNumber "ORD-20261015-001" -Amount 500000
    .\scripts\simulate-vnpay-ipn.ps1 -OrderNumber "ORD-20261015-001" -Amount 500000 -Fail
    .\scripts\simulate-vnpay-ipn.ps1 -OrderNumber "ORD-20261015-001" -Amount 500000 -TestIdempotent
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$OrderNumber,

    [Parameter(Mandatory = $true)]
    [decimal]$Amount,

    [string]$BaseUrl = "http://localhost:5000",

    [switch]$Fail,

    [switch]$TestIdempotent
)

$apiUrl = "$BaseUrl/api/v1/payments/vnpay/simulate-ipn"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " VNPay Sandbox IPN Simulator - MadK-Store" -ForegroundColor Cyan
Write-Host " Target API: $apiUrl" -ForegroundColor Gray
Write-Host " Order Number: $OrderNumber | Amount: $Amount VND" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$body = @{
    orderNumber = $OrderNumber
    amount = $Amount
    isSuccess = (-not $Fail)
} | ConvertTo-Json

try {
    Write-Host "`n[Step 1] Gửi IPN lần 1..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body $body
    Write-Host "Kết quả:" -ForegroundColor Green
    $response | Format-List

    if ($TestIdempotent) {
        Write-Host "`n[Step 2] Thử gửi IPN lần 2 (Kiểm tra Idempotency)..." -ForegroundColor Yellow
        $response2 = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body $body
        Write-Host "Kết quả lần 2 (Mong đợi RspCode 02):" -ForegroundColor Green
        $response2 | Format-List
        if ($response2.rspCode -eq "02") {
            Write-Host "=> PASS: Hệ thống đã chặn xử lý lặp lại thành công (Idempotent OK)!" -ForegroundColor Green
        } else {
            Write-Host "=> CẢNH BÁO: RspCode nhận được là $($response2.rspCode)" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "Lỗi khi gọi API: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response body: $($reader.ReadToEnd())" -ForegroundColor Red
    }
}
