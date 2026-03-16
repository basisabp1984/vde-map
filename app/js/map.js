// ── MAP: Leaflet карта, маркери, GeoJSON областей ──

const GB_MAP = {
  "Vinnytsʼka":'Вiнницька обл.',"Volynska":'Волинська обл.',"Dnipropetrovska":'Днiпропетровська обл.',
  "Donetsʼka":'Донецька обл.',"Zhytomyrsʼka":'Житомирська обл.',"Zakarpatsʼka":'Закарпатська обл.',
  "Zaporizʼka":'Запорiзька обл.',"Ivano-Frankivsʼka":'Iвано-Франкiвська обл.',
  'Kyiv City':'м. Київ',"Kyivsʼka":'Київська обл.',"Kirovohradsʼka":'Кiровоградська обл.',
  "Luhanska":'Луганська обл.',"Lʼvivsʼka":'Львiвська обл.',"Mykolayivsʼka":'Миколаївська обл.',
  "Odesʼka":'Одеська обл.',"Poltavsʼka":'Полтавська обл.',"Rivnenska":'Рiвненська обл.',
  "Sumsʼka":'Сумська обл.',"Ternopilsʼka":'Тернопiльська обл.',"Kharkivsʼka":'Харкiвська обл.',
  "Khersonsʼka":'Херсонська обл.',"Khmelʼnytsʼka":'Хмельницька обл.',"Cherkasʼka":'Черкаська обл.',
  "Chernivetsʼka":'Чернiвецька обл.',"Chernihivsʼka":'Чернiгiвська обл.',"Respublika Krym":'АР Крим',
  'Vinnytsia':'Вiнницька обл.','Volyn':'Волинська обл.','Dnipropetrovsk':'Днiпропетровська обл.',
  'Donetsk':'Донецька обл.','Zhytomyr':'Житомирська обл.','Zakarpattia':'Закарпатська обл.',
  'Zaporizhzhia':'Запорiзька обл.','Ivano-Frankivsk':'Iвано-Франкiвська обл.',
  'Kyiv':'Київська обл.','Kirovohrad':'Кiровоградська обл.','Luhansk':'Луганська обл.',
  'Lviv':'Львiвська обл.','Mykolaiv':'Миколаївська обл.','Odesa':'Одеська обл.','Odessa':'Одеська обл.',
  'Poltava':'Полтавська обл.','Rivne':'Рiвненська обл.','Sumy':'Сумська обл.',
  'Ternopil':'Тернопiльська обл.','Kharkiv':'Харкiвська обл.','Kherson':'Херсонська обл.',
  'Khmelnytskyi':'Хмельницька обл.','Cherkasy':'Черкаська обл.','Chernivtsi':'Чернiвецька обл.',
  'Chernihiv':'Чернiгiвська обл.','Crimea':'АР Крим',
};

const hasLeaflet = typeof L !== 'undefined';

function mapInit(){
  if(!hasLeaflet){
    showMapFallback('Бiблiотека карти не пiдвантажилась. Реєстр i пошук доступнi без карти.');
    APP.leafletMap = createNoopMap();
    APP.markerCluster = { clearLayers(){}, addLayer(){} };
    return;
  }
  APP.leafletMap = L.map('map',{ center:[48.5,31.5], zoom:6, zoomControl:false, preferCanvas:true, minZoom:5 });
  L.control.zoom({ position:'topright' }).addTo(APP.leafletMap);
  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="http://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom:17,
  }).addTo(APP.leafletMap);
  APP.markerCluster = L.markerClusterGroup({ chunkedLoading:true, maxClusterRadius:50 });
}

function createNoopMap(){
  return { flyTo(){}, fitBounds(){}, addLayer(){}, removeLayer(){}, invalidateSize(){} };
}

function showMapFallback(message){
  const mapEl = document.getElementById('map');
  const loading = document.getElementById('loading-ov');
  if(loading) loading.style.display='none';
  showStateNote(mapEl, `<b>Карта тимчасово недоступна.</b><br>${message}`, true);
}

function makeIcon(type, approximate=false){
  if(!hasLeaflet) return null;
  const c = type==='solar'?'#d4a832':type==='wind'?'#4a90d9':'#8a9ab0';
  const size = approximate ? 10 : 11;
  const shape = approximate ? 'border-radius:2px;opacity:0.72;' : 'border-radius:50%;';
  const border = approximate ? `2px dashed ${c}` : '2px solid rgba(255,255,255,0.85)';
  return L.divIcon({
    html:`<div style="width:${size}px;height:${size}px;background:${c};border:${border};${shape}box-shadow:0 1px 4px rgba(14,34,64,0.35)"></div>`,
    className:'', iconSize:[size,size], iconAnchor:[size/2,size/2],
  });
}

