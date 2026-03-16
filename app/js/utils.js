// ── UTILS: спільні утиліти ──
// Чисті функції без побічних ефектів. Не знають про DOM і стан.

const _normStr = s => s.toLowerCase().replace(/[іi]/g,'i').replace(/\s+/g,' ').trim();

function fmt(n){ return Math.round(n).toLocaleString('uk'); }

function shortName(n){
  if(!n) return '—';
  return n
    .replace(/^СОНЯЧНА ЕЛЕКТРОСТАНЦ[ІI]Я\s*/i,'СЕС ')
    .replace(/^В[ІI]ТРОВА ЕЛЕКТРОСТАНЦ[ІI]Я\s*/i,'ВЕС ')
    .replace(/^Г[ІI]ДРОЕЛЕКТРОСТАНЦ[ІI]Я\s*/i,'ГЕС ')
    .replace(/^МАЛА Г[ІI]ДРОЕЛЕКТРОСТАНЦ[ІI]Я\s*/i,'МГЕС ');
}

function shortCo(c){
  if(!c) return '—';
  return c
    .replace(/ТОВАРИСТВО З ОБМЕЖЕНОЮ В[ІI]ДПОВ[ІI]ДАЛЬН[ІI]СТЮ\s*/gi,'ТОВ ')
    .replace(/ПРИВАТНЕ АКЦ[ІI]ОНЕРНЕ ТОВАРИСТВО\s*/gi,'ПрАТ ')
    .replace(/ПУБЛ[ІI]ЧНЕ АКЦ[ІI]ОНЕРНЕ ТОВАРИСТВО\s*/gi,'ПАТ ')
    .replace(/["""]/g,'');
}

function typeLabel(t){ return t==='solar'?'Сонячна СЕС':t==='wind'?'Вiтрова ВЕС':t||'Iнший'; }

function stationName(s){
  const primary = String((s&&s.name)||'').trim();
  if(primary) return primary;
  const co = String((s&&(s.company_name||s.company))||'').trim();
  if(co) return "Об'єкт · " + shortCo(co);
  return "Об'єкт без назви";
}

function clampText(value, max=72){
  const text = String(value||'').replace(/\s+/g,' ').trim();
  if(!text) return '—';
  return text.length>max ? text.slice(0,Math.max(0,max-1)).trimEnd()+'…' : text;
}

function compactRegionLabel(s){
  return clampText(s.site_location||s.official_object_region||s.oblast||s.region||s.address||'—', 52);
}

function compactContactLabel(s){
  return clampText(s.contact_phone||s.phone||s.contact_email||s.website||'контакт не вказано', 42);
}

function precisionLabel(s, mode='short'){
  if(!s?.is_approximate) return mode==='short'?'точна точка':'Точна точка';
  const key = s.location_precision||'region_only';
  const labels = {
    short:   {address_center:'прибл. адреса',street_center:'прибл. вулиця',settlement_center:'прибл. мiсце',settlement_estimated:'прибл. адреса',region_only:'прибл. область'},
    long:    {address_center:'приблизно, за адресою',street_center:'приблизно, за вулицею',settlement_center:'приблизно, центр нас. пункту',settlement_estimated:'приблизно, за нас. пунктом',region_only:'приблизно, центр областi'},
    tooltip: {address_center:'Приблизно: адреса',street_center:'Приблизно: вулиця',settlement_center:'Приблизно: нас. пункт',settlement_estimated:'Приблизно: нас. пункт',region_only:'Приблизно: область'},
  };
  return (labels[mode]||labels.short)[key]||'прибл.';
}

function verificationMeta(status){
  const map={
    verified_owner:{label:'Підтверджено власником',cls:'v-owner'},
    verified_manual:{label:'Перевірено модератором',cls:'v-manual'},
    trusted_public:{label:'Публiчне джерело',cls:'v-public'},
    estimated:{label:'Оцiночнi данi',cls:'v-est'},
    incomplete:{label:'Неповнi данi',cls:'v-est'},
  };
  return map[status]||{label:'Статус невiдомий',cls:'v-est'};
}

function sourceLabel(src){
  const map={'НКРЕКП':'НКРЕКП','WRI':'WRI','OpenStreetMap':'OSM'};
  return map[src]||src||'Джерело невiдоме';
}

function escapeHtml(v){
  return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showStateNote(target, html, compact=false){
  const el = typeof target==='string' ? document.getElementById(target) : target;
  if(el) el.innerHTML = `<div class="state-note${compact?' compact':''}">${html}</div>`;
}
