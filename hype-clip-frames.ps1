# hype-clip-frames.ps1 - generates intro/outro title cards for the hype video
# (same visual system as round-poster.ps1). All Thai copy in hype-clip-frames-data.json.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root     = $PSScriptRoot
$dataPath = Join-Path $root 'hype-clip-frames-data.json'
$logoPath = Join-Path $root 'assets\img\bla-league.png'
$outDir   = Join-Path $root 'assets\img\round-posters'

$jsonText = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
$data = $jsonText | ConvertFrom-Json

$W = 1080; $H = 1350
$fontFamily = 'Leelawadee UI'

$bgTop      = [System.Drawing.Color]::FromArgb(255, 10, 29, 66)
$bgBot      = [System.Drawing.Color]::FromArgb(255, 5, 12, 33)
$white      = [System.Drawing.Color]::White
$muted      = [System.Drawing.Color]::FromArgb(255, 165, 185, 220)
$blueBright = [System.Drawing.Color]::FromArgb(255, 77, 163, 255)
$gold       = [System.Drawing.Color]::FromArgb(255, 242, 184, 7)
$goldSoft   = [System.Drawing.Color]::FromArgb(255, 255, 216, 106)

function New-Canvas {
  $canvas = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.InterpolationMode = 'HighQualityBicubic'
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0,0), (New-Object System.Drawing.Point 0,$H), $bgTop, $bgBot)
  $g.FillRectangle($bgBrush, 0, 0, $W, $H)
  return @{ canvas = $canvas; g = $g }
}
function Add-RoundedRect($path,$rect,$radius){
  $d = $radius*2
  $path.AddArc($rect.X,$rect.Y,$d,$d,180,90)
  $path.AddArc($rect.Right-$d,$rect.Y,$d,$d,270,90)
  $path.AddArc($rect.Right-$d,$rect.Bottom-$d,$d,$d,0,90)
  $path.AddArc($rect.X,$rect.Bottom-$d,$d,$d,90,90)
  $path.CloseFigure()
}
function Draw-RoundedFill($g,$rect,$radius,$brush){
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundedRect $p $rect $radius
  $g.FillPath($brush,$p)
}
function Draw-RoundedStroke($g,$rect,$radius,$pen){
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundedRect $p $rect $radius
  $g.DrawPath($pen,$p)
}

$sfC = New-Object System.Drawing.StringFormat
$sfC.Alignment = [System.Drawing.StringAlignment]::Center

# ===================== INTRO FRAME =====================
$cv = New-Canvas; $g = $cv.g

if (Test-Path $logoPath) {
  $logo = [System.Drawing.Image]::FromFile($logoPath)
  $lh = 140; $lw = [int]($lh * $logo.Width / $logo.Height)
  $g.DrawImage($logo, [int](($W-$lw)/2), 170, $lw, $lh)
  $logo.Dispose()
}

$eyebrowFont = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Bold)
$g.DrawString('BURIRAM LEAGUE ACADEMY', $eyebrowFont, (New-Object System.Drawing.SolidBrush $blueBright), (New-Object System.Drawing.RectangleF 0,344,$W,30), $sfC)

$badgeFont = New-Object System.Drawing.Font($fontFamily, 17, [System.Drawing.FontStyle]::Bold)
$bSize = $g.MeasureString($data.roundLabel, $badgeFont)
$bW = [int]$bSize.Width + 70; $bH = 56
$bX = [int](($W-$bW)/2); $bY = 392
Draw-RoundedFill $g (New-Object System.Drawing.Rectangle $bX,$bY,$bW,$bH) 28 (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40,242,184,7)))
Draw-RoundedStroke $g (New-Object System.Drawing.Rectangle $bX,$bY,$bW,$bH) 28 (New-Object System.Drawing.Pen $gold, 1.5)
$g.DrawString($data.roundLabel, $badgeFont, (New-Object System.Drawing.SolidBrush $goldSoft), ([float]($bX+($bW-$bSize.Width)/2)), ([float]($bY+($bH-$bSize.Height)/2)))

$titleFont = New-Object System.Drawing.Font($fontFamily, 62, [System.Drawing.FontStyle]::Bold)
$g.DrawString($data.introTitle, $titleFont, (New-Object System.Drawing.SolidBrush $gold), (New-Object System.Drawing.RectangleF 40,560,($W-80),160), $sfC)

$sub1Font = New-Object System.Drawing.Font($fontFamily, 30, [System.Drawing.FontStyle]::Bold)
$g.DrawString($data.introSub1, $sub1Font, (New-Object System.Drawing.SolidBrush $white), (New-Object System.Drawing.RectangleF 40,760,($W-80),50), $sfC)

$sub2Font = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Regular)
$g.DrawString($data.introSub2, $sub2Font, (New-Object System.Drawing.SolidBrush $muted), (New-Object System.Drawing.RectangleF 40,822,($W-80),40), $sfC)

$introOut = Join-Path $outDir 'hype-intro.jpg'
$cv.canvas.Save($introOut, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$cv.g.Dispose(); $cv.canvas.Dispose()
Write-Host "wrote $introOut"

# ===================== OUTRO FRAME =====================
$cv = New-Canvas; $g = $cv.g

if (Test-Path $logoPath) {
  $logo = [System.Drawing.Image]::FromFile($logoPath)
  $lh = 110; $lw = [int]($lh * $logo.Width / $logo.Height)
  $g.DrawImage($logo, [int](($W-$lw)/2), 130, $lw, $lh)
  $logo.Dispose()
}

$outTitleFont = New-Object System.Drawing.Font($fontFamily, 66, [System.Drawing.FontStyle]::Bold)
$g.DrawString($data.outroTitle, $outTitleFont, (New-Object System.Drawing.SolidBrush $gold), (New-Object System.Drawing.RectangleF 40,330,($W-80),120), $sfC)

$od1Font = New-Object System.Drawing.Font($fontFamily, 27, [System.Drawing.FontStyle]::Bold)
$g.DrawString($data.outroSub1, $od1Font, (New-Object System.Drawing.SolidBrush $white), (New-Object System.Drawing.RectangleF 60,500,($W-120),50), $sfC)

$od2Font = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Bold)
$chipText = $data.outroSub2
$chipSize = $g.MeasureString($chipText, $od2Font)
$chipW = [int]$chipSize.Width + 90; $chipH = 70
$chipX = [int](($W-$chipW)/2); $chipY = 566
Draw-RoundedFill $g (New-Object System.Drawing.Rectangle $chipX,$chipY,$chipW,$chipH) 24 (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45,242,184,7)))
Draw-RoundedStroke $g (New-Object System.Drawing.Rectangle $chipX,$chipY,$chipW,$chipH) 24 (New-Object System.Drawing.Pen $gold, 1.5)
$g.DrawString($chipText, $od2Font, (New-Object System.Drawing.SolidBrush $goldSoft), ([float]($chipX+($chipW-$chipSize.Width)/2)), ([float]($chipY+($chipH-$chipSize.Height)/2)))

$od3Font = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Regular)
$g.DrawString($data.outroSub3, $od3Font, (New-Object System.Drawing.SolidBrush $muted), (New-Object System.Drawing.RectangleF 60,680,($W-120),80), $sfC)

$outroOut = Join-Path $outDir 'hype-outro.jpg'
$cv.canvas.Save($outroOut, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$cv.g.Dispose(); $cv.canvas.Dispose()
Write-Host "wrote $outroOut"
