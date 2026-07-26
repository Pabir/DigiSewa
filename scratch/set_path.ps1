$oldPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
$nodeDir = 'C:\Users\drskp\AppData\Local\ms-playwright-go\1.50.1'
$npmDir = 'c:\Users\drskp\OneDrive\文件\DigiSewa\.tools\npm\bin'

if ($oldPath -notlike "*ms-playwright-go*") {
    $newPath = "$nodeDir;$npmDir;$oldPath"
    [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
    Write-Host "Successfully registered Node and NPM into User PATH."
} else {
    Write-Host "PATH already contains Node and NPM."
}
