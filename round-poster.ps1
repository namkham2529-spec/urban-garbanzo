# round-poster.ps1 - Buriram League Academy round-summary + per-match posters
# Same visual system as the BLA website: dark navy bg, gold/blue-bright accents.
# All Thai copy lives in round-poster-data.json (read explicitly as UTF-8 to avoid
# PS 5.1's codepage-based script parsing mangling Thai text embedded in a .ps1 source file).
param(
  [string]$DataFile = "round-poster-data.json"
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root     = $PSScriptRoot
$dataPath = Join-Path $root $DataFile
$teamsDir = Join-Path $root 'assets\img\teams'
$logoPath = Join-Path $root 'assets\img\bla-league.png'
$outDir   = Join-Path $root 'assets\img\round-posters'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$jsonText = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
$data = $jsonText | ConvertFrom-Json

$W = 1080; $H = 1350
$fontFamily = 'Leelawadee UI'

# ---- palette (matches assets/css/style.css :root) ----
$bgTop      = [System.Drawing.Color]::FromArgb(255, 10, 29, 66)    # --panel-ish navy
$bgBot      = [System.Drawing.Color]::FromArgb(255, 5, 12, 33)     # --bg deep navy
$panelTop   = [System.Drawing.Color]::FromArgb(255, 20, 46, 92)
$panelBot   = [System.Drawing.Color]::FromArgb(255, 12, 33, 73)
$line       = [System.Drawing.Color]::FromArgb(60, 255, 255, 255)
$white      = [System.Drawing.Color]::White
$muted      = [System.Drawing.Color]::FromArgb(255, 165, 185, 220)
$blueBright = [System.Drawing.Color]::FromArgb(255, 77, 163, 255)
$gold       = [System.Drawing.Color]::FromArgb(255, 242, 184, 7)
$goldSoft   = [System.Drawing.Color]::FromArgb(255, 255, 216, 106)

function New-Canvas([int]$height = $H) {
  $canvas = New-Object System.Drawing.Bitmap $W, $height
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.InterpolationMode = 'HighQualityBicubic'
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0,0), (New-Object System.Drawing.Point 0,$height), $bgTop, $bgBot)
  $g.FillRectangle($bgBrush, 0, 0, $W, $height)
  return @{ canvas = $canvas; g = $g; h = $height }
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
function Draw-CrestCircle($g,$cx,$cy,$r,$slug){
  $rect = New-Object System.Drawing.Rectangle ($cx-$r),($cy-$r),(2*$r),(2*$r)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70,0,0,0))), ($cx-$r+2),($cy-$r+3),(2*$r),(2*$r))
  $g.FillEllipse([System.Drawing.Brushes]::White, $rect)
  $logoFile = Join-Path $teamsDir "$slug.png"
  if (Test-Path $logoFile) {
    $img = [System.Drawing.Image]::FromFile($logoFile)
    $clip = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clip.AddEllipse($rect)
    $old = $g.Clip
    $g.SetClip($clip, [System.Drawing.Drawing2D.CombineMode]::Intersect)
    $side = [Math]::Min($img.Width, $img.Height)
    $sx = [int](($img.Width-$side)/2); $sy = [int](($img.Height-$side)/2)
    $pad = [int]($r*0.12)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle ($cx-$r+$pad),($cy-$r+$pad),(2*$r-2*$pad),(2*$r-2*$pad)), $sx,$sy,$side,$side,[System.Drawing.GraphicsUnit]::Pixel)
    $g.Clip = $old
    $img.Dispose()
  }
  $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,225,230,238)), 2
  $g.DrawEllipse($ringPen, $rect)
}
function Draw-Header($g, $roundLabel, $headline, $dateLine, $brandThai){
  if (Test-Path $logoPath) {
    $logo = [System.Drawing.Image]::FromFile($logoPath)
    $lh = 72; $lw = [int]($lh * $logo.Width / $logo.Height)
    $g.DrawImage($logo, 64, 56, $lw, $lh)
    $logo.Dispose()
  }
  $eyebrowFont = New-Object System.Drawing.Font($fontFamily, 15, [System.Drawing.FontStyle]::Bold)
  $brandFont   = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Bold)
  $g.DrawString('BURIRAM LEAGUE ACADEMY', $eyebrowFont, (New-Object System.Drawing.SolidBrush $blueBright), 150, 60)
  $g.DrawString($brandThai, $brandFont, (New-Object System.Drawing.SolidBrush $white), 150, 84)

  $badgeFont = New-Object System.Drawing.Font($fontFamily, 16, [System.Drawing.FontStyle]::Bold)
  $bSize = $g.MeasureString($roundLabel, $badgeFont)
  $bW = [int]$bSize.Width + 44; $bH = 46
  $bX = $W - $bW - 60; $bY = 64
  Draw-RoundedFill $g (New-Object System.Drawing.Rectangle $bX,$bY,$bW,$bH) 23 (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40,242,184,7)))
  Draw-RoundedStroke $g (New-Object System.Drawing.Rectangle $bX,$bY,$bW,$bH) 23 (New-Object System.Drawing.Pen $gold, 1.5)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $gold), $bX+18, $bY+20, 8, 8)
  $g.DrawString($roundLabel, $badgeFont, (New-Object System.Drawing.SolidBrush $goldSoft), $bX+34, $bY+13)

  $headFont = New-Object System.Drawing.Font($fontFamily, 48, [System.Drawing.FontStyle]::Bold)
  $g.DrawString($headline, $headFont, (New-Object System.Drawing.SolidBrush $gold), 64, 160)
  $dateFont = New-Object System.Drawing.Font($fontFamily, 20, [System.Drawing.FontStyle]::Regular)
  $g.DrawString($dateLine, $dateFont, (New-Object System.Drawing.SolidBrush $muted), 64, 230)
}
function Draw-Footer($g, $note, $fb, [int]$height = $H){
  $y = $height - 86
  $g.DrawLine((New-Object System.Drawing.Pen $line, 1), 64, $y, $W-64, $y)
  $noteFont = New-Object System.Drawing.Font($fontFamily, 15, [System.Drawing.FontStyle]::Regular)
  $fbFont   = New-Object System.Drawing.Font($fontFamily, 15, [System.Drawing.FontStyle]::Bold)
  $g.DrawString($note, $noteFont, (New-Object System.Drawing.SolidBrush $muted), 64, $y+20)
  $fbSize = $g.MeasureString($fb, $fbFont)
  $g.DrawString($fb, $fbFont, (New-Object System.Drawing.SolidBrush $goldSoft), ($W-64-$fbSize.Width), $y+46)
}

