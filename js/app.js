// ── APP: ініціалізація, перемикання табів, пошук, reset ──

const app = {

  async init(){
    const loadingTxt = document.getElementById('loading-txt');
    const loadingSub = document.getElementById('loading-sub');

    try {
      if(loadingTxt) loadingTxt.textContent = 'Завантаження даних...';
      if(loadingSub) loadingSub.textContent = 'Підготовка карти...';

      // 1. Завантажити станції з all_stations.js (статичний масив)
      if(typeof ALL_STATIONS === 'undefined' || !ALL_STATIONS.length){
        throw new Error('all_stations.js не завантажено');
      }
      APP.all = ALL_STATIONS.map(s=>({ ...s, _type:(s.type||'other').toLowerCase() }));
      APP.withCoords = APP.all.filter(s=>s.lat && s.lon);

      // 2. Побудувати статистику по областях
      buildOblastStats(APP.all);

      // 3. Ініціалізувати карту
      mapInit();

      // 4. Маркери
      buildMarkers('all','all');

      // 5. GeoJSON меж областей (асинхронно, не блокує решту)
      loadGeoJSON();

      // 6. Ініціалізувати панелі
      overview.init();
      oblast.init();
      registry.init();
      market.init();
      updateForm.init();

      // 7. Пошук у топбарі карти
      this._initSearch();

      // 8. Контроли карти (фільтри типу і точності)
      this._initMapControls();

      // 9. Кнопки tabів і expand
      this._initTabs();

      // 10. Кнопка «← Реєстр» у topbar
      document.getElementById('goto-registry-btn')?.addEventListener('click',()=>{
        this.switchTab('station');
        registry.backToList();
      });

      // 11. Кнопка «Скинути»
      document.getElementById('reset-btn')?.addEventListener('click',()=>this.reset());

      // 12. Кнопка «← Всі області»
      document.getElementById('ob-back')?.addEventListener('click',()=>oblast.back());

    } catch(err) {
      console.error('APP init error:', err);
      if(loadingTxt) loadingTxt.textContent = 'Помилка завантаження';
      if(loadingSub) loadingSub.textContent = 'Не вдалось завантажити данi з бази. Перевiрте конфiгурацiю у js/config.js.';
      // Не ховаємо overlay — користувач бачить повідомлення
    }
  },

  // ── Таби ─────────────────────────────────────────────

  switchTab(tabName){
    document.querySelectorAll('.ptab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tabName));
    document.querySelectorAll('.tpanel').forEach(p=>p.classList.toggle('active', p.id==='tab-'+tabName));

    const fullPanelTabs = ['station','market'];
    this.setFullPanel(fullPanelTabs.includes(tabName));

    if(tabName==='station'){
      document.getElementById('panel-title').innerHTML = 'Реєстр <em>станцiй</em>';
    }
  },

  setFullPanel(val){
    APP.isFullPanel = val;
    document.getElementById('main').classList.toggle('full-panel', val);
    if(!val && APP.leafletMap?.invalidateSize) {
      setTimeout(()=>APP.leafletMap.invalidateSize(), 260);
    }
  },

  // ── Reset ─────────────────────────────────────────────

  reset(){
    APP.selectedOblast = null;
    APP.selectedStation = null;
    resetOblastStyles();
    APP.leafletMap.flyTo([48.5,31.5], 6, {duration:0.8});
    document.getElementById('ob-browse').style.display = 'block';
    document.getElementById('ob-detail-wrap').style.display = 'none';
    document.getElementById('st-list-wrap').style.display = 'flex';
    document.getElementById('st-detail-wrap').style.display = 'none';
    document.getElementById('panel-title').innerHTML = 'Вся <em>Украiна</em>';
    this.switchTab('overview');
  },

  // ── Пошук у топбарі ──────────────────────────────────

  _initSearch(){
    const inp = document.getElementById('srch-inp');
    const res = document.getElementById('srch-res');
    if(!inp||!res) return;

    inp.addEventListener('input',()=>{
      const q = inp.value.trim().toLowerCase();
      if(q.length<2){ res.classList.remove('open'); return; }
      const hits = APP.all.filter(s=>
        stationName(s).toLowerCase().includes(q)||
        (s.company_name||s.company||'').toLowerCase().includes(q)
      ).slice(0,10);
      if(!hits.length){ res.classList.remove('open'); return; }
      res.innerHTML = hits.map((s,i)=>
        `<div class="sri" data-i="${i}">
          <div class="sri-name">${shortName(stationName(s))}</div>
          <div class="sri-meta">${typeLabel(s._type)} · ${s.oblast||s.region||'—'} · ${s.capacity_mw?s.capacity_mw+' МВт':'—'}</div>
        </div>`
      ).join('');
      res.classList.add('open');
      res.querySelectorAll('.sri').forEach((item,i)=>{
        item.addEventListener('click',()=>{
          APP.stBackTo='overview';
          registry.showDetail(hits[i]);
          inp.value='';
          res.classList.remove('open');
        });
      });
    });
    document.addEventListener('click',e=>{ if(!inp.contains(e.target)&&!res.contains(e.target)) res.classList.remove('open'); });
  },

  // ── Контроли карти ───────────────────────────────────

  _initMapControls(){
    let typeFilter = 'all', geoFilter = 'all';

    document.querySelectorAll('.fbtn[data-type]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        typeFilter = btn.dataset.type;
        document.querySelectorAll('.fbtn[data-type]').forEach(b=>{
          b.className='fbtn'+(b.dataset.type==='all'&&typeFilter==='all'?' fa':b.dataset.type===typeFilter?' f'+b.dataset.type.charAt(0):'');
        });
        buildMarkers(typeFilter, geoFilter);
      });
    });

    document.querySelectorAll('.fbtn[data-geo]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        geoFilter = btn.dataset.geo;
        document.querySelectorAll('.fbtn[data-geo]').forEach(b=>b.classList.toggle('fa', b.dataset.geo===geoFilter));
        buildMarkers(typeFilter, geoFilter);
      });
    });
  },

  // ── Ініціалізація табів і expand ─────────────────────

  _initTabs(){
    document.querySelectorAll('.ptab').forEach(t=>{
      t.addEventListener('click',()=>this.switchTab(t.dataset.tab));
    });
    document.getElementById('expand-btn')?.addEventListener('click',()=>this.setFullPanel(!APP.isFullPanel));
  },
};

// Старт
app.init();
