param(
  [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Speech

function ConvertFrom-Utf8Base64([string]$Value) {
  return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $albumName = ConvertFrom-Utf8Base64 '5aSc6Iiq5pyt6K6w'
  $OutputDirectory = Join-Path $PSScriptRoot "..\output\test-data\media-import\audio\$albumName"
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

$episodes = @(
  @{
    FileName = '01-departure.wav'
    TextBase64 = '5aSc6Imy6JC95Zyo5riv5Y+j77yM5pyA5ZCO5LiA54+t5rih6Ii557yT57yT56a75bK444CC5p6X6Iif5oqK5pen56yU6K6w5pys5pS+5Zyo56qX6L6577yM5ZCs6KeB6L+c5aSE54Gv5aGU5Lyg5p2l5L2O5rKJ55qE5rG956yb44CC5rW36Z2i5rKh5pyJ5pyI5YWJ77yM5Y+q5pyJ6Iiq5qCH54Gv5LiA5piO5LiA5pqX77yM5YOP5Zyo5o+Q6YaS5q+P5LiA5Liq5pma5b2S55qE5Lq66K6w5L2P5pa55ZCR44CC'
  },
  @{
    FileName = '02-letter-at-sea.wav'
    TextBase64 = '5riF5pmo5LmL5YmN77yM6Ii55ZGY5LuO55Sy5p2/5LiK5o2h5Yiw5LiA5Y+q6KKr5rW35rC05rW45rm/55qE5L+h5bCB44CC5L+h6YeM5rKh5pyJ5Zyw5Z2A77yM5Y+q55S7552A5LiA5bqn54Gv5aGU5ZKM5LiA5p2h5ZCR5YyX55qE6Iiq57q/44CC5p6X6Iif57+75byA56yU6K6w5pys77yM5oqK6L+Z5q615aSc6Iiq5YaZ5Zyo56m655m96aG15LiK77yM5bm25Yaz5a6a5Zyo5LiL5LiA5qyh6Z2g5bK45pe25a+75om+55S75Lit55qE5Zyw5pa544CC'
  }
)

$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $zhVoice = $synthesizer.GetInstalledVoices() |
    Where-Object { $_.VoiceInfo.Culture.Name -eq 'zh-CN' } |
    Select-Object -First 1

  if ($null -ne $zhVoice) {
    $synthesizer.SelectVoice($zhVoice.VoiceInfo.Name)
  }

  $synthesizer.Rate = -1
  $synthesizer.Volume = 92

  foreach ($episode in $episodes) {
    $target = Join-Path $resolvedOutput $episode.FileName
    $text = ConvertFrom-Utf8Base64 $episode.TextBase64
    $synthesizer.SetOutputToWaveFile($target)
    $synthesizer.Speak($text)
    $synthesizer.SetOutputToNull()
    Write-Host "Generated $target"
  }
}
finally {
  $synthesizer.Dispose()
}

Write-Host "Audio fixtures are ready at $resolvedOutput"
