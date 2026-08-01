# Regenere les captures du README (.img/card.png et .img/dark.png) a partir de
# tools/screenshot.html, qui charge la carte reelle depuis dist/.
#
#   pwsh tools/screenshot.ps1
#
# Chrome doit etre installe ; -Chrome permet de pointer un autre binaire.
# La hauteur de fenetre est ajustee au nombre de trains du banc : si tu en
# ajoutes ou en retires dans screenshot.html, corrige -Height en consequence.

[CmdletBinding()]
param(
  [string] $Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [int]    $Width  = 1360,
  [int]    $Height = 460
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$page = Join-Path $PSScriptRoot "screenshot.html"
$img  = Join-Path $root ".img"

if (-not (Test-Path $Chrome)) { throw "Chrome introuvable : $Chrome" }
if (-not (Test-Path $page))   { throw "Page de rendu introuvable : $page" }
if (-not (Test-Path $img))    { New-Item -ItemType Directory -Path $img | Out-Null }

$url  = "file:///" + ($page -replace '\\', '/')
$temp = Join-Path ([System.IO.Path]::GetTempPath()) "train-traveler-shot"

# `--virtual-time-budget` laisse la carte finir son rendu avant la capture.
# `--allow-file-access-from-files` autorise le chargement du module de la carte
# en `file://` : sans lui, la page reste vide.
$common = @(
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--allow-file-access-from-files",
  "--force-device-scale-factor=2", "--virtual-time-budget=8000",
  "--window-size=$Width,$Height"
)

# La page porte son propre controle : elle ecrit "OK ..." ou "ERREUR ..." dans
# son titre selon ce qu'elle trouve dans le shadow root de la carte. Une carte
# muette produirait sinon deux PNG vides sans que rien ne le signale.
$dom = Join-Path ([System.IO.Path]::GetTempPath()) "train-traveler-dom.html"
Start-Process -FilePath $Chrome -Wait -NoNewWindow -RedirectStandardOutput $dom `
  -ArgumentList ($common + @("--user-data-dir=$temp-check", "--dump-dom", $url))
$report = "titre introuvable"
if ((Get-Content $dom -Raw -Encoding UTF8) -match '<title>(.*?)</title>') { $report = $Matches[1] }
if ($report -notlike "OK*") { throw "Rendu de la carte en echec : $report" }
"Controle : $report"

foreach ($shot in @(
  @{ File = "card.png"; Query = "";      Profile = "light" },
  @{ File = "dark.png"; Query = "?dark"; Profile = "dark"  }
)) {
  $out = Join-Path $img $shot.File
  # Surtout pas `$args` : variable automatique de PowerShell.
  $cliArgs = $common + @("--screenshot=$out", "--user-data-dir=$temp-$($shot.Profile)", "$url$($shot.Query)")
  Start-Process -FilePath $Chrome -ArgumentList $cliArgs -Wait
  if (Test-Path $out) {
    "{0} : {1:N0} octets" -f $shot.File, (Get-Item $out).Length
  } else {
    throw "Capture manquante : $out"
  }
}
