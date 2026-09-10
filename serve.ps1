# รันเว็บพรีวิวแบบสแตติกที่ http://127.0.0.1:8080 (ไม่มีขั้นตอน build)
# ใช้: PowerShell -ExecutionPolicy Bypass -File serve.ps1

$root = $PSScriptRoot
$port = 8080

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".htm"  = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".webp" = "image/webp"
  ".woff" = "font/woff"
  ".woff2" = "font/woff2"
  ".mp4"  = "video/mp4"
  ".txt"  = "text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
  $listener.Start()
} catch {
  Write-Host "เปิดพอร์ต $port ไม่ได้ (อาจถูกใช้งานอยู่แล้ว): $_"
  exit 1
}

Write-Host "กำลังให้บริการ $root"
Write-Host "เปิดเบราว์เซอร์ที่ http://127.0.0.1:$port  (กด Ctrl+C เพื่อหยุด)"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $localPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
    if ($localPath -eq "/") { $localPath = "/index.html" }

    $filePath = Join-Path $root ($localPath.TrimStart("/"))
    $fullRoot = [System.IO.Path]::GetFullPath($root)
    $fullFile = [System.IO.Path]::GetFullPath($filePath)

    if ((Test-Path $fullFile -PathType Leaf) -and $fullFile.StartsWith($fullRoot)) {
      $ext = [System.IO.Path]::GetExtension($fullFile).ToLower()
      $contentType = $mime[$ext]
      if (-not $contentType) { $contentType = "application/octet-stream" }

      $bytes = [System.IO.File]::ReadAllBytes($fullFile)
      $response.ContentType = $contentType
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }

    $response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
