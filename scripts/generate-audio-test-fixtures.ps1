param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\output\test-data\media-import\audio\夜航札记')
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Speech

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

$episodes = @(
  @{
    FileName = '01-启程.wav'
    Text = '夜色落在港口，最后一班渡船缓缓离岸。林舟把旧笔记本放在窗边，听见远处灯塔传来低沉的汽笛。海面没有月光，只有航标灯一明一暗，像在提醒每一个晚归的人记住方向。'
  },
  @{
    FileName = '02-海上来信.wav'
    Text = '清晨之前，船员从甲板上捡到一只被海水浸湿的信封。信里没有地址，只画着一座灯塔和一条向北的航线。林舟翻开笔记本，把这段夜航写在空白页上，并决定在下一次靠岸时寻找画中的地方。'
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
    $synthesizer.SetOutputToWaveFile($target)
    $synthesizer.Speak($episode.Text)
    $synthesizer.SetOutputToNull()
    Write-Host "Generated $target"
  }
}
finally {
  $synthesizer.Dispose()
}

Write-Host "Audio fixtures are ready at $resolvedOutput"
