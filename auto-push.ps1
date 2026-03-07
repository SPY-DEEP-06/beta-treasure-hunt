Param(
  [string]$commitMessage = "Auto update"
)

& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m $commitMessage
& "C:\Program Files\Git\cmd\git.exe" push origin main

Write-Host "Pushed changes to GitHub successfully!"
