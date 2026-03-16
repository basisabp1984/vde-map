// ── OVERVIEW: таб «Огляд» ──

const overview = {
  init(){
    const all = APP.all;
    const solar_n = all.filter(x=>x._type==='solar').length;
    const wind_n  = all.filter(x=>x._type==='wind').length;
    const totalMw  = all.reduce((s,x)=>s+(x.capacity_mw||0), 0);
    const solarMwT = all.filter(x=>x._type==='solar').reduce((s,x)=>s+(x.capacity_mw||0), 0);
    const windMwT  = all.filter(x=>x._type==='wind').reduce((s,x)=>s+(x.capacity_mw||0), 0);
    const mwCount  = all.filter(x=>x.capacity_mw).length;
    const exact    = APP.withCoords.filter(s=>!s.is_approximate).length;
    const approx   = APP.withCoords.filter(s=>s.is_approximate).length;
    const oblastOnlyCount = Object.keys(APP.oblastStats).filter(r=>r!=='АР Крим'&&r!=='м. Київ').length;
    const hasCrimea = APP.oblastStats['АР Крим'] ? 1 : 0;
    const hasKyiv   = APP.oblastStats['м. Київ']  ? 1 : 0;
    const unknownCount = all.filter(s=>!s.oblast && !s.region).length;

    // Topbar
    document.getElementById('h-st').textContent = all.length;
    document.getElementById('h-mw').textContent = fmt(totalMw)+' МВт';
    document.getElementById('h-mw-sub').textContent = `${mwCount} записiв з МВт (${Math.round(mwCount/all.length*100)}%)`;
    document.getElementById('h-ob').textContent = oblastOnlyCount;
    document.getElementById('h-ob-sub').textContent = `Крим: ${hasCrimea} · Київ: ${hasKyiv} · Невiдомо: ${unknownCount}`;
    document.getElementById('h-solar-pill').textContent = solar_n+' СЕС';
    document.getElementById('h-wind-pill').textContent  = wind_n+' ВЕС';

    // Market strip
    document.getElementById('ms-solar').textContent = solar_n;
    document.getElementById('ms-solar-mw').textContent = solarMwT>0?fmt(solarMwT)+' МВт у джерелах':'—';
    document.getElementById('ms-wind').textContent  = wind_n;
    document.getElementById('ms-wind-mw').textContent  = windMwT>0?fmt(windMwT)+' МВт у джерелах':'—';

    // Overview tab
    document.getElementById('ov-total').textContent = all.length;
    document.getElementById('ov-mw').textContent    = fmt(totalMw);
    document.getElementById('ov-solar').textContent = solar_n;
    document.getElementById('ov-wind').textContent  = wind_n;

    // Loading sub
    document.getElementById('loading-sub').textContent =
      `Точних точок: ${exact}. Приблизних: ${approx}. МВт задокументовано для ${mwCount} станцiй.`;

    // Capbar
    if(totalMw>0){
      const sp = Math.round(solarMwT/totalMw*100);
      document.getElementById('cap-pct-lbl').textContent = 'СЕС '+sp+'% · ВЕС '+(100-sp)+'%';
      document.getElementById('capbar').innerHTML =
        `<div style="flex:${solarMwT};background:var(--amber)"></div>`+
        `<div style="flex:${windMwT};background:var(--blue2)"></div>`;
    }

    // Топ областей у вкладці Огляд
    const obListEl = document.getElementById('ob-list');
    APP.oblastList.slice(0,12).forEach((ob,i)=>{
      const pct = ob.mw>0 ? Math.max(5,(ob.mw/APP.maxMw)*100) : 0;
      const el = document.createElement('div');
      el.className='ob-item';
      el.innerHTML =
        `<span class="ob-rank">${i+1}</span>`+
        `<span class="ob-name">${ob.name}</span>`+
        `<div class="ob-barw"><div class="ob-bar" style="width:${pct}%"></div></div>`+
        `<span class="ob-mw">${ob.mw>0?fmt(ob.mw)+' МВт у джер.':ob.total+' ст.'}</span>`;
      el.addEventListener('click',()=>oblast.select(ob.name));
      obListEl.appendChild(el);
    });
  }
};