function buildMarkers(typeFilter='all', geoFilter='all'){
  if(!hasLeaflet) return;
  APP.markerCluster.clearLayers();
  APP.withCoords.filter(s=>{
    if(typeFilter!=='all' && s._type!==typeFilter) return false;
    if(geoFilter==='exact' && s.is_approximate) return false;
    if(geoFilter==='approx' && !s.is_approximate) return false;
    return true;
  }).forEach(s=>{
    const m = L.marker([s.lat,s.lon], { icon: makeIcon(s._type, !!s.is_approximate) });
    m.bindTooltip(
      `<div style="width:min(220px,calc(100vw - 56px));font-family:var(--sans);font-size:11px;line-height:1.4;white-space:normal;overflow-wrap:anywhere">
        <div style="font-family:'Cormorant',serif;font-size:14px;font-weight:600;color:#0e2240;line-height:1.25;margin-bottom:4px">${clampText(shortName(stationName(s)),48)}</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#4a5568;margin-bottom:6px">${typeLabel(s._type)} · ${precisionLabel(s,'tooltip')}</div>
        <div style="color:#4a5568;font-size:11px;line-height:1.35;margin-bottom:4px">${compactRegionLabel(s)}</div>
        <div style="color:#1a6a46;font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.35;margin-bottom:4px">${s.capacity_mw?`Потужнiсть: ${s.capacity_mw} МВт`:'Потужнiсть не знайдена'}</div>
        <div style="color:#2a5298;font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.35">${compactContactLabel(s)}</div>
      </div>`,
      { sticky:true, direction:'top', offset:[0,-8], opacity:1 }
    );
    m.on('click',()=>{ APP.stBackTo='oblast'; registry.showDetail(s); });
    APP.markerCluster.addLayer(m);
  });
  APP.leafletMap.addLayer(APP.markerCluster);
}

function getRegion(feature){
  const p = feature.properties||{};
  const raw = p.shapeName||p.name_1||p.NAME_1||p.name||p.NAME||'';
  const mapped = GB_MAP[raw];
  if(mapped) return mapped;
  const norm = _normStr(raw);
  return Object.keys(APP.oblastStats).find(k=>_normStr(k).includes(norm)||norm.includes(_normStr(k).slice(0,6)))||raw;
}

function obStyle(feature, selected){
  const region = getRegion(feature);
  const ob = APP.oblastStats[region];
  const mw = ob ? ob.mw : 0;
  if(selected) return { fillColor:'#1a3a6a', fillOpacity:0.35, color:'#d4a832', weight:2.5, opacity:1 };
  const alpha = mw>0 ? 0.08+Math.min(mw/APP.maxMw,1)*0.28 : 0.04;
  return { fillColor:mw>0?'#d4a832':'#1a3a6a', fillOpacity:alpha, color:'#5a7a9a', weight:1.8, opacity:1 };
}

function loadGeoJSON(){
  if(!hasLeaflet) return;
  fetch('https://www.geoboundaries.org/api/current/gbOpen/UKR/ADM1/')
    .then(r=>r.json())
    .then(meta=>{ if(!meta.simplifiedGeometryGeoJSON) throw new Error('no url'); return fetch(meta.simplifiedGeometryGeoJSON); })
    .then(r=>r.json())
    .then(gj=>{
      APP.oblastLayer = L.geoJSON(gj,{
        style: f=>obStyle(f,false),
        onEachFeature:(feature,layer)=>{
          const region = getRegion(feature);
          const ob = APP.oblastStats[region];
          layer.on('mouseover', e=>{
            if(region!==APP.selectedOblast) layer.setStyle({ fillOpacity:0.2, color:'#d4a832', weight:1.5, opacity:1 });
            layer.bindTooltip(
              `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;background:#fff;padding:7px 11px;border:1px solid #d8d3c8;border-radius:3px;box-shadow:0 2px 8px rgba(14,34,64,0.12)">
                <div style="color:#0e2240;font-weight:600;font-family:'Cormorant',serif;font-size:14px">${region}</div>
                <div style="color:#4a5568;font-size:11px;font-family:'IBM Plex Mono',monospace;margin-top:2px">${ob?ob.total+' ст.':'Немає даних'}</div>
              </div>`,
              { sticky:true, offset:[10,0], className:'', opacity:1 }
            ).openTooltip(e.latlng);
          });
          layer.on('mouseout',()=>{ if(region!==APP.selectedOblast) APP.oblastLayer.resetStyle(layer); layer.closeTooltip(); });
          layer.on('click',()=>oblast.select(region));
        }
      }).addTo(APP.leafletMap);
      document.getElementById('loading-ov').style.display='none';
    })
    .catch(()=>{
      document.getElementById('loading-sub').textContent = 'Не вдалося пiдвантажити межi областей. Точки i реєстр працюють.';
      setTimeout(()=>{ document.getElementById('loading-ov').style.display='none'; }, 1800);
    });
}

function highlightOblast(regionName){
  if(!hasLeaflet || !APP.oblastLayer) return;
  APP.oblastLayer.eachLayer(l=>{
    const r = getRegion(l.feature);
    if(r===regionName){
      l.setStyle(obStyle(l.feature, true));
      try{ APP.leafletMap.fitBounds(l.getBounds(),{padding:[40,40]}); } catch(e){}
    } else {
      APP.oblastLayer.resetStyle(l);
    }
  });
}

function resetOblastStyles(){
  if(APP.oblastLayer) APP.oblastLayer.eachLayer(l=>APP.oblastLayer.resetStyle(l));
}
