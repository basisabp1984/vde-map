// ── MARKET: таб «Трейдинг» — графіки Chart.js, тікер, калькулятор ──

const market = {
  init(){
    this._clock();
    setInterval(()=>this._clock(), 1000);
    this._ticker();
    if(typeof Chart !== 'undefined'){
      this._charts();
      this._calculator();
      this._matchMetrics();
    } else {
      document.querySelectorAll('.market-chart').forEach(w=>{
        w.innerHTML = `<div class="state-note compact"><b>Графiк недоступний.</b><br>Chart.js не завантажився.</div>`;
      });
    }
    document.getElementById('calc-btn')?.addEventListener('click',()=>this._runCalc());
  },

  _clock(){
    const now = new Date();
    const el1 = document.getElementById('market-date');
    const el2 = document.getElementById('market-time');
    if(el1) el1.textContent = now.toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric'});
    if(el2) el2.textContent = now.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit',second:'2-digit'})+' EET';
  },

  _ticker(){
    const items = [
      {name:'РДН Base',val:'4 124',unit:'грн/МВт',delta:'+2.1%',up:true},
      {name:'РДН Peak',val:'5 280',unit:'грн/МВт',delta:'+4.3%',up:true},
      {name:'ВДР',val:'4 510',unit:'грн/МВт',delta:'+1.8%',up:true},
      {name:'БР Дефiцит',val:'6 140',unit:'грн/МВт',delta:'+8.2%',up:true},
      {name:'HU DAM',val:'82.4',unit:'€/МВт',delta:'-1.2%',up:false},
      {name:'RO DAM',val:'79.1',unit:'€/МВт',delta:'-0.5%',up:false},
      {name:'UAH/EUR',val:'44.12',unit:'',delta:'+0.3%',up:true},
      {name:'Iмпорт',val:'750',unit:'МВт',delta:'+50',up:true},
      {name:'Навантаж.',val:'14 230',unit:'МВт',delta:'-2.1%',up:false},
    ];
    const el = document.getElementById('market-ticker-inner');
    if(!el) return;
    let html = '';
    for(let i=0;i<2;i++){
      items.forEach(t=>{
        html += `<div class="market-tick"><span class="name">${t.name}</span><span class="val">${t.val} <span style="color:var(--label);font-size:9px">${t.unit}</span></span><span class="${t.up?'up':'down'}">${t.delta}</span></div>`;
      });
    }
    el.innerHTML = html;
  },

  _charts(){
    const hours = Array.from({length:24},(_,i)=>i+':00');
    const cfg = (labels,datasets,opts={})=>({
      type:'line',
      data:{labels,datasets},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:datasets.length>1,labels:{font:{family:'IBM Plex Mono',size:9},color:'#4a5568',boxWidth:12,padding:10}}},
        scales:{
          x:{grid:{color:'rgba(14,34,64,0.06)'},ticks:{font:{family:'IBM Plex Mono',size:8},color:'#8a9ab0',maxTicksLimit:8}},
          y:{grid:{color:'rgba(14,34,64,0.06)'},ticks:{font:{family:'IBM Plex Mono',size:8},color:'#8a9ab0'}},
        },
        elements:{point:{radius:0},line:{tension:0.35}},
        ...opts
      }
    });

    const dam=[3800,3700,3600,3550,3600,3700,3900,4100,4300,4500,4700,4600,4400,4200,4100,4000,4200,4500,4800,5000,4900,4700,4400,4100];
    const vdr=[3900,3780,3650,3590,3640,3720,3950,4150,4350,4580,4760,4650,4480,4260,4180,4050,4280,4600,4870,5100,4960,4740,4480,4150];
    const br= [4200,4100,3950,3800,3900,4000,4300,4600,4900,5200,5400,5200,4900,4600,4400,4200,4600,5100,5500,5800,5600,5300,4900,4400];

    new Chart(document.getElementById('chart-dam').getContext('2d'), cfg(hours,[
      {label:'РДН',data:dam,borderColor:'#d4a832',backgroundColor:'rgba(212,168,50,0.07)',borderWidth:2,fill:true},
    ]));
    new Chart(document.getElementById('chart-idm').getContext('2d'), cfg(hours,[
      {label:'РДН',data:dam,borderColor:'#d4a832',borderWidth:1.5},
      {label:'ВДР',data:vdr,borderColor:'#4a90d9',borderWidth:1.5},
      {label:'БР',data:br,borderColor:'#c0392b',borderWidth:1.5,borderDash:[4,3]},
    ]));

    const solar=[0,0,0,0,0,0,0.02,0.08,0.22,0.42,0.62,0.78,0.85,0.82,0.72,0.55,0.35,0.14,0.03,0,0,0,0,0].map(v=>+(v*100).toFixed(1));
    const wind =[55,58,62,65,60,55,50,48,45,42,40,38,42,48,52,56,60,65,68,65,62,60,58,56];
    new Chart(document.getElementById('chart-solar').getContext('2d'), cfg(hours,[
      {label:'СЕС %',data:solar,borderColor:'#d4a832',backgroundColor:'rgba(212,168,50,0.12)',borderWidth:2,fill:true},
    ]));
    new Chart(document.getElementById('chart-wind').getContext('2d'), cfg(hours,[
      {label:'ВЕС %',data:wind,borderColor:'#4a90d9',backgroundColor:'rgba(74,144,217,0.12)',borderWidth:2,fill:true},
    ]));

    const cons=[70,68,66,65,67,72,78,82,85,84,82,80,78,76,75,76,80,85,88,86,84,80,76,73];
    const gen=solar.map((v,i)=>+(v*0.6+wind[i]*0.4).toFixed(1));
    new Chart(document.getElementById('chart-match').getContext('2d'), cfg(hours,[
      {label:'Споживання',data:cons,borderColor:'#1a3a6a',borderWidth:1.5},
      {label:'Генерацiя',data:gen,borderColor:'#22a06b',backgroundColor:'rgba(34,160,107,0.1)',borderWidth:2,fill:true},
    ]));

    const debtYears=['2020','2021','2022','2023','2024','2025'];
    const debtVal=[8,12,15,18,21,22];
    new Chart(document.getElementById('chart-debt').getContext('2d'),{
      type:'bar',
      data:{labels:debtYears,datasets:[{label:'млрд грн',data:debtVal,backgroundColor:'rgba(192,57,43,0.7)',borderColor:'#c0392b',borderWidth:1}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#8a9ab0'}},y:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#8a9ab0'}}}},
    });

    const cbamYears=['2025','2026','2027','2028','2029','2030'];
    const cbamVal=[0.5,1.2,2.5,4.0,6.5,10];
    new Chart(document.getElementById('chart-cbam').getContext('2d'),{
      type:'line',
      data:{labels:cbamYears,datasets:[{label:'ТВт·год',data:cbamVal,borderColor:'#4a90d9',backgroundColor:'rgba(74,144,217,0.1)',borderWidth:2,fill:true}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},elements:{point:{radius:3},line:{tension:0.3}},scales:{x:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#8a9ab0'}},y:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#8a9ab0'}}}},
    });
  },

  _matchMetrics(){
    const metrics = [{id:'metric-coverage',bar:'bar-coverage',val:72},{id:'metric-util',bar:'bar-util',val:58},{id:'metric-risk',bar:'bar-risk',val:24}];
    metrics.forEach(m=>{
      const el = document.getElementById(m.id);
      const bar = document.getElementById(m.bar);
      if(el) el.textContent = m.val+'%';
      if(bar) bar.style.width = m.val+'%';
    });
    const needle = document.getElementById('gauge-needle');
    const gnum   = document.getElementById('gauge-num');
    const risk = 24;
    if(needle){
      const angle = -90 + (risk/100)*180;
      const rad = angle*Math.PI/180;
      const x2 = 85+55*Math.cos(rad);
      const y2 = 80+55*Math.sin(rad);
      needle.setAttribute('x2',x2.toFixed(1));
      needle.setAttribute('y2',y2.toFixed(1));
    }
    if(gnum) gnum.textContent = risk+'%';
  },

  _calculator(){},

  _runCalc(){
    const mw   = parseFloat(document.getElementById('inp-mw')?.value)||0;
    const ppa  = parseFloat(document.getElementById('inp-ppa')?.value)||0;
    const kf   = parseFloat(document.getElementById('inp-kf')?.value)||0;
    const sell = parseFloat(document.getElementById('inp-sell')?.value)||0;
    if(!mw||!ppa||!kf||!sell) return;

    const hours   = mw * kf * 8760;
    const buyCost = ppa * hours;
    const sellRev = sell * hours;
    const damBuy  = 4285 * hours;

    const bilMargin  = (sellRev - buyCost) / 1e6;
    const damMargin  = (sellRev - damBuy)  / 1e6;
    const bilMonth   = bilMargin / 12;
    const damMonth   = damMargin / 12;
    const isBilBetter = bilMargin > damMargin;

    const fmtM = v => (v>=0?'+':'')+v.toFixed(2)+' млн грн/рiк';
    const fmtMo = v => (v>=0?'+':'')+v.toFixed(2)+' млн/мiс';

    const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    set('ev-margin', fmtM(bilMargin));
    set('ev-month',  fmtMo(bilMonth));
    set('ev-dam-margin', fmtM(damMargin));
    set('ev-dam-month',  fmtMo(damMonth));

    const bilBox = document.getElementById('econ-bilateral');
    const damBox = document.getElementById('econ-dam');
    const badge  = document.getElementById('ev-badge');
    if(bilBox && damBox){
      bilBox.className = 'econ-box'+(isBilBetter?' winner':'');
      damBox.className = 'econ-box'+(!isBilBetter?' winner':'');
    }
    if(badge) badge.style.display = isBilBetter?'inline-block':'none';
  },
};
