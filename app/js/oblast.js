// ── OBLAST: таб «Область» ──

const oblast = {
  init(){
    const el = document.getElementById('ob-browse-list');
    if(!el || el.children.length>0) return;
    APP.oblastList.forEach((ob,i)=>{
      const pct = ob.mw>0 ? Math.max(5,(ob.mw/APP.maxMw)*100) : 0;
      const item = document.createElement('div');
      item.className = 'ob-item';
      item.innerHTML =
        `<span class="ob-rank">${i+1}</span>`+
        `<span class="ob-name">${ob.name}</span>`+
        `<div class="ob-barw"><div class="ob-bar" style="width:${pct}%"></div></div>`+
        `<span class="ob-mw">${ob.mw>0?fmt(ob.mw)+' МВт у джер.':ob.total+' ст.'}</span>`;
      item.addEventListener('click',()=>this.select(ob.name));
      el.appendChild(item);
    });
  },

  select(regionName){
    APP.selectedOblast = regionName;
    highlightOblast(regionName);

    const ob = APP.oblastStats[regionName];
    const detailEl = document.getElementById('ob-detail');
    if(!ob){
      detailEl.innerHTML = `<div class="empty">Станцiй для цiєї областi не знайдено</div>`;
    } else {
      const sorted = [...ob.stations].sort((a,b)=>(b.capacity_mw||0)-(a.capacity_mw||0));
      const withCoordCount = sorted.filter(s=>s.lat&&s.lon).length;
      const exactCount     = sorted.filter(s=>s.lat&&s.lon&&!s.is_approximate).length;
      const contactCount   = sorted.filter(s=>s.contact_phone||s.phone||s.contact_email||s.website).length;

      detailEl.innerHTML =
        `<div class="od-hdr">
          <div class="od-name">${regionName}</div>
          <div class="od-stats">
            <div><div class="od-sv">${ob.total}</div><div class="od-sl">Станцiй</div></div>
            <div><div class="od-sv">${ob.mw>0?fmt(ob.mw):'—'}</div><div class="od-sl">МВт у джерелах</div></div>
            <div><div class="od-sv">${withCoordCount}</div><div class="od-sl">На картi</div></div>
            <div><div class="od-sv">${exactCount}</div><div class="od-sl">Точнi</div></div>
            <div><div class="od-sv">${contactCount}</div><div class="od-sl">З контактом</div></div>
          </div>
        </div>`+
        (ob.solar>0&&ob.wind>0?
          `<div class="type-split">
            <div class="ts-box"><div class="ts-val ac">${ob.solar}</div><div class="ts-lbl">СЕС · ${fmt(ob.sMw)} МВт</div></div>
            <div class="ts-box"><div class="ts-val bc">${ob.wind}</div><div class="ts-lbl">ВЕС · ${fmt(ob.wMw)} МВт</div></div>
          </div>`:'')+
        `<div class="secttl">Станцiї (${ob.total})</div>`+
        sorted.map((s,i)=>
          `<div class="st-item" data-i="${i}">
            <div class="sti-top">
              <div class="tdot ${s._type}"></div>
              <div class="st-name">${shortName(stationName(s))}</div>
              <div class="st-mw">${s.capacity_mw?fmt(s.capacity_mw)+' МВт':'<span style="color:var(--muted)">—</span>'}</div>
            </div>
            <div class="st-meta">${typeLabel(s._type)} · ${s.license_date||'—'}${!s.lat?' · <span style="color:var(--muted)">без координат</span>':''}</div>
          </div>`
        ).join('');

      detailEl.querySelectorAll('.st-item').forEach((item,i)=>{
        item.addEventListener('click',()=>{ APP.stBackTo='oblast'; registry.showDetail(sorted[i]); });
      });
    }

    document.getElementById('ob-browse').style.display = 'none';
    document.getElementById('ob-detail-wrap').style.display = 'block';
    app.switchTab('oblast');
    document.getElementById('panel-title').innerHTML = `<em>${regionName}</em>`;
  },

  back(){
    APP.selectedOblast = null;
    resetOblastStyles();
    APP.leafletMap.flyTo([48.5,31.5], 6, { duration:0.8 });
    document.getElementById('ob-browse').style.display = 'block';
    document.getElementById('ob-detail-wrap').style.display = 'none';
    document.getElementById('panel-title').innerHTML = 'Вся <em>Украiна</em>';
  }
};
