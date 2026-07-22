# -*- coding: utf-8 -*-
"""Apply V2.0 UI/UX changes to index_final.html (visual only)."""
import re
from pathlib import Path

PATH = Path(__file__).parent / "index_final.html"
content = PATH.read_text(encoding="utf-8")

def extract_img_src(class_name: str) -> str:
    pat = rf'<div class="{class_name}"><img src="(data:image[^"]+)"'
    m = re.search(pat, content)
    return m.group(1) if m else ""

nav_logo = extract_img_src("nav-logo-chip")
hero_logo = extract_img_src("hero-logo-chip") or nav_logo
closing_logo = extract_img_src("closing-logo-chip") or nav_logo

# --- FONT LINK ---
content = re.sub(
    r'<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">',
    content,
    count=1,
)

# --- Replace style block up to </style> with new CSS (keep rest of file) ---
style_end = content.index("</style>")
style_start = content.index("<style>") + len("<style>")

NEW_CSS = r"""
:root{
  --orange:#FF5E15;
  --orange-deep:#E04E0A;
  --black:#121214;
  --graphite:#23242A;
  --gray:#8C8D95;
  --gray-light:#EEEFF1;
  --white:#FFFFFF;
  --line:#2C2D33;
  --max:1280px;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{
  font-family:'Inter',sans-serif;
  font-size:18px;
  font-weight:400;
  background:var(--white);
  color:var(--black);
  overflow-x:hidden;
  line-height:1.55;
}
h1,h2,h3,h4,.display{font-family:'Inter',sans-serif;}
::selection{background:var(--orange);color:white;}

@media (prefers-reduced-motion: reduce){
  *{animation-duration:0.001ms !important;transition-duration:0.001ms !important;}
}

/* ===== NAV ===== */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:1000;
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 48px;
  background:rgba(18,18,20,0.35);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  border-bottom:1px solid rgba(255,255,255,0.06);
  transition:transform .45s cubic-bezier(.16,.8,.3,1), background .4s ease, padding .4s ease;
  transform:translateY(0);
}
.nav.nav-hidden{transform:translateY(-110%);}
.nav.scrolled{
  background:rgba(18,18,20,0.72);
  padding:14px 48px;
}
.nav-logo-chip{background:#fff;border-radius:10px;padding:6px 12px;display:flex;align-items:center;box-shadow:0 4px 18px rgba(0,0,0,.22);}
.nav-logo-chip img{height:26px;width:auto;display:block;}
.nav-links{display:flex;align-items:center;gap:32px;list-style:none;}
.nav-links a{color:#d8d8dc;text-decoration:none;font-size:15px;font-weight:500;letter-spacing:.2px;transition:color .25s;position:relative;}
.nav-links a:hover{color:#fff;}
.nav-links a::after{content:'';position:absolute;left:0;bottom:-6px;width:0;height:2px;background:var(--orange);transition:width .3s;}
.nav-links a:hover::after{width:100%;}
.nav-cta{
  padding:12px 22px !important;
  background:var(--orange);color:#fff !important;border-radius:100px;
  font-weight:600;font-size:14px;box-shadow:0 6px 20px rgba(255,94,21,.35);
  transition:transform .25s, box-shadow .25s, background .25s !important;
}
.nav-cta::after{display:none !important;}
.nav-cta:hover{background:var(--orange-deep);transform:translateY(-2px);box-shadow:0 10px 26px rgba(255,94,21,.45);}
.nav-progress{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--orange),#ffb27a);z-index:1001;width:0%;transition:width .1s linear;}
@media (max-width:900px){.nav-links{display:none;}.nav{padding:16px 24px;}}

/* ===== SECTION BASE ===== */
section{
  position:relative;
  min-height:100vh;
  width:100%;
  display:flex;
  align-items:center;
  padding:120px 7vw 80px;
}
.wrap{max-width:var(--max);margin:0 auto;width:100%;}
.eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color:var(--orange);margin-bottom:14px;
}
.eyebrow::before{content:'';width:18px;height:2px;background:var(--orange);}
.reveal{opacity:0;transform:translateY(36px);transition:opacity .9s cubic-bezier(.16,.8,.3,1), transform .9s cubic-bezier(.16,.8,.3,1);}
.reveal.in{opacity:1;transform:translateY(0);}
.reveal-zoom{opacity:0;transform:scale(.94);transition:opacity .9s cubic-bezier(.16,.8,.3,1), transform .9s cubic-bezier(.16,.8,.3,1);}
.reveal-zoom.in{opacity:1;transform:scale(1);}
.reveal-d1{transition-delay:.08s;}
.reveal-d2{transition-delay:.16s;}
.reveal-d3{transition-delay:.24s;}
.reveal-d4{transition-delay:.32s;}
.reveal-d5{transition-delay:.4s;}
.reveal-d6{transition-delay:.48s;}

/* ===== HERO ===== */
#hero{
  background:linear-gradient(180deg,rgba(10,10,11,.45),rgba(10,10,11,.85)),
    repeating-linear-gradient(115deg, #1b1b1e 0px, #1b1b1e 2px, #161617 2px, #161617 4px);
  background-size:cover;
  color:#fff;
  min-height:100vh;
  overflow:hidden;
  padding:100px 7vw 60px;
  flex-direction:column;
  justify-content:flex-start;
  align-items:stretch;
}
.hero-bg{
  position:absolute;inset:0;z-index:0;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255,94,21,.18), transparent 45%),
    radial-gradient(circle at 85% 75%, rgba(255,94,21,.14), transparent 50%),
    linear-gradient(160deg,#0d0d0e 0%, #1a1a1d 55%, #221f1c 100%);
  will-change:transform;
}
.hero-grid{
  position:absolute;inset:0;z-index:0;opacity:.18;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:48px 48px;
  mask-image:radial-gradient(circle at 50% 40%, black 10%, transparent 70%);
}
.hero-beams{position:absolute;inset:0;z-index:0;}
.beam{position:absolute;width:1px;height:140%;top:-20%;background:linear-gradient(180deg,transparent, rgba(255,94,21,.5), transparent);animation:beamMove 9s linear infinite;}
@keyframes beamMove{0%{transform:translateY(-10%) scaleY(.8);opacity:0;}50%{opacity:1;}100%{transform:translateY(10%) scaleY(1.1);opacity:0;}}
.hero-inner{position:relative;z-index:2;max-width:var(--max);margin:0 auto;width:100%;display:flex;flex-direction:column;align-items:center;text-align:center;}
.hero-content{padding-top:20px;width:100%;}
.hero h1{
  font-size:clamp(42px,5.6vw,72px);
  font-weight:800;
  line-height:1.06;
  letter-spacing:-2px;
  margin:0 auto 28px;
  text-transform:uppercase;
}
.hero h1 .line2{display:block;margin-top:6px;}
.hero h1 .hl{color:var(--orange);}
.hero p.sub{
  font-size:22px;
  color:#b8b8bf;
  max-width:640px;
  font-weight:400;
  margin:0 auto 40px;
  line-height:1.5;
}
.hero-cta{display:flex;justify-content:center;margin-bottom:28px;}
.btn{
  display:inline-flex;align-items:center;gap:10px;
  padding:18px 34px;border-radius:100px;
  font-weight:600;font-size:18px;
  border:none;cursor:pointer;
  text-decoration:none;
  transition:transform .25s, box-shadow .25s, background .25s;
}
.btn-primary{background:var(--orange);color:#fff;box-shadow:0 8px 24px rgba(255,94,21,.35);}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(255,94,21,.5);}
.btn-ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.25);}
.btn-ghost:hover{background:rgba(255,255,255,.08);transform:translateY(-3px);}
.hero-scroll-cue{display:flex;flex-direction:column;align-items:center;gap:8px;color:#9c9ca3;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:36px;animation:fadeBounce 2.4s ease-in-out infinite;}
.hero-scroll-cue .chev{font-size:22px;color:var(--orange);line-height:1;}
@keyframes fadeBounce{0%,100%{opacity:.45;transform:translateY(0);}50%{opacity:1;transform:translateY(6px);}}
.hero-phone-wrap{position:relative;width:100%;display:flex;justify-content:center;padding-bottom:20px;}
.hero-phone-wrap::before{
  content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);
  width:min(420px,70vw);height:40px;
  background:radial-gradient(ellipse, rgba(255,94,21,.25), transparent 70%);
  filter:blur(12px);pointer-events:none;
}

/* ===== SECTION HEADERS ===== */
.sec-head{max-width:760px;margin-bottom:36px;}
.sec-head.compact{margin-bottom:22px;}
.sec-head h2{font-size:clamp(36px,4.5vw,72px);font-weight:700;letter-spacing:-1.5px;color:var(--black);line-height:1.08;}
.sec-head p,.sec-sub{font-size:22px;color:var(--gray);margin-top:12px;max-width:620px;font-weight:400;line-height:1.45;}
.section-dark{background:var(--black);color:#fff;}
.section-dark .sec-head h2{color:#fff;}
.section-graphite{background:var(--graphite);color:#fff;}
.section-graphite .sec-head h2{color:#fff;}
.section-gray{background:var(--gray-light);}

/* ===== UNIFORM CARDS ===== */
.ui-card{
  background:#fff;border:1px solid #eceaea;border-radius:20px;
  padding:28px 24px;
  transition:transform .4s cubic-bezier(.16,.8,.3,1), box-shadow .4s, border-color .35s;
}
.ui-card:hover{transform:translateY(-10px);box-shadow:0 24px 48px rgba(0,0,0,.1);border-color:rgba(255,94,21,.35);}
.ui-card-ico{
  width:52px;height:52px;border-radius:14px;
  background:#fff1e8;color:var(--orange);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:18px;
  transition:transform .5s cubic-bezier(.16,.8,.3,1);
}
.ui-card:hover .ui-card-ico{transform:rotate(360deg);}
.ui-card h4{font-size:20px;font-weight:700;margin-bottom:10px;}
.ui-card p{font-size:16px;color:var(--gray);line-height:1.45;}

/* ===== PROBLEMA ===== */
#problem .grid2{display:grid;grid-template-columns:1.05fr .95fr;gap:60px;align-items:flex-start;}
.problem-list{display:flex;flex-direction:column;gap:14px;}
.problem-item{
  display:flex;align-items:flex-start;gap:16px;
  padding:18px 20px;border-radius:14px;
  background:#fff;border:1px solid #eceaea;
  transition:transform .35s, box-shadow .35s, border-color .35s;
}
.problem-item:hover{transform:translateY(-6px);box-shadow:0 18px 36px rgba(0,0,0,.08);border-color:var(--orange);}
.problem-ico{
  flex:none;width:46px;height:46px;border-radius:12px;
  background:#fff1e8;color:var(--orange);
  display:flex;align-items:center;justify-content:center;
  transition:transform .5s;
}
.problem-item:hover .problem-ico{transform:rotate(360deg);}
.problem-item h4{font-size:18px;font-weight:600;margin-bottom:4px;}
.problem-item p{font-size:16px;color:var(--gray);}
.flow-old{background:var(--black);border-radius:22px;padding:38px 30px;position:relative;overflow:hidden;}
.flow-old::before{content:'PROCESSO ATUAL';position:absolute;top:18px;right:24px;font-size:10px;letter-spacing:2px;color:#777;font-weight:700;}
.flow-old-steps{display:flex;flex-direction:column;gap:0;margin-top:18px;}
.fo-step{display:flex;align-items:center;gap:14px;padding:14px 0;color:#d7d7da;font-size:15px;font-weight:500;}
.fo-step .n{width:26px;height:26px;border-radius:50%;border:1px solid #4a4a50;display:flex;align-items:center;justify-content:center;font-size:12px;color:#9c9ca3;flex:none;}
.fo-line{width:1px;height:22px;background:#3a3a3f;margin-left:13px;}
.fo-tag{margin-left:auto;font-size:10.5px;background:rgba(255,94,21,.15);color:#ff9f6e;padding:3px 9px;border-radius:100px;font-weight:700;}

/* ===== SOLUTION FLOW ===== */
#solution{background:#fff;}
.sol-flow{display:flex;flex-direction:column;align-items:center;gap:0;max-width:560px;margin:0 auto;}
.sol-node{
  width:100%;background:#fff;border:1.5px solid #e7e5e3;border-radius:16px;
  padding:18px 26px;display:flex;align-items:center;gap:16px;
  box-shadow:0 6px 18px rgba(20,20,20,.04);
  transition:transform .4s, box-shadow .4s, border-color .4s;
}
.sol-node:hover{transform:translateY(-4px) scale(1.015);box-shadow:0 16px 32px rgba(255,94,21,.16);border-color:var(--orange);}
.sol-node .num{flex:none;width:38px;height:38px;border-radius:11px;background:var(--black);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;}
.sol-node.active .num{background:var(--orange);}
.sol-node h4{font-size:16px;font-weight:600;}
.sol-node p{font-size:15px;color:var(--gray);}
.sol-connector{width:2px;height:32px;background:linear-gradient(180deg,#e2e0de,var(--orange));position:relative;}
.sol-connector::after{content:'';position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--orange);}

/* ===== MOCKUP / PHONE ===== */
#app{background:var(--black);color:#fff;overflow:hidden;}
.app-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:40px;align-items:center;}
.phone-stage{position:relative;display:flex;flex-direction:column;align-items:center;perspective:1400px;}
.phone-reflection{
  position:absolute;bottom:-18px;left:50%;transform:translateX(-50%) scaleY(-1);
  width:354px;height:120px;opacity:.12;pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,.3), transparent);
  mask-image:linear-gradient(180deg, black, transparent);
  -webkit-mask-image:linear-gradient(180deg, black, transparent);
  border-radius:50%;
  filter:blur(8px);
}
.phone{
  width:354px;height:722px;border-radius:48px;
  background:linear-gradient(145deg,#1a1a1c,#0a0a0b);
  border:11px solid #252528;
  box-shadow:
    0 50px 100px rgba(0,0,0,.65),
    0 20px 40px rgba(0,0,0,.4),
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 0 1px rgba(255,255,255,.05);
  position:relative;overflow:hidden;
  transform:rotateY(0deg);
  transition:transform .6s ease;
}
.phone::after{
  content:'';position:absolute;inset:0;border-radius:38px;
  background:linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 40%, transparent 100%);
  pointer-events:none;z-index:6;
}
.phone .notch{
  position:absolute;top:0;left:50%;transform:translateX(-50%);
  width:130px;height:28px;
  background:#0a0a0b;border-radius:0 0 20px 20px;z-index:5;
  box-shadow:inset 0 -2px 6px rgba(255,255,255,.04);
}
.phone .notch::before{
  content:'';position:absolute;top:10px;left:50%;transform:translateX(-50%);
  width:10px;height:10px;border-radius:50%;background:#1e1e22;
  box-shadow:inset 0 0 4px rgba(0,0,0,.8);
}
.phone-screen{position:absolute;inset:0;border-radius:38px;overflow:hidden;background:#fff;}
.screen-slide{position:absolute;inset:0;opacity:0;transition:opacity .5s ease, transform .5s ease;transform:scale(1.01);background:#fff;}
.screen-slide.active{opacity:1;transform:scale(1);z-index:2;}
.screen-slide img{width:100%;height:100%;object-fit:contain;object-position:center top;display:block;background:#fff;}
.scr-pad{padding:42px 18px 16px;height:100%;display:flex;flex-direction:column;color:#1a1a1a;font-family:'Inter',sans-serif;}
.scr-header{font-size:11px;color:var(--gray);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;display:flex;justify-content:space-between;}
.scr-title{font-family:'Inter',sans-serif;font-size:19px;font-weight:700;margin-bottom:18px;}
.btn-mini{background:var(--orange);color:#fff;border-radius:12px;padding:13px;text-align:center;font-size:13px;font-weight:600;margin-top:auto;}
.field{background:#f2f1ef;border-radius:12px;padding:13px 14px;font-size:12.5px;color:#8c8d95;margin-bottom:10px;}
.qr-box{flex:1;border:2px dashed var(--orange);border-radius:18px;display:flex;align-items:center;justify-content:center;margin:14px 0;background:#fffaf6;}
.qr-mark{width:120px;height:120px;background:repeating-conic-gradient(#1a1a1a 0deg 90deg, transparent 90deg 180deg);background-size:14px 14px;border-radius:10px;opacity:.85;}
.dash-card{background:#f7f6f4;border-radius:12px;padding:12px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center;}
.dash-card b{font-size:18px;}
.dash-card span{font-size:10.5px;color:var(--gray);}
.mini-bars{display:flex;align-items:flex-end;gap:5px;height:50px;margin-top:8px;}
.mini-bars div{flex:1;background:var(--orange);border-radius:3px 3px 0 0;opacity:.85;}
.epi-row{display:flex;align-items:center;gap:10px;background:#f7f6f4;border-radius:10px;padding:9px 11px;margin-bottom:8px;}
.epi-dot{width:30px;height:30px;border-radius:9px;background:#fff1e8;flex:none;}
.epi-row p{font-size:12px;font-weight:600;}
.epi-row span{font-size:10px;color:var(--gray);}
.sig-pad{flex:1;border:1.5px solid #eee;border-radius:14px;margin:14px 0;display:flex;align-items:center;justify-content:center;background:#fafafa;}
.sig-line{width:65%;height:1px;background:#ddd;position:relative;}
.hist-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f0ee;font-size:11.5px;}
.reg-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}
.reg-list span{background:#f2f1ef;border-radius:100px;padding:6px 12px;font-size:11px;color:#555;}
.phone-dots{display:flex;gap:8px;justify-content:center;margin-top:26px;}
.phone-dots .d{width:7px;height:7px;border-radius:50%;background:#3a3a3f;cursor:pointer;transition:background .3s,width .3s;}
.phone-dots .d.active{background:var(--orange);width:22px;border-radius:4px;}
.app-list{display:flex;flex-direction:column;gap:0;}
.app-li{display:flex;align-items:center;gap:16px;padding:16px 4px;border-bottom:1px solid rgba(255,255,255,.08);cursor:pointer;transition:opacity .3s,padding-left .3s;opacity:.55;}
.app-li.active{opacity:1;padding-left:10px;}
.app-li .n{width:30px;height:30px;border-radius:9px;background:rgba(255,94,21,.15);color:var(--orange);font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none;}
.app-li.active .n{background:var(--orange);color:#fff;}
.app-li h4{font-size:16px;font-weight:600;}
.app-li p{font-size:14px;color:#9a9aa0;}

/* ===== HOW IT WORKS — HORIZONTAL FLOW ===== */
#how{background:#fff;}
.flow-h{
  display:flex;align-items:flex-start;justify-content:center;gap:0;
  max-width:1100px;margin:0 auto;position:relative;
}
.flow-h-item{
  flex:1;text-align:center;padding:0 12px;position:relative;
  opacity:0;transform:translateY(24px);
  transition:opacity .7s cubic-bezier(.16,.8,.3,1), transform .7s cubic-bezier(.16,.8,.3,1);
}
.flow-h-item.in{opacity:1;transform:translateY(0);}
.flow-h-ico{
  width:72px;height:72px;border-radius:20px;margin:0 auto 16px;
  background:var(--black);color:#fff;font-size:32px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 12px 28px rgba(0,0,0,.12);
  transition:transform .5s, box-shadow .4s;
}
.flow-h-item:hover .flow-h-ico{transform:translateY(-6px) rotate(8deg);box-shadow:0 18px 36px rgba(255,94,21,.25);}
.flow-h-item h4{font-size:20px;font-weight:700;margin-bottom:8px;}
.flow-h-item p{font-size:16px;color:var(--gray);max-width:200px;margin:0 auto;}
.flow-h-line{
  flex:none;width:80px;height:2px;background:linear-gradient(90deg,var(--orange),#ffd0b0);
  margin-top:36px;position:relative;transform:scaleX(0);transform-origin:left;
  transition:transform 1s cubic-bezier(.16,.8,.3,1) .3s;
}
.flow-h-line.in{transform:scaleX(1);}
.flow-h-line::after{content:'';position:absolute;right:-4px;top:-3px;width:8px;height:8px;border-radius:50%;background:var(--orange);}
.steps4{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
.step-card{background:#fff;border:1px solid #ece9e7;border-radius:20px;padding:30px 24px;position:relative;transition:transform .4s, box-shadow .4s;}
.step-card:hover{transform:translateY(-10px);box-shadow:0 24px 48px rgba(0,0,0,.1);}
.step-ico{width:52px;height:52px;border-radius:14px;background:var(--black);display:flex;align-items:center;justify-content:center;margin-bottom:18px;transition:transform .5s;}
.step-card:hover .step-ico{transform:rotate(360deg);}
.step-card h4{font-size:20px;font-weight:700;margin-bottom:8px;}
.step-card p{font-size:16px;color:var(--gray);}

/* ===== DATA ICONS GRID ===== */
#data{background:var(--gray-light);}
.data-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;}
.data-card{
  background:#fff;border-radius:20px;padding:26px 16px;text-align:center;
  border:1px solid #e9e7e4;transition:transform .4s,border-color .35s,box-shadow .4s;
}
.data-card:hover{transform:translateY(-10px);border-color:var(--orange);box-shadow:0 24px 48px rgba(0,0,0,.08);}
.data-ico{width:52px;height:52px;border-radius:14px;background:#fff1e8;color:var(--orange);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;transition:transform .5s;}
.data-card:hover .data-ico{transform:rotate(360deg);}
.data-card h4{font-size:16px;font-weight:600;}
@media (max-width:1000px){.data-grid{grid-template-columns:repeat(3,1fr);}}
@media (max-width:640px){.data-grid{grid-template-columns:repeat(2,1fr);}}

/* ===== BENEFITS ===== */
#benefits{background:var(--black);color:#fff;padding-top:90px;padding-bottom:90px;min-height:auto;}
#benefits .sec-head{margin-bottom:24px;}
#benefits .sec-sub{color:#a8a8ae;margin-top:8px;}
.benefit-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;}
.benefit-card{
  background:linear-gradient(160deg,#1a1a1c,#151516);
  border:1px solid #2b2b2e;border-radius:20px;padding:28px 24px;
  transition:transform .4s,border-color .4s,box-shadow .4s;
}
.benefit-card:hover{transform:translateY(-10px);border-color:var(--orange);box-shadow:0 24px 48px rgba(0,0,0,.35);}
.benefit-ico{
  width:52px;height:52px;border-radius:14px;background:rgba(255,94,21,.15);
  display:flex;align-items:center;justify-content:center;margin-bottom:16px;
  font-size:24px;transition:transform .5s;
}
.benefit-card:hover .benefit-ico{transform:rotate(360deg);}
.benefit-tag{font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--orange);text-transform:uppercase;margin-bottom:12px;}
.benefit-card h4{font-size:20px;font-weight:700;margin-bottom:12px;}
.benefit-card p{font-size:16px;color:#c4c4c9;line-height:1.45;}
.benefit-card ul{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:12px;}
.benefit-card li{font-size:15px;color:#a8a8ae;display:flex;align-items:flex-start;gap:9px;}
.benefit-card li::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--orange);margin-top:8px;flex:none;}

/* ===== DASHBOARD ===== */
#dashboard{background:#fff;}
.dash-kpis{
  display:grid;grid-template-columns:repeat(4,1fr);gap:0;
  background:#fff;border:1px solid #ece9e7;border-radius:20px;
  overflow:hidden;margin-bottom:28px;
  box-shadow:0 20px 50px rgba(0,0,0,.06);
}
.dash-kpi{
  text-align:center;padding:36px 20px;position:relative;
  border-right:1px solid #ece9e7;
}
.dash-kpi:last-child{border-right:none;}
.dash-kpi-num{
  font-size:clamp(36px,4vw,52px);font-weight:800;color:var(--black);
  letter-spacing:-1px;line-height:1;
}
.dash-kpi-num.orange{color:var(--orange);}
.dash-kpi-label{font-size:16px;color:var(--gray);margin-top:10px;font-weight:500;}
.dash-kpi-bar{
  position:absolute;bottom:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--orange),#ffb27a);
  transform:scaleX(0);transform-origin:left;
  transition:transform 1.2s cubic-bezier(.16,.8,.3,1);
}
.dash-kpi.in .dash-kpi-bar{transform:scaleX(1);}
.dash-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.chart-card{background:#fff;border:1px solid #ece9e7;border-radius:18px;padding:22px;transition:transform .4s,box-shadow .4s;}
.chart-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(0,0,0,.06);}
.chart-card h4{font-size:15px;font-weight:600;margin-bottom:16px;display:flex;justify-content:space-between;color:var(--black);}
.chart-card h4 span{font-size:11px;color:var(--gray);font-weight:500;}
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:120px;}
.bar-chart .bar{flex:1;background:linear-gradient(180deg,var(--orange),#ffac79);border-radius:6px 6px 0 0;transform:scaleY(0);transform-origin:bottom;transition:transform 1s cubic-bezier(.16,.8,.3,1);}
.donut{width:120px;height:120px;border-radius:50%;margin:0 auto;background:conic-gradient(var(--orange) 0deg, var(--orange) calc(var(--p,60)*3.6deg), #efece9 calc(var(--p,60)*3.6deg));position:relative;transition:background 1.4s ease;}
.donut::after{content:'';position:absolute;inset:18px;border-radius:50%;background:#fff;}
.donut-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;}
.line-chart{height:120px;position:relative;}
.line-chart svg{width:100%;height:100%;}
.rank-row{display:flex;align-items:center;gap:10px;font-size:13px;margin-bottom:10px;}
.rank-row .rn{width:20px;height:20px;border-radius:6px;background:var(--black);color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;flex:none;font-weight:700;}
.rank-row .rb{flex:1;height:7px;background:#efece9;border-radius:4px;overflow:hidden;}
.rank-row .rb i{display:block;height:100%;background:var(--orange);border-radius:4px;width:0;transition:width 1.2s cubic-bezier(.16,.8,.3,1);}
.reason-grid{display:flex;flex-wrap:wrap;gap:8px;}
.reason-grid span{font-size:12px;background:#f7f6f4;border-radius:100px;padding:7px 13px;color:#555;}

/* ===== TECH ARCH ===== */
#tech{background:var(--graphite);color:#fff;}
.tech-flow{display:flex;flex-direction:column;align-items:center;gap:0;max-width:420px;margin:0 auto;}
.tech-node{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px 22px;display:flex;align-items:center;gap:14px;backdrop-filter:blur(6px);transition:transform .35s,border-color .35s;}
.tech-node:hover{transform:translateX(6px);border-color:var(--orange);}
.tech-node .ti{width:38px;height:38px;border-radius:10px;background:var(--orange);display:flex;align-items:center;justify-content:center;flex:none;}
.tech-node h4{font-size:16px;font-weight:600;}
.tech-node p{font-size:14px;color:#aaa;}
.tech-connector{width:2px;height:30px;background:linear-gradient(180deg,var(--orange),rgba(255,94,21,.1));}

/* ===== TIMELINE HORIZONTAL ===== */
#timeline{background:#fff;}
.tl-h{
  display:flex;align-items:flex-start;justify-content:space-between;
  max-width:1000px;margin:0 auto;position:relative;padding-top:20px;
}
.tl-h-track{
  position:absolute;top:38px;left:8%;right:8%;height:3px;
  background:#ece9e7;border-radius:2px;overflow:hidden;
}
.tl-h-fill{
  height:100%;width:0;background:linear-gradient(90deg,var(--orange),#ffb27a);
  transition:width 2s cubic-bezier(.16,.8,.3,1);
}
.tl-h-item{flex:1;text-align:center;position:relative;z-index:1;padding:0 8px;}
.tl-h-dot{
  width:22px;height:22px;border-radius:50%;background:#fff;
  border:3px solid #ddd;margin:0 auto 18px;
  transition:border-color .4s, box-shadow .4s, transform .4s;
}
.tl-h-item.in .tl-h-dot{border-color:var(--orange);box-shadow:0 0 0 6px rgba(255,94,21,.15);transform:scale(1.1);}
.tl-h-item h4{font-size:18px;font-weight:700;margin-bottom:6px;}
.tl-h-item p{font-size:14px;color:var(--gray);max-width:180px;margin:0 auto;line-height:1.4;}
.tl{position:relative;max-width:900px;margin:0 auto;padding-left:30px;}
.tl::before{content:'';position:absolute;left:9px;top:6px;bottom:6px;width:2px;background:linear-gradient(180deg,var(--orange),#f1efee);}
.tl-item{position:relative;padding:0 0 42px 36px;}
.tl-item::before{content:'';position:absolute;left:-30px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--orange);}
.tl-item:last-child{padding-bottom:0;}
.tl-item h4{font-size:18px;font-weight:700;margin-bottom:6px;}
.tl-item p{font-size:15px;color:var(--gray);max-width:480px;}
.tl-tag{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--orange);background:#fff1e8;padding:3px 10px;border-radius:100px;margin-bottom:8px;}

/* ===== IMPACT BEFORE/AFTER ===== */
#impact{background:linear-gradient(160deg,#16110d,#0e0e0f 60%);color:#fff;}
.impact-compare{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
.impact-pair{
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  border-radius:20px;padding:28px 24px;text-align:center;
  transition:transform .4s, box-shadow .4s;
}
.impact-pair:hover{transform:translateY(-8px);box-shadow:0 20px 40px rgba(0,0,0,.3);}
.impact-side{font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:12px;}
.impact-side.after{color:var(--orange);}
.impact-value{font-size:clamp(28px,3vw,40px);font-weight:800;margin-bottom:6px;}
.impact-desc{font-size:16px;color:#c4c4c9;}
.impact-arrow{font-size:28px;color:var(--orange);margin:14px 0;line-height:1;}
.impact-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;}
.impact-card{text-align:center;padding:30px 14px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);}
.impact-num{font-family:'Inter',sans-serif;font-size:clamp(28px,3.6vw,44px);font-weight:800;color:var(--orange);}
.impact-card p{font-size:14px;color:#c4c4c9;margin-top:8px;}

/* ===== CLOSING / FOOTER ===== */
#closing{background:var(--black);color:#fff;text-align:center;flex-direction:column;justify-content:center;min-height:100vh;padding-bottom:60px;}
#closing .closing-title{font-size:clamp(28px,3.5vw,42px);font-weight:700;letter-spacing:-.5px;margin-bottom:8px;}
.closing-words{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 32px;margin:28px 0 40px;}
.closing-words span{font-size:clamp(20px,2.5vw,28px);font-weight:600;color:#fff;display:flex;align-items:center;gap:10px;}
.closing-words span::before{content:'+';color:var(--orange);font-weight:800;}
#closing h2{font-size:clamp(32px,4vw,56px);font-weight:800;letter-spacing:-1px;max-width:820px;margin:0 auto 20px;}
.closing-qr{width:140px;height:140px;background:repeating-conic-gradient(#fff 0deg 90deg, transparent 90deg 180deg);background-size:16px 16px;border-radius:16px;margin:30px auto 18px;padding:14px;background-color:#fff;}
.closing-foot{display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:20px;}
.closing-logo-chip{background:#fff;border-radius:12px;padding:12px 22px;display:flex;align-items:center;box-shadow:0 10px 26px rgba(0,0,0,.4);}
.closing-logo-chip img{height:38px;width:auto;display:block;}
footer.bottom{font-size:14px;color:#6e6e74;margin-top:40px;letter-spacing:.5px;padding-top:24px;border-top:1px solid rgba(255,255,255,.08);width:100%;max-width:600px;}

.svgicon{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

/* generic responsive */
@media (max-width:1000px){
  #problem .grid2,.app-grid{grid-template-columns:1fr;}
  .steps4{grid-template-columns:repeat(2,1fr);}
  .benefit-grid{grid-template-columns:repeat(2,1fr);}
  .dash-grid{grid-template-columns:1fr 1fr;}
  .dash-kpis{grid-template-columns:repeat(2,1fr);}
  .dash-kpi:nth-child(2){border-right:none;}
  .impact-compare{grid-template-columns:1fr;}
  .flow-h{flex-wrap:wrap;gap:24px;}
  .flow-h-line{display:none;}
  .tl-h{flex-direction:column;gap:24px;align-items:center;}
  .tl-h-track{display:none;}
  .phone-stage{margin-bottom:20px;}
}
@media (max-width:640px){
  section{padding:100px 6vw 60px;}
  .steps4,.benefit-grid,.dash-grid{grid-template-columns:1fr;}
  .dash-kpis{grid-template-columns:1fr;}
  .dash-kpi{border-right:none;border-bottom:1px solid #ece9e7;}
  .impact-grid{grid-template-columns:1fr 1fr;}
  .phone{width:290px;height:592px;}
  .hero h1{font-size:36px;}
  .hero p.sub{font-size:18px;}
}
@media (max-width:1000px){.impact-grid{grid-template-columns:repeat(2,1fr);}}
"""

