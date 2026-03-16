// ── STATE: єдиний об'єкт стану застосунку ──
// Усі модулі читають і пишуть тільки сюди.
// Пряма залежність між модулями заборонена.

window.APP = {
  all: [],          // масив усіх станцій з Supabase
  withCoords: [],   // підмножина: lat != null

  filter: {
    type: 'all',    // 'all' | 'solar' | 'wind'
    oblast: '',     // '' або назва області
    q: '',          // рядок пошуку
    flags: [],      // ['coords','contact','capacity']
  },

  oblastStats: {},  // { 'Одеська обл.': { total, mw, solar, wind, sMw, wMw, stations[] } }
  oblastList: [],   // масив oblastStats відсортований за total desc
  maxMw: 1,

  selectedStation: null,
  selectedOblast: null,
  isFullPanel: false,
  stBackTo: 'overview', // звідки відкрита картка: 'overview'|'oblast'|'list'

  leafletMap: null,
  oblastLayer: null,
  markerCluster: null,
};
