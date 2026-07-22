$path = Join-Path $PSScriptRoot "index_final.html"
$content = Get-Content -Path $path -Raw -Encoding UTF8

$navMatch = [regex]::Match($content, '<div class="nav-logo-chip"><img src="(data:image[^"]+)"')
$navLogo = if ($navMatch.Success) { $navMatch.Groups[1].Value } else { "" }

$cssPath = Join-Path $PSScriptRoot "ui_v2_styles.css"
$newCss = Get-Content -Path $cssPath -Raw -Encoding UTF8

$content = [regex]::Replace($content, '<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">', '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">', 1)

$styleStart = $content.IndexOf('<style>') + 7
$styleEnd = $content.IndexOf('</style>')
$content = $content.Substring(0, $styleStart) + $newCss + $content.Substring($styleEnd)

$navHtml = @"
<div class="nav-progress" id="navProgress"></div>
<nav class="nav" id="mainNav">
  <div class="nav-logo-chip"><img src="$navLogo" alt="Engenova"/></div>
  <ul class="nav-links">
    <li><a href="#solution">Solução</a></li>
    <li><a href="#benefits">Benefícios</a></li>
    <li><a href="#dashboard">Dashboard</a></li>
    <li><a href="#timeline">Cronograma</a></li>
    <li><a href="#closing" class="nav-cta">Solicitar Aprovação</a></li>
  </ul>
</nav>
"@
$content = [regex]::Replace($content, '(?s)<div class="nav-progress" id="navProgress"></div>\s*<nav class="nav" id="mainNav">.*?</nav>', $navHtml, 1)

$heroHtml = @"
<section id="hero">
  <div class="hero-bg" id="parallaxBg"></div>
  <div class="hero-grid" id="parallaxGrid"></div>
  <div class="hero-beams">
    <div class="beam" style="left:18%;animation-delay:0s;"></div>
    <div class="beam" style="left:52%;animation-delay:2.5s;"></div>
    <div class="beam" style="left:78%;animation-delay:5s;"></div>
  </div>
  <div class="hero-inner">
    <div class="hero-content">
      <h1 class="reveal in">Controle Digital<span class="line2">de Entrega de <span class="hl">EPIs</span></span></h1>
      <p class="sub reveal in" style="transition-delay:.1s;">Transformando um processo manual<br>em uma solução digital segura.</p>
      <div class="hero-cta reveal in" style="transition-delay:.2s;">
        <a href="#app" class="btn btn-primary">Ver Demonstração</a>
      </div>
      <div class="hero-scroll-cue reveal in" style="transition-delay:.3s;">
        <span class="chev">▼</span>
        <span>Mockup do aplicativo</span>
      </div>
    </div>
    <div class="hero-phone-wrap reveal-zoom" id="heroPhone">
      <div class="phone-stage">
        <div class="phone" id="heroPhoneDevice">
          <div class="notch"></div>
          <div class="phone-screen" id="heroPhoneScreen">
            <div class="screen-slide active" data-i="0"><img src="" alt="" id="heroPhoneImg" style="display:none;"/></div>
          </div>
        </div>
        <div class="phone-reflection"></div>
      </div>
    </div>
  </div>
</section>
"@
$content = [regex]::Replace($content, '(?s)<section id="hero">.*?</section>', $heroHtml, 1)

# Read HTML fragments from companion files
$howHtml = Get-Content (Join-Path $PSScriptRoot "ui_v2_how.html") -Raw -Encoding UTF8
$content = [regex]::Replace($content, '(?s)<!-- TELA 5 — COMO FUNCIONA -->.*?</section>\s*\n\s*<!-- TELA 6', ($howHtml.TrimEnd() + "`n`n<!-- TELA 6"), 1)

$benefitsHtml = Get-Content (Join-Path $PSScriptRoot "ui_v2_benefits.html") -Raw -Encoding UTF8
$content = [regex]::Replace($content, '(?s)<!-- TELA 7 — BENEFÍCIOS -->.*?</section>\s*\n\s*<!-- TELA 8', ($benefitsHtml.TrimEnd() + "`n`n<!-- TELA 8"), 1)

$dashKpi = Get-Content (Join-Path $PSScriptRoot "ui_v2_dash_kpi.html") -Raw -Encoding UTF8
$content = [regex]::Replace($content, '(?s)(<section id="dashboard" class="section-gray">\s*<div class="wrap">\s*<div class="sec-head reveal">.*?</div>\s*)', ('$1' + $dashKpi), 1)

$impactHtml = Get-Content (Join-Path $PSScriptRoot "ui_v2_impact.html") -Raw -Encoding UTF8
$content = [regex]::Replace($content, '(?s)<!-- TELA 11 — IMPACTO ESPERADO -->.*?</section>\s*\n\s*<!-- TELA 12', ($impactHtml.TrimEnd() + "`n`n<!-- TELA 12"), 1)

$timelineHtml = Get-Content (Join-Path $PSScriptRoot "ui_v2_timeline.html") -Raw -Encoding UTF8
$content = [regex]::Replace($content, '(?s)<!-- TELA 10 — EVOLUÇÃO DO PROJETO -->.*?</section>\s*\n\s*<!-- TELA 11', ($timelineHtml.TrimEnd() + "`n`n<!-- TELA 11"), 1)

$closingHtml = @"
<!-- TELA 12 — ENCERRAMENTO -->
<section id="closing">
  <div class="closing-title reveal">Controle Digital de EPIs</div>
  <div class="closing-words reveal reveal-d1">
    <span>Mais Segurança</span><span>Mais Agilidade</span><span>Mais Controle</span><span>Mais Governança</span>
  </div>
  <div class="closing-foot reveal reveal-d2">
    <div class="closing-logo-chip"><img src="$navLogo" alt="Engenova"/></div>
  </div>
  <footer class="bottom reveal reveal-d3">© Engenova — Controle Digital de Entrega de EPIs</footer>
</section>
"@
$content = [regex]::Replace($content, '(?s)<!-- TELA 12 — ENCERRAMENTO -->.*?</section>\s*\n\s*<script>', ($closingHtml + "`n`n<script>"), 1)

$newScript = Get-Content (Join-Path $PSScriptRoot "ui_v2_script.js") -Raw -Encoding UTF8
$content = [regex]::Replace($content, '(?s)<script>.*?</script>\s*</body>', ("<script>`n" + $newScript.Trim() + "`n</script>`n</body>"), 1)

# Add reflection to app section phone
$content = $content -replace '(<div class="phone-stage reveal reveal-d1">\s*<div class="phone">)', '$1' 
if ($content -notmatch 'phone-reflection') {
  $content = $content -replace '(</div>\s*<div class="phone-dots reveal reveal-d3" id="phoneDots">)', "        <div class=`"phone-reflection`"></div>`n      `$1"
}

Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline
Write-Host "Applied UI v2. Size:" (Get-Item $path).Length
