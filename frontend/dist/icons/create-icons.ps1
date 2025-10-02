# PowerShell script to create basic icon placeholders
# This creates simple purple gradient icons for PWA

# Function to create a basic square icon using .NET Drawing
Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param(
        [int]$Size,
        [string]$FileName
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Create purple gradient brush
    $startColor = [System.Drawing.Color]::FromArgb(139, 92, 246)  # #8b5cf6
    $endColor = [System.Drawing.Color]::FromArgb(117, 65, 249)    # #7541f9
    
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($Size, $Size),
        $startColor,
        $endColor
    )
    
    # Fill the entire bitmap with gradient
    $graphics.FillRectangle($brush, 0, 0, $Size, $Size)
    
    # Add a simple "A" letter in white
    $font = New-Object System.Drawing.Font("Arial", ($Size * 0.6), [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $graphics.DrawString("A", $font, $whiteBrush, ($Size / 2), ($Size / 2), $stringFormat)
    
    # Save the image
    $bitmap.Save($FileName, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $font.Dispose()
    $whiteBrush.Dispose()
}

# Create all required icon sizes
Create-Icon -Size 72 -FileName "icon-72x72.png"
Create-Icon -Size 96 -FileName "icon-96x96.png"
Create-Icon -Size 128 -FileName "icon-128x128.png"
Create-Icon -Size 144 -FileName "icon-144x144.png"
Create-Icon -Size 152 -FileName "icon-152x152.png"
Create-Icon -Size 192 -FileName "icon-192x192.png"
Create-Icon -Size 384 -FileName "icon-384x384.png"
Create-Icon -Size 512 -FileName "icon-512x512.png"

Write-Host "All PWA icons created successfully!" -ForegroundColor Green
