@echo off
set "PATH=C:\Users\drskp\AppData\Local\ms-playwright-go\1.50.1;C:\Users\drskp\Projects\DigiSewa\.tools\npm\bin;%PATH%"
echo Starting DigiSewa Web Server...
"C:\Users\drskp\AppData\Local\ms-playwright-go\1.50.1\node.exe" "C:\Users\drskp\Projects\DigiSewa\.tools\npm\bin\npm-cli.js" run web
pause
