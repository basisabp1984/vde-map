// ── REGISTRY: таб «Станція» — фільтри, список, деталь ──

const ALL_SORTED_REF = { arr: [] }; // ліниво заповнюється при init

const registry = {
  init(){
    ALL_SORTED_REF.arr = [...APP.all].sort((a,b)=>stationName(a).localeCompare(stationName(b),'uk'));
    this._buildOblastChips();
    this._applyFilters();
    this._bindEvents();
  },

  // ── Фільтрація ──────────────────────────────────────────

  _applyFilters(){
    const { q, type, oblast, flags } = APP.filter;
    const ql = q.toLowerCase().trim();
    const filtered = ALL_SORTED_REF.arr.filter(s=>{
      if(type!=='all' && s._type!==type) return false;
      if(oblast && (s.oblast||s.region||'')!==oblast) return false;
      if(flags.includes('coords')   && !s.lat) return false;
      if(flags.includes('contact')  && !s.contact_phone && !s.phone && !s.contact_email) return false;
      if(flags.includes('capacity') && !s.capacity_mw) return false;
      if(ql && !(
        stationName(s).toLowerCase().includes(ql) ||
        (s.company_name||s.company||'').toLowerCase().includes(ql) ||
        (s.phone||s.contact_phone||'').includes(ql)
      )) return false;
      return true;
    });

    const total = (ql||type!=='all'||oblast||flags.length) ? ALL_SORTED_REF.arr.length : null;
    document.getElementById('st-list-count').textContent = total ? `${filtered.length} з ${total}` : `${filtered.length}`;
    document.getElementById('stf-clear').classList.toggle('vis', !!ql);
    this._renderList(filtered);
  },

  _renderList(filtered){
    const container = document.getElementById('st-list');
    container.innerHTML = '';
    const CHUNK = 120;
    let offset = 0;

    const renderChunk = () => {
      const frag = document.createDocumentFragment();
      const end = Math.min(offset+CHUNK, filtered.length);
      for(let i=offset; i<end; i++){
        const s = filtered[i];
        const el = document.createElement('div');
        el.className = 'srl-item';
        el.innerHTML =
          `<span class="srl-num">${i+1}</span>`+
          `<div class="srl-dot ${s._type}"></div>`+
          `<div class="srl-body">`+
            `<div class="srl-name">${stationName(s)}</div>`+
            `<div class="srl-meta">`+
              `<span class="srl-ob">${s.oblast||s.region||'—'}</span>`+
              (s.capacity_mw?`<span class="srl-mw">⚡ ${s.capacity_mw} МВт</span>`:'')+
              (s.contact_phone||s.phone?`<span class="srl-phone">📞 ${s.contact_phone||s.phone}</span>`:'')+
              (!s.lat?`<span class="srl-nocoord">без координат</span>`:'')+
            `</div>`+
          `</div>`;
        el.addEventListener('click',()=>{ APP.stBackTo='list'; this.showDetail(s); });
        frag.appendChild(el);
      }
      container.appendChild(frag);
      offset = end;
      if(offset < filtered.length) requestAnimationFrame(renderChunk);
    };
    renderChunk();
  },

  // ── Деталь станції ────────────────────────────────────

  showDetail(s){
    APP.selectedStation = s;
    if(s.lat && s.lon) APP.leafletMap.flyTo([s.lat,s.lon], 13, {duration:0.8});
    const tc = s._type==='solar'?'solar':s._type==='wind'?'wind':'other';
    const vm = verificationMeta(s.verification_status);

    document.getElementById('st-detail').innerHTML =
      `<div class="sd-shell">
        <div class="sd-hero">
          <div class="sd-maincard">
            <div class="sd-badge ${tc}">${typeLabel(s._type)}</div>
            <div class="sd-name">${stationName(s)}</div>
            <div class="sd-meta">
              <div class="sd-chip ${vm.cls}">${vm.label}</div>
              <div class="sd-chip src">Джерело: ${sourceLabel(s.source_primary||s.source)}</div>
              ${s.data_completeness_score!=null?`<div class="sd-chip src">Якiсть: ${s.data_completeness_score}/100</div>`:''}
            </div>
            <div class="sd-quickgrid">
              <div class="sd-qcard call">
                <div class="sd-qk">Швидкий контакт</div>
                <div class="sd-qv ${(s.contact_phone||s.phone||s.contact_email)?'':'muted'}">
                  ${(s.contact_phone||s.phone)
                    ?`<a href="tel:${s.contact_phone||s.phone}">${s.contact_phone||s.phone}</a>`
                    :(s.contact_email?`<a href="mailto:${s.contact_email}">${s.contact_email}</a>`:'Контакт поки не додано')}
                </div>
              </div>
              <div class="sd-qcard pin">
                <div class="sd-qk">Локацiя</div>
                <div class="sd-qv ${(s.site_location||s.official_object_region||s.oblast||s.region)?'':'muted'}">
                  ${s.site_location||s.official_object_region||s.oblast||s.region||s.address||'Локацiю не додано'}
                </div>
              </div>
            </div>
          </div>
          ${s.capacity_mw
            ?`<div class="sd-cap"><div class="sd-cap-val">${s.capacity_mw} МВт</div><div class="sd-cap-lbl">Задокументована потужнiсть у джерелi</div></div>`
            :`<div class="sd-cap" style="border-left-color:var(--muted)"><div class="sd-cap-val" style="color:var(--muted);font-size:26px">Не знайдена</div><div class="sd-cap-lbl">Потужнiсть не знайдена у вiдкритих джерелах</div></div>`
          }
        </div>
        <div class="sd-facts">
          <div class="sd-row"><span class="lb">Область</span><span class="vl">${s.oblast||s.region||'—'}</span></div>
          <div class="sd-row"><span class="lb">Компанiя</span><span class="vl">${shortCo(s.company_name||s.company)}</span></div>
          ${s.company_edrpou?`<div class="sd-row"><span class="lb">ЄДРПОУ</span><span class="vl">${s.company_edrpou}</span></div>`:''}
          ${s.site_location?`<div class="sd-row"><span class="lb">Розмiщення станцiї</span><span class="vl">${s.site_location}</span></div>`:''}
          ${s.address&&s.address!==s.site_location?`<div class="sd-row"><span class="lb">Юр. адреса</span><span class="vl">${s.address}</span></div>`:''}
          ${s.official_technology?`<div class="sd-row"><span class="lb">Технологiя</span><span class="vl">${s.official_technology}</span></div>`:''}
          ${s.support_scheme?`<div class="sd-row"><span class="lb">Схема пiдтримки</span><span class="vl">${s.support_scheme}</span></div>`:''}
          <div class="sd-row hl"><span class="lb">Лiцензiя</span><span class="vl">${s.license_num||'—'}</span></div>
          <div class="sd-row"><span class="lb">Дата лiцензiї</span><span class="vl">${s.license_date||'—'}</span></div>
          ${(s.contact_phone||s.phone)?`<div class="sd-row"><span class="lb">Телефон</span><span class="vl"><a href="tel:${s.contact_phone||s.phone}" style="color:var(--blue2);text-decoration:none">${s.contact_phone||s.phone}</a></span></div>`:''}
          ${s.contact_email?`<div class="sd-row"><span class="lb">Email</span><span class="vl"><a href="mailto:${s.contact_email}" style="color:var(--blue2);text-decoration:none">${s.contact_email}</a></span></div>`:''}
          ${s.website?`<div class="sd-row"><span class="lb">Сайт</span><span class="vl"><a href="${escapeHtml(s.website)}" target="_blank" rel="noopener noreferrer" style="color:var(--blue2);text-decoration:none">${s.website.replace(/^https?:\/\//,'')}</a></span></div>`:''}
          ${s.lat
            ?`<div class="sd-row"><span class="lb">Координати</span><span class="vl">${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}</span></div>
              <div class="sd-row"><span class="lb">Точнiсть точки</span><span class="vl">${precisionLabel(s,'long')}</span></div>`
            :`<div class="sd-row"><span class="lb">Координати</span><span class="vl" style="color:var(--muted)">Не вказано</span></div>`}
        </div>
        <div class="sd-ownerbox">
          <div style="font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--amber2);margin-bottom:6px;">Це ваша станцiя?</div>
          <div style="font-size:11px;color:var(--label);line-height:1.5;margin-bottom:10px;">Пiдтвердiть данi або надiшлiть корекцiю контактiв, координат i потужностi.</div>
          <div class="sd-actions">
            <button type="button" class="sd-linkbtn primary" data-update-station="${escapeHtml(s.station_id||'')}">Оновити данi</button>
          </div>
        </div>
      </div>`;

    // Кнопка «Оновити дані»
    document.querySelector('[data-update-station]')?.addEventListener('click', ()=>{
      updateForm.open(s);
    });

    document.getElementById('st-list-wrap').style.display = 'none';
    document.getElementById('st-detail-wrap').style.display = 'block';
    app.switchTab('station');
    document.getElementById('panel-title').innerHTML = `<em>${shortName(stationName(s)).slice(0,32)}</em>`;
  },

  backToList(){
    document.getElementById('st-list-wrap').style.display = 'flex';
    document.getElementById('st-detail-wrap').style.display = 'none';
    document.getElementById('panel-title').innerHTML = 'Реєстр <em>станцiй</em>';
  },

  // ── Oblast chips ─────────────────────────────────────

  _buildOblastChips(){
    const counts = {};
    ALL_SORTED_REF.arr.forEach(s=>{
      const ob = s.oblast||s.region||'—';
      if(!counts[ob]) counts[ob] = {all:0,solar:0,wind:0};
      counts[ob].all++;
      if(s._type==='solar') counts[ob].solar++;
      if(s._type==='wind')  counts[ob].wind++;
    });
    const oblasts = Object.keys(counts).filter(k=>k&&k!=='—').sort((a,b)=>a.localeCompare(b,'uk'));
    const wrap = document.getElementById('stf-ob-chips');
    oblasts.forEach(ob=>{
      const chip = document.createElement('button');
      chip.className = 'stf-ob-chip';
      chip.dataset.ob = ob;
      chip.innerHTML = ob.replace(' обл.','').replace('м. ','м.')+`<span class="cnt">${counts[ob].all}</span>`;
      chip.addEventListener('click',()=>{
        const same = APP.filter.oblast === ob;
        APP.filter.oblast = same ? '' : ob;
        wrap.querySelectorAll('.stf-ob-chip').forEach(c=>c.classList.toggle('active', c.dataset.ob===APP.filter.oblast));
        this._applyFilters();
      });
      wrap.appendChild(chip);
    });
  },

  // ── Events ───────────────────────────────────────────

  _bindEvents(){
    let debTimer;
    document.getElementById('st-list-search').addEventListener('input', e=>{
      APP.filter.q = e.target.value;
      clearTimeout(debTimer);
      debTimer = setTimeout(()=>this._applyFilters(), 180);
    });

    document.getElementById('stf-clear').addEventListener('click',()=>{
      APP.filter.q = '';
      document.getElementById('st-list-search').value = '';
      this._applyFilters();
    });

    document.querySelectorAll('.stf-type').forEach(btn=>{
      btn.addEventListener('click',()=>{
        APP.filter.type = btn.dataset.t;
        document.querySelectorAll('.stf-type').forEach(b=>b.classList.toggle('active',b===btn));
        this._applyFilters();
      });
    });

    document.querySelectorAll('.stf-flag').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const flag = btn.dataset.flag;
        const idx = APP.filter.flags.indexOf(flag);
        if(idx===-1) APP.filter.flags.push(flag);
        else APP.filter.flags.splice(idx,1);
        btn.classList.toggle('active', APP.filter.flags.includes(flag));
        this._applyFilters();
      });
    });

    document.getElementById('st-back').addEventListener('click',()=>{
      if(APP.stBackTo==='oblast' && APP.selectedOblast){
        this.backToList();
        app.switchTab('oblast');
        document.getElementById('panel-title').innerHTML = `<em>${APP.selectedOblast}</em>`;
        document.getElementById('st-list-wrap').style.display = 'flex';
        document.getElementById('st-detail-wrap').style.display = 'none';
      } else if(APP.stBackTo==='list'){
        this.backToList();
      } else {
        app.reset();
      }
    });
  }
};