content = content[:style_start] + NEW_CSS + content[style_end:]

# --- NAV HTML ---
nav_html = f'''<div class="nav-progress" id="navProgress"></div>
<nav class="nav" id="mainNav">
  <div class="nav-logo-chip"><img src="{nav_logo}" alt="Engenova"/></div>
  <ul class="nav-links">
    <li><a href="#solution">Solução</a></li>
    <li><a href="#benefits">Benefícios</a></li>
    <li><a href="#dashboard">Dashboard</a></li>
    <li><a href="#timeline">Cronograma</a></li>
    <li><a href="#closing" class="nav-cta">Solicitar Aprovação</a></li>
  </ul>
</nav>'''
content = re.sub(
    r'<div class="nav-progress" id="navProgress"></div>\s*<nav class="nav" id="mainNav">.*?</nav>',
    nav_html,
    content,
    count=1,
    flags=re.DOTALL,
)

# --- HERO HTML ---
hero_html = f'''<section id="hero">
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
</section>'''
content = re.sub(r'<section id="hero">.*?</section>', hero_html, content, count=1, flags=re.DOTALL)

# --- HOW section ---
how_html = '''<!-- TELA 5 — COMO FUNCIONA -->
<section id="how">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">Como Funciona</div>
      <h2>Do crachá à assinatura — em quatro passos.</h2>
    </div>
    <div class="flow-h" id="flowH">
      <div class="flow-h-item" data-delay="0">
        <div class="flow-h-ico">👤</div>
        <h4>Funcionário</h4>
        <p>Identificação via crachá ou matrícula.</p>
      </div>
      <div class="flow-h-line" id="flowLine1"></div>
      <div class="flow-h-item" data-delay="1">
        <div class="flow-h-ico">📱</div>
        <h4>QR</h4>
        <p>Leitura instantânea no aplicativo.</p>
      </div>
      <div class="flow-h-line" id="flowLine2"></div>
      <div class="flow-h-item" data-delay="2">
        <div class="flow-h-ico">📦</div>
        <h4>Entrega</h4>
        <p>Seleção e registro do EPI entregue.</p>
      </div>
      <div class="flow-h-line" id="flowLine3"></div>
      <div class="flow-h-item" data-delay="3">
        <div class="flow-h-ico">✍️</div>
        <h4>Assinatura</h4>
        <p>Confirmação digital do recebimento.</p>
      </div>
    </div>
  </div>
</section>'''
content = re.sub(r'<!-- TELA 5 — COMO FUNCIONA -->.*?</section>\s*\n\s*<!-- TELA 6', how_html + '\n\n<!-- TELA 6', content, count=1, flags=re.DOTALL)

