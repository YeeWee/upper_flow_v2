$env:Path = "C:\Program Files\nodejs;d:\动画\hyperframes\hyperframes-main;C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-N-123778-g3b55818764-win64-gpl\bin;" + [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
Set-Location "d:\动画\hyperframes\hyperframes-main"
node packages/cli/dist/cli.js render "d:\动画\trae-harness-video\hyperframes-project" -o "d:\动画\trae-harness-video\output-v2.mp4" --fps 30
