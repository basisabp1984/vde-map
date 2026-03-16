// ── UPDATE-FORM: модальна форма оновлення даних власником ──

const updateForm = {
  _stationId: null,

  open(station){
    this._stationId = station.station_id || station.name || '';
    const sub = document.getElementById('modal-station-name');
    if(sub) sub.textContent = stationName(station);

    // Скинути форму і повідомлення
    document.getElementById('update-form')?.reset();
    this._setMsg('','');
    document.getElementById('modal-submit').disabled = false;

    document.getElementById('modal-overlay').classList.add('open');
  },

  close(){
    document.getElementById('modal-overlay').classList.remove('open');
  },

  _setMsg(text, type){
    const el = document.getElementById('modal-msg');
    if(!el) return;
    el.textContent = text;
    el.className = 'modal-msg' + (type?' '+type:'');
  },

  async _submit(e){
    e.preventDefault();
    const form = document.getElementById('update-form');
    const fd = new FormData(form);
    const phone = (fd.get('submitter_phone')||'').trim();
    const email = (fd.get('submitter_email')||'').trim();

    // Валідація: потрібен хоча б один контакт
    if(!phone && !email){
      this._setMsg('Вкажiть хоча б один контакт — телефон або email.', 'error');
      return;
    }

    const fields = {
      submitter_name:  (fd.get('submitter_name')||'').trim()||null,
      submitter_phone: phone||null,
      submitter_email: email||null,
      capacity_mw:     fd.get('capacity_mw') ? parseFloat(fd.get('capacity_mw')) : null,
      address_update:  (fd.get('address_update')||'').trim()||null,
      comment:         (fd.get('comment')||'').trim()||null,
    };

    const btn = document.getElementById('modal-submit');
    btn.disabled = true;
    btn.textContent = 'Надсилаємо...';

    try {
      await saveUpdateRequest(this._stationId, fields);
      this._setMsg('Дякуємо! Данi прийнято. Ми перевiримо i оновимо картку.', 'success');
      btn.textContent = 'Надiслано ✓';
    } catch(err) {
      console.error('update_request error:', err);
      this._setMsg('Помилка збереження. Спробуйте ще раз або зв\'яжiться з нами.', 'error');
      btn.disabled = false;
      btn.textContent = 'Надiслати';
    }
  },

  init(){
    document.getElementById('modal-close')?.addEventListener('click',()=>this.close());
    document.getElementById('modal-cancel')?.addEventListener('click',()=>this.close());
    document.getElementById('update-form')?.addEventListener('submit', e=>this._submit(e));
    // Закрити при кліку на фон
    document.getElementById('modal-overlay')?.addEventListener('click', e=>{
      if(e.target.id==='modal-overlay') this.close();
    });
  }
};