# --- BENEFITS ---
benefits_html = '''<!-- TELA 7 — BENEFÍCIOS -->
<section id="benefits">
  <div class="wrap">
    <div class="sec-head compact reveal">
      <div class="eyebrow">Benefícios</div>
      <h2>Valor para cada área que toca o processo.</h2>
      <p class="sec-sub">Menos burocracia, mais controle e indicadores prontos para decisão.</p>
    </div>
    <div class="benefit-grid">
      <div class="benefit-card reveal reveal-d1">
        <div class="benefit-ico">👥</div>
        <div class="benefit-tag">RH</div><h4>Menos burocracia</h4>
        <p>Histórico completo e auditorias simplificadas, sem papel.</p>
        <ul><li>Menos papel</li><li>Histórico completo</li><li>Auditorias simplificadas</li></ul>
      </div>
      <div class="benefit-card reveal reveal-d2">
        <div class="benefit-ico">🛡️</div>
        <div class="benefit-tag">Segurança do Trabalho</div><h4>Mais evidência</h4>
        <p>Evidências digitais e controle por colaborador.</p>
        <ul><li>Evidências digitais</li><li>Controle por colaborador</li><li>Indicadores de consumo</li></ul>
      </div>
      <div class="benefit-card reveal reveal-d3">
        <div class="benefit-ico">⚡</div>
        <div class="benefit-tag">Almoxarifado</div><h4>Mais agilidade</h4>
        <p>Atendimento mais rápido com menos erros operacionais.</p>
        <ul><li>Atendimento mais rápido</li><li>Menos erros</li><li>Controle de estoque</li></ul>
      </div>
      <div class="benefit-card reveal reveal-d4">
        <div class="benefit-ico">📊</div>
        <div class="benefit-tag">Diretoria</div><h4>Mais governança</h4>
        <p>Indicadores em tempo real para redução de custos.</p>
        <ul><li>Indicadores em tempo real</li><li>Redução de custos</li><li>Governança</li></ul>
      </div>
    </div>
  </div>
</section>'''
content = re.sub(r'<!-- TELA 7 — BENEFÍCIOS -->.*?</section>\s*\n\s*<!-- TELA 8', benefits_html + '\n\n<!-- TELA 8', content, count=1, flags=re.DOTALL)

