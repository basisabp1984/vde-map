// ── DATA: Supabase клієнт (тільки для update_requests) ──
// Станції завантажуються з all_stations.js (статичний файл)

let _supabase = null;

function getSupabase(){
  if(!_supabase){
    _supabase = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
  }
  return _supabase;
}

// Зберегти заявку на оновлення від власника
async function saveUpdateRequest(stationId, fields){
  const { error } = await getSupabase()
    .from('update_requests')
    .insert([{ station_id: stationId, ...fields }]);
  if(error) throw error;
}

// Побудувати oblastStats з масиву станцій
function buildOblastStats(all){
  const stats = {};
  const isRealOblast = r => !!r && r !== 'Невідомо' && r !== 'Невiдомо' && r !== '—';

  all.forEach(s=>{
    const r = s.oblast || s.region || '';
    if(!isRealOblast(r)) return;
    if(!stats[r]) stats[r] = { name:r, total:0, mw:0, solar:0, wind:0, sMw:0, wMw:0, stations:[] };
    const ob = stats[r];
    ob.total++;
    ob.mw += s.capacity_mw || 0;
    if(s._type==='solar'){ ob.solar++; ob.sMw += s.capacity_mw||0; }
    if(s._type==='wind') { ob.wind++;  ob.wMw += s.capacity_mw||0; }
    ob.stations.push(s);
  });

  APP.oblastStats = stats;
  APP.oblastList  = Object.values(stats).sort((a,b)=>b.total-a.total);
  APP.maxMw       = Math.max(...APP.oblastList.map(o=>o.mw), 1);
}