# ===================== 1) SUMMARY POSTER (all 6 matches) =====================
$summaryH = 290 + ($data.matches.Count * (172+16)) + 110
$cv = New-Canvas $summaryH; $g = $cv.g
Draw-Header $g $data.roundLabel $data.headline $data.dateLine $data.brandThai

$al = $data.ageLabels
$sep = $data.sep

$rowY = 290; $rowH = 172; $rowGap = 16; $rowX = 64; $rowW = $W - 2*$rowX
$numFont  = New-Object System.Drawing.Font($fontFamily, 14, [System.Drawing.FontStyle]::Bold)
$nameFont = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Bold)
$vsFont   = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
$venueFont= New-Object System.Drawing.Font($fontFamily, 14, [System.Drawing.FontStyle]::Regular)
$i = 1
foreach ($m in $data.matches) {
  $rect = New-Object System.Drawing.Rectangle $rowX, $rowY, $rowW, $rowH
  $pb = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point $rowX,$rowY), (New-Object System.Drawing.Point $rowX,($rowY+$rowH)), $panelTop, $panelBot)
  Draw-RoundedFill $g $rect 18 $pb
  Draw-RoundedStroke $g $rect 18 (New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90,150,200,255)), 1.2)

  $numCircleR = 16
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(50,255,255,255))), ($rowX+20),($rowY+20),($numCircleR*2),($numCircleR*2))
  $nSize = $g.MeasureString("$i", $numFont)
  $g.DrawString("$i", $numFont, (New-Object System.Drawing.SolidBrush $white), ($rowX+20+$numCircleR-$nSize.Width/2), ($rowY+20+$numCircleR-$nSize.Height/2))

  $cy = $rowY + 46
  $awayCrestX = $rowX + $rowW - 56
  Draw-CrestCircle $g ($rowX+100) $cy 28 $m.homeSlug
  $homeRect = New-Object System.Drawing.RectangleF ($rowX+140), ($cy-14), 330, 30
  $g.DrawString($m.home, $nameFont, (New-Object System.Drawing.SolidBrush $white), $homeRect)

  $vsSize = $g.MeasureString($data.vsLabel, $vsFont)
  $g.DrawString($data.vsLabel, $vsFont, (New-Object System.Drawing.SolidBrush $muted), ($rowX+$rowW/2-$vsSize.Width/2), ($cy-9))

  Draw-CrestCircle $g $awayCrestX $cy 28 $m.awaySlug
  $awayRect = New-Object System.Drawing.RectangleF ($awayCrestX-28-250-12), ($cy-14), 250, 30
  $sfRight = New-Object System.Drawing.StringFormat
  $sfRight.Alignment = [System.Drawing.StringAlignment]::Far
  $g.DrawString($m.away, $nameFont, (New-Object System.Drawing.SolidBrush $white), $awayRect, $sfRight)

  $g.DrawString($m.venue, $venueFont, (New-Object System.Drawing.SolidBrush $muted), ($rowX+24), ($rowY+$rowH-78))
  $ml = if ($m.labels) { $m.labels } else { $al }
  $timeStr = "$($ml.U14) $($m.times.U14)$sep$($ml.U12) $($m.times.U12)$sep$($ml.parent) $($m.times.parent)$sep$($ml.U10) $($m.times.U10)$sep$($ml.U8) $($m.times.U8)"
  $tFont = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Regular)
  $tRect = New-Object System.Drawing.RectangleF ($rowX+24), ($rowY+$rowH-50), ($rowW-48), 44
  $g.DrawString($timeStr, $tFont, (New-Object System.Drawing.SolidBrush $goldSoft), $tRect)

  $rowY += $rowH + $rowGap
  $i++
}
Draw-Footer $g $data.footerNote $data.footerFb $summaryH