# --- DASHBOARD KPIs ---
dash_kpi = '''    <div class="dash-kpis reveal" id="dashKpis">
      <div class="dash-kpi reveal reveal-d1">
        <div class="dash-kpi-num" data-count="125">0</div>
        <div class="dash-kpi-label">Entregas Hoje</div>
        <div class="dash-kpi-bar"></div>
      </div>
      <div class="dash-kpi reveal reveal-d2">
        <div class="dash-kpi-num orange" data-count="97" data-suffix="%">0</div>
        <div class="dash-kpi-label">Conformidade</div>
        <div class="dash-kpi-bar"></div>
      </div>
      <div class="dash-kpi reveal reveal-d3">
        <div class="dash-kpi-num" data-count="18">0</div>
        <div class="dash-kpi-label">Funcionários</div>
        <div class="dash-kpi-bar"></div>
      </div>
      <div class="dash-kpi reveal reveal-d4">
        <div class="dash-kpi-num orange" data-count="18450" data-prefix="R$ " data-format="money">0</div>
        <div class="dash-kpi-label">Consumo</div>
        <div class="dash-kpi-bar"></div>
      </div>
    </div>
'''
content = re.sub(
    r'(<section id="dashboard" class="section-gray">\s*<div class="wrap">\s*<div class="sec-head reveal">.*?</div>\s*)',
    r'\1' + dash_kpi,
    content,
    count=1,
    flags=re.DOTALL,
)

