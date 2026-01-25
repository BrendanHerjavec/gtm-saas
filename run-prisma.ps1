$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\brend\Projects\my-project\gtm-saas"
& "C:\Program Files\nodejs\npx.cmd" prisma generate
& "C:\Program Files\nodejs\npx.cmd" prisma db push