$summaryOut = Join-Path $outDir ("round{0}-summary.jpg" -f $data.round)
$cv.canvas.Save($summaryOut, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$cv.g.Dispose(); $cv.canvas.Dispose()
Write-Host "wrote $summaryOut"

# ===================== 2) PER-MATCH POSTERS =====================
$matchH = 1000
$mi = 1
foreach ($m in $data.matches) {
  $cv = New-Canvas $matchH; $g = $cv.g
  Draw-Header $g $data.roundLabel $data.headline $data.dateLine $data.brandThai

  $cardY = 300; $cardH = 420; $cardX = 64; $cardW = $W - 2*$cardX
  $cardRect = New-Object System.Drawing.Rectangle $cardX,$cardY,$cardW,$cardH
  $pb = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point $cardX,$cardY), (New-Object System.Drawing.Point $cardX,($cardY+$cardH)), $panelTop, $panelBot)
  Draw-RoundedFill $g $cardRect 26 $pb
  Draw-RoundedStroke $g $cardRect 26 (New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90,150,200,255)), 1.4)

  $bigR = 92
  $midY = $cardY + 150
  Draw-CrestCircle $g ($cardX+190) $midY $bigR $m.homeSlug
  Draw-CrestCircle $g ($cardX+$cardW-190) $midY $bigR $m.awaySlug

  $vsFontBig = New-Object System.Drawing.Font($fontFamily, 26, [System.Drawing.FontStyle]::Bold)
  $vsSize = $g.MeasureString('VS', $vsFontBig)
  $g.DrawString('VS', $vsFontBig, (New-Object System.Drawing.SolidBrush $gold), ($cardX+$cardW/2-$vsSize.Width/2), ($midY-$vsSize.Height/2))

  $bigNameFont = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Bold)
  $sfCenter = New-Object System.Drawing.StringFormat
  $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
  $homeNameRect = New-Object System.Drawing.RectangleF ($cardX+190-150), ($midY+$bigR+14), 300, 60
  $g.DrawString($m.home, $bigNameFont, (New-Object System.Drawing.SolidBrush $white), $homeNameRect, $sfCenter)
  $awayNameRect = New-Object System.Drawing.RectangleF ($cardX+$cardW-190-150), ($midY+$bigR+14), 300, 60
  $g.DrawString($m.away, $bigNameFont, (New-Object System.Drawing.SolidBrush $white), $awayNameRect, $sfCenter)

  $tagFont = New-Object System.Drawing.Font($fontFamily, 14, [System.Drawing.FontStyle]::Bold)
  $homeTagSize = $g.MeasureString($data.homeLabel, $tagFont)
  $homeTagW = [int]$homeTagSize.Width + 36
  Draw-RoundedFill $g (New-Object System.Drawing.Rectangle ($cardX+190-[int]($homeTagW/2)),($midY+$bigR+76),$homeTagW,34) 17 (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(50,77,163,255)))
  $g.DrawString($data.homeLabel, $tagFont, (New-Object System.Drawing.SolidBrush $blueBright), ($cardX+190-[int]($homeTagSize.Width/2)),($midY+$bigR+84))
  $awayTagSize = $g.MeasureString($data.awayLabel, $tagFont)
  $awayTagW = [int]$awayTagSize.Width + 36
  Draw-RoundedFill $g (New-Object System.Drawing.Rectangle ($cardX+$cardW-190-[int]($awayTagW/2)),($midY+$bigR+76),$awayTagW,34) 17 (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(50,242,184,7)))
  $g.DrawString($data.awayLabel, $tagFont, (New-Object System.Drawing.SolidBrush $goldSoft), ($cardX+$cardW-190-[int]($awayTagSize.Width/2)),($midY+$bigR+84))

  $venueFont2 = New-Object System.Drawing.Font($fontFamily, 17, [System.Drawing.FontStyle]::Regular)
  $vRect = New-Object System.Drawing.RectangleF $cardX, ($cardY+$cardH-46), $cardW, 34
  $g.DrawString($m.venue, $venueFont2, (New-Object System.Drawing.SolidBrush $muted), $vRect, $sfCenter)

  # time chips row
  $al = $data.ageLabels
  $ml = if ($m.labels) { $m.labels } else { $al }
  $chips = @(
    @{ label=$ml.U14; val=$m.times.U14; hi=$false },
    @{ label=$ml.U12; val=$m.times.U12; hi=$false },
    @{ label=$ml.parent; val=$m.times.parent; hi=$true },
    @{ label=$ml.U10; val=$m.times.U10; hi=$false },
    @{ label=$ml.U8; val=$m.times.U8; hi=$false }
  )
  $chipY = $cardY + $cardH + 36
  $chipH = 110
  $chipGap = 14
  $chipFontLabel = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
  $chipFontVal   = New-Object System.Drawing.Font($fontFamily, 17, [System.Drawing.FontStyle]::Bold)
  $n = $chips.Count
  $chipW = [int](($cardW - ($n-1)*$chipGap) / $n)
  $cx0 = $cardX
  $sfC = New-Object System.Drawing.StringFormat
  $sfC.Alignment = [System.Drawing.StringAlignment]::Center
  foreach ($c in $chips) {
    $cRect = New-Object System.Drawing.Rectangle $cx0, $chipY, $chipW, $chipH
    if ($c.hi) {
      $cb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45,242,184,7))
      Draw-RoundedFill $g $cRect 14 $cb
      Draw-RoundedStroke $g $cRect 14 (New-Object System.Drawing.Pen $gold, 1.5)
    } else {
      $cb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28,255,255,255))
      Draw-RoundedFill $g $cRect 14 $cb
      Draw-RoundedStroke $g $cRect 14 (New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60,255,255,255)), 1)
    }
    $labelColor = if ($c.hi) { $goldSoft } else { $muted }
    $valColor   = if ($c.hi) { $gold } else { $white }
    $lblRect = New-Object System.Drawing.RectangleF $cx0, ($chipY+10), $chipW, 40
    $g.DrawString($c.label, $chipFontLabel, (New-Object System.Drawing.SolidBrush $labelColor), $lblRect, $sfC)
    $valSize = $g.MeasureString($c.val, $chipFontVal)
    $g.DrawString($c.val, $chipFontVal, (New-Object System.Drawing.SolidBrush $valColor), ($cx0+($chipW-$valSize.Width)/2), ($chipY+$chipH-34))
    $cx0 += $chipW + $chipGap
  }

  Draw-Footer $g $data.footerNote $data.footerFb $matchH

  $matchOut = Join-Path $outDir ("round{0}-match{1}.jpg" -f $data.round, $mi)
  $cv.canvas.Save($matchOut, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $cv.g.Dispose(); $cv.canvas.Dispose()
  Write-Host "wrote $matchOut"
  $mi++
}

Write-Host "Done: 1 summary + $($data.matches.Count) match posters in $outDir"