# --- IMPACT ---
impact_html = '''<!-- TELA 11 — IMPACTO ESPERADO -->
<section id="impactSec"></section>

<section id="impact">
  <div class="wrap">
    <div class="sec-head reveal" style="margin-left:auto;margin-right:auto;text-align:center;">
      <div class="eyebrow" style="justify-content:center;">Impacto Esperado</div>
      <h2>Resultados que se sentem desde a primeira semana.</h2>
    </div>
    <div class="impact-compare">
      <div class="impact-pair reveal reveal-d1">
        <div class="impact-side">Antes</div>
        <div class="impact-value">🗂 Papel</div>
        <div class="impact-desc">Processos manuais e formulários físicos</div>
        <div class="impact-arrow">↓</div>
        <div class="impact-side after">Depois</div>
        <div class="impact-value">📱 Digital</div>
        <div class="impact-desc">100% registrado no sistema</div>
      </div>
      <div class="impact-pair reveal reveal-d2">
        <div class="impact-side">Antes</div>
        <div class="impact-value">3 minutos</div>
        <div class="impact-desc">Tempo médio por entrega manual</div>
        <div class="impact-arrow">↓</div>
        <div class="impact-side after">Depois</div>
        <div class="impact-value">20 segundos</div>
        <div class="impact-desc">Atendimento ágil no almoxarifado</div>
      </div>
      <div class="impact-pair reveal reveal-d3">
        <div class="impact-side">Antes</div>
        <div class="impact-value">Busca Manual</div>
        <div class="impact-desc">Arquivos físicos e planilhas</div>
        <div class="impact-arrow">↓</div>
        <div class="impact-side after">Depois</div>
        <div class="impact-value">Pesquisa Instantânea</div>
        <div class="impact-desc">Histórico completo em segundos</div>
      </div>
    </div>
  </div>
</section>'''
content = re.sub(r'<!-- TELA 11 — IMPACTO ESPERADO -->.*?</section>\s*\n\s*<!-- TELA 12', impact_html + '\n\n<!-- TELA 12', content, count=1, flags=re.DOTALL)

