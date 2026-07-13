# Generates the Sage PT app icons using .NET System.Drawing (built into Windows —
# no package install needed). Draws a simple barbell mark on the app's dark background.
Add-Type -AssemblyName System.Drawing

$OutDir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$bg = [System.Drawing.Color]::FromArgb(255, 15, 17, 9)     # #0f1109
$fg = [System.Drawing.Color]::FromArgb(255, 143, 160, 104) # #8fa068

function New-BarbellIcon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear($bg)

    $brush = New-Object System.Drawing.SolidBrush $fg
    $pad = $Size * 0.14
    $cy = $Size / 2
    $barH = $Size * 0.09
    $plateW = $Size * 0.13
    $plateH = $Size * 0.5
    $radius = [Math]::Max(2, $Size * 0.03)

    $barX0 = $pad + $plateW * 0.6
    $barW = ($Size - $pad - $plateW * 0.6) - $barX0
    $plateXL = $pad
    $plateXR = $Size - $pad - $plateW

    function Add-RoundRect($path, $x, $y, $w, $h, $r) {
        $d = $r * 2
        $path.AddArc($x, $y, $d, $d, 180, 90)
        $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
        $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
        $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
        $path.CloseFigure()
    }

    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    Add-RoundRect $gp $barX0 ($cy - $barH/2) $barW $barH $radius
    Add-RoundRect $gp $plateXL ($cy - $plateH/2) $plateW $plateH $radius
    Add-RoundRect $gp $plateXR ($cy - $plateH/2) $plateW $plateH $radius
    $g.FillPath($brush, $gp)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

New-BarbellIcon -Size 192 -Path (Join-Path $OutDir "icon-192.png")
New-BarbellIcon -Size 512 -Path (Join-Path $OutDir "icon-512.png")
New-BarbellIcon -Size 512 -Path (Join-Path $OutDir "icon-512-maskable.png")
New-BarbellIcon -Size 180 -Path (Join-Path $OutDir "apple-touch-icon.png")

$favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f1109"/><rect x="10" y="29" width="44" height="6" rx="2" fill="#8fa068"/><rect x="6" y="18" width="9" height="28" rx="2" fill="#8fa068"/><rect x="49" y="18" width="9" height="28" rx="2" fill="#8fa068"/></svg>'
Set-Content -Path (Join-Path $OutDir "favicon.svg") -Value $favicon -Encoding utf8

Write-Host "Icons written to $OutDir"
Get-ChildItem $OutDir
