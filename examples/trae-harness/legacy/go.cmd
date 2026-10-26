@echo off
set "PATH=C:\Program Files\nodejs;d:\动画;%PATH%"
cd /d "d:\动画\hyperframes\hyperframes-main"
node packages\cli\dist\cli.js render "d:\动画\trae-harness-video\hyperframes-project" -o "d:\动画\trae-harness-video\output-v2.mp4" --fps 30