# --- TIMELINE ---
timeline_html = '''<!-- TELA 10 — EVOLUÇÃO DO PROJETO -->
<section id="timeline">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">Evolução do Projeto</div>
      <h2>Um roteiro claro, do MVP à inteligência de dados.</h2>
    </div>
    <div class="tl-h" id="tlH">
      <div class="tl-h-track"><div class="tl-h-fill" id="tlFill"></div></div>
      <div class="tl-h-item reveal reveal-d1">
        <div class="tl-h-dot"></div>
        <h4>MVP</h4>
        <p>Fluxo essencial de identificação, seleção e assinatura.</p>
      </div>
      <div class="tl-h-item reveal reveal-d2">
        <div class="tl-h-dot"></div>
        <h4>Piloto</h4>
        <p>Validação em unidade real com ajustes diários.</p>
      </div>
      <div class="tl-h-item reveal reveal-d3">
        <div class="tl-h-dot"></div>
        <h4>Produção</h4>
        <p>Integração com estoque e ERP corporativo.</p>
      </div>
      <div class="tl-h-item reveal reveal-d4">
        <div class="tl-h-dot"></div>
        <h4>Dashboard</h4>
        <p>Business Intelligence e indicadores avançados.</p>
      </div>
    </div>
  </div>
</section>'''
content = re.sub(r'<!-- TELA 10 — EVOLUÇÃO DO PROJETO -->.*?</section>\s*\n\s*<!-- TELA 11', timeline_html + '\n\n<!-- TELA 11', content, count=1, flags=re.DOTALL)

