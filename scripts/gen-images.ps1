# gen-images.ps1 - Generate placeholder product & banner PNGs via System.Drawing.
# NOTE: This file must remain pure ASCII. Chinese strings are embedded as
# base64-encoded UTF-8 and decoded at runtime, because Windows PowerShell 5.1
# fails to parse scripts that contain non-ASCII characters.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$RepoRoot = Split-Path $PSScriptRoot -Parent
$script:OutDir = Join-Path $RepoRoot 'src\static\img'
New-Item -ItemType Directory -Force -Path $script:OutDir | Out-Null

function B64([string]$s) {
  return [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

function New-ProductImg {
  param([string]$name, [string]$file, [int]$seed)
  $W = 400; $H = 400
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # Soft pastel gradient pairs; seed rotates through them so the 16 images
  # differ slightly in hue without being garish.
  $palettes = @(
    @(@(232, 241, 255), @(255, 240, 235)),
    @(@(240, 246, 255), @(244, 235, 255)),
    @(@(232, 252, 244), @(255, 250, 235)),
    @(@(255, 242, 235), @(240, 250, 255)),
    @(@(238, 246, 255), @(250, 255, 240)),
    @(@(255, 244, 244), @(240, 245, 255)),
    @(@(242, 240, 255), @(255, 248, 235)),
    @(@(244, 255, 240), @(255, 242, 248))
  )
  $p = $palettes[($seed - 1) % $palettes.Count]
  $c1 = [System.Drawing.Color]::FromArgb($p[0][0], $p[0][1], $p[0][2])
  $c2 = [System.Drawing.Color]::FromArgb($p[1][0], $p[1][1], $p[1][2])
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $W, $H)), $c1, $c2, 45)
  $g.FillRectangle($brush, 0, 0, $W, $H)

  $fontSize = 34
  $font = New-Object System.Drawing.Font('Microsoft YaHei', $fontSize, [System.Drawing.FontStyle]::Bold)
  $txt = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 19, 121, 255))
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(20, 120, 360, 160)
  # Shrink font until the name fits on a single line (no wrapping).
  $m = $g.MeasureString($name, $font, 10000, $fmt)
  while ($m.Width -gt 340) {
    $fontSize = [math]::Floor($fontSize * 0.85)
    $font.Dispose()
    $font = New-Object System.Drawing.Font('Microsoft YaHei', $fontSize, [System.Drawing.FontStyle]::Bold)
    $m = $g.MeasureString($name, $font, 10000, $fmt)
  }
  $g.DrawString($name, $font, $txt, $rect, $fmt)

  $out = Join-Path $script:OutDir $file
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host ("  wrote " + $file + "  " + $name)
}

function New-BannerImg {
  param([string]$text, [string]$file)
  $W = 750; $H = 300
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $c1 = [System.Drawing.Color]::FromArgb(19, 121, 255)
  $c2 = [System.Drawing.Color]::FromArgb(104, 180, 255)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $W, $H)), $c1, $c2, 0)
  $g.FillRectangle($brush, 0, 0, $W, $H)

  $fontSize = 60
  $font = New-Object System.Drawing.Font('Microsoft YaHei', $fontSize, [System.Drawing.FontStyle]::Bold)
  $txt = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(0, 90, $W, 120)
  # Shrink font until the text fits on a single line.
  $m = $g.MeasureString($text, $font, 10000, $fmt)
  while ($m.Width -gt 700) {
    $fontSize = [math]::Floor($fontSize * 0.85)
    $font.Dispose()
    $font = New-Object System.Drawing.Font('Microsoft YaHei', $fontSize, [System.Drawing.FontStyle]::Bold)
    $m = $g.MeasureString($text, $font, 10000, $fmt)
  }
  $g.DrawString($text, $font, $txt, $rect, $fmt)

  $out = Join-Path $script:OutDir $file
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host ("  wrote " + $file + "  " + $text)
}

Write-Host 'Generating product images (16x400x400) and banners (2x750x300)...'
New-ProductImg (B64 '5peX6Iiw5pm66IO95omL5py6IDVH') 'g1.png' 1
New-ProductImg (B64 '6L276JaE56yU6K6w5pys55S16ISR') 'g2.png' 2
New-ProductImg (B64 '55yf5peg57q/6ZmN5Zmq6ICz5py6') 'g3.png' 3
New-ProductImg (B64 '5L6/5pC66JOd54mZ6Z+z566x') 'g4.png' 4
New-ProductImg (B64 '55S35aOr5LyR6Zey5aS55YWL') 'g5.png' 5
New-ProductImg (B64 '57qv5qOJ55m9VOaBpA==') 'g6.png' 6
New-ProductImg (B64 '5rOV5byP56KO6Iqx6L+e6KGj6KOZ') 'g7.png' 7
New-ProductImg (B64 '5Z2a5p6c6Zu26aOf5aSn56S85YyF') 'g8.png' 8
New-ProductImg (B64 '6L+b5Y+j6JOd5bGx5ZKW5ZWh6LGG') 'g9.png' 9
New-ProductImg (B64 '54Of6YWw6IO6576O55m957K+5Y2O') 'g10.png' 10
New-ProductImg (B64 '5rCo5Z+66YW45rip5ZKM5rSB6Z2i') 'g11.png' 11
New-ProductImg (B64 '6bqm6aWt55+z5LiN57KY54KS6ZSF') 'g12.png' 12
New-ProductImg (B64 '5YyX5qyn6Zm255O36aSQ5YW35aWX6KOF') 'g13.png' 13
New-ProductImg (B64 '5YWo5qOJ5Zub5Lu25aWX') 'g14.png' 14
New-ProductImg (B64 '5pm66IO96L+Q5Yqo5omL546v') 'g15.png' 15
New-ProductImg (B64 '5Yqg5Y6a6Ziy5ruR55Gc5Ly95Z6r') 'g16.png' 16
New-BannerImg (B64 '6ZmQ5pe256eS5p2AIOS9juiHszXmipg=') 'banner1.png'
New-BannerImg (B64 '5paw5ZOB6aaW5Y+RIOWFqOWcuuWMhemCrg==') 'banner2.png'

Write-Host 'Done.'
