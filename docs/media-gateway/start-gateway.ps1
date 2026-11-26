# Starts the read-only S3 view of Internxt and the Cloudflare Tunnel.
# Run after `internxt webdav enable`. Skip the tunnel part if cloudflared runs as a Windows service.
$ErrorActionPreference = "Stop"

$rclone = Start-Process rclone -PassThru -NoNewWindow -ArgumentList @(
  "serve", "s3", "internxt:",
  "--addr", "127.0.0.1:8080",
  "--read-only",
  "--no-check-certificate",
  "--vfs-cache-mode", "full",
  "--vfs-cache-max-age", "720h",
  "--dir-cache-time", "1h"
)
Write-Host "rclone serve s3 started (pid $($rclone.Id)) on http://127.0.0.1:8080"

if (-not (Get-Service cloudflared -ErrorAction SilentlyContinue)) {
  cloudflared tunnel run supquotes-media
} else {
  Write-Host "cloudflared service is installed; tunnel is managed by the service."
  Wait-Process -Id $rclone.Id
}