# --- CLOSING ---
closing_html = f'''<!-- TELA 12 — ENCERRAMENTO -->
<section id="closing">
  <div class="closing-title reveal">Controle Digital de EPIs</div>
  <div class="closing-words reveal reveal-d1">
    <span>Mais Segurança</span><span>Mais Agilidade</span><span>Mais Controle</span><span>Mais Governança</span>
  </div>
  <div class="closing-foot reveal reveal-d2">
    <div class="closing-logo-chip"><img src="{closing_logo}" alt="Engenova"/></div>
  </div>
  <footer class="bottom reveal reveal-d3">© Engenova — Controle Digital de Entrega de EPIs</footer>
</section>'''
content = re.sub(r'<!-- TELA 12 — ENCERRAMENTO -->.*?</section>\s*\n\s*<script>', closing_html + '\n\n<script>', content, count=1, flags=re.DOTALL)

# --- SCRIPT ---
new_script = r'''<script>
// nav scroll: hide on down, show on up + progress + parallax
const nav = document.getElementById('mainNav');
const progress = document.getElementById('navProgress');
let lastScrollY = window.scrollY;
window.addEventListener('scroll', ()=>{
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  if(y > lastScrollY && y > 120) nav.classList.add('nav-hidden');
  else nav.classList.remove('nav-hidden');
  lastScrollY = y;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (y / h * 100) + '%';
  const bg = document.getElementById('parallaxBg');
  const grid = document.getElementById('parallaxGrid');
  if(bg) bg.style.transform = 'translateY(' + (y*0.25) + 'px)';
  if(grid) grid.style.transform = 'translateY(' + (y*0.12) + 'px)';
},{passive:true});

// reveal on scroll
const revealEls = document.querySelectorAll('.reveal, .reveal-zoom');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); } });
},{threshold:0.12});
revealEls.forEach(el=>io.observe(el));

// flow horizontal stagger
const flowH = document.getElementById('flowH');
if(flowH){
  const flowIo = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      flowH.querySelectorAll('.flow-h-item').forEach((item,i)=>{
        setTimeout(()=>item.classList.add('in'), i*180);
      });
      flowH.querySelectorAll('.flow-h-line').forEach((line,i)=>{
        setTimeout(()=>line.classList.add('in'), i*180+120);
      });
      flowIo.disconnect();
    });
  },{threshold:0.25});
  flowIo.observe(flowH);
}

// timeline horizontal draw
const tlH = document.getElementById('tlH');
if(tlH){
  const tlIo = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const fill = document.getElementById('tlFill');
      if(fill) fill.style.width = '100%';
      tlH.querySelectorAll('.tl-h-item').forEach((item,i)=>{
        setTimeout(()=>item.classList.add('in'), i*350);
      });
      tlIo.disconnect();
    });
  },{threshold:0.3});
  tlIo.observe(tlH);
}

// animated KPI counters
function animateCounter(el){
  const target = +el.dataset.count;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const fmt = el.dataset.format;
  const dur = 1400;
  const start = performance.now();
  function tick(now){
    const p = Math.min((now-start)/dur, 1);
    const eased = 1 - Math.pow(1-p, 3);
    let val = Math.round(target * eased);
    if(fmt === 'money') val = val.toLocaleString('pt-BR');
    el.textContent = prefix + val + suffix;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const dashKpis = document.getElementById('dashKpis');
if(dashKpis){
  const kpiIo = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      dashKpis.querySelectorAll('.dash-kpi').forEach(k=>k.classList.add('in'));
      dashKpis.querySelectorAll('[data-count]').forEach(animateCounter);
      kpiIo.disconnect();
    });
  },{threshold:0.3});
  kpiIo.observe(dashKpis);
}

// animate bar charts / donuts / line / rank when in view
const animTargets = document.querySelectorAll('#dashboard');
const dashIo = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      document.querySelectorAll('.bar-chart .bar').forEach((b,i)=>{
        setTimeout(()=>{ b.style.transform = 'scaleY(' + (b.dataset.h/100) + ')'; }, i*80);
      });
      document.querySelectorAll('.rank-row .rb i').forEach((i,idx)=>{
        setTimeout(()=>{ i.style.width = i.dataset.w + '%'; }, idx*100);
      });
      const lc = document.getElementById('lineChart');
      if(lc) lc.style.strokeDashoffset = '0';
      dashIo.disconnect();
    }
  });
},{threshold:0.2});
animTargets.forEach(el=>dashIo.observe(el));

// phone carousel
const screens = document.querySelectorAll('#phoneScreens .screen-slide');
const appLis = document.querySelectorAll('.app-li');
const dotsWrap = document.getElementById('phoneDots');
if(dotsWrap && screens.length){
  screens.forEach((s,i)=>{
    const d = document.createElement('div');
    d.className = 'd' + (i===0 ? ' active' : '');
    d.addEventListener('click', ()=>setSlide(i));
    dotsWrap.appendChild(d);
  });
}
let current = 0;
let autoplay;
function setSlide(i){
  current = i;
  screens.forEach(s=>s.classList.toggle('active', +s.dataset.i === i));
  appLis.forEach(a=>a.classList.toggle('active', +a.dataset.i === i));
  document.querySelectorAll('.phone-dots .d').forEach((d,di)=>d.classList.toggle('active', di === i));
  // sync hero preview
  const heroImg = document.getElementById('heroPhoneImg');
  const activeSlide = screens[i];
  if(heroImg && activeSlide){
    const img = activeSlide.querySelector('img');
    if(img && img.src){ heroImg.src = img.src; heroImg.style.display = 'block'; }
  }
}
appLis.forEach(a=>a.addEventListener('click', ()=>{ setSlide(+a.dataset.i); restartAutoplay(); }));
function restartAutoplay(){
  clearInterval(autoplay);
  if(screens.length) autoplay = setInterval(()=>{ setSlide((current+1) % screens.length); }, 3200);
}
if(screens.length){ setSlide(0); restartAutoplay(); }

// stagger card reveals in grids
document.querySelectorAll('.benefit-grid, .data-grid').forEach(grid=>{
  grid.querySelectorAll('.reveal').forEach((el,i)=>{ el.style.transitionDelay = (i*0.08)+'s'; });
});
</script>'''

content = re.sub(r'<script>.*?</script>\s*</body>', new_script + '\n</body>', content, count=1, flags=re.DOTALL)

PATH.write_text(content, encoding="utf-8")
print("Done. File size:", PATH.stat().st_size)
