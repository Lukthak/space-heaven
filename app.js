const canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let lunaFisheyeBuffers = null;

const creditsEl = document.getElementById('credits');
const messageEl = document.getElementById('message');
const chatComposer = document.getElementById('chatComposer');
const chatInput = document.getElementById('chatInput');
const multiplayerStatus = document.getElementById('multiplayerStatus');
const fuelEmergencyNotice = document.getElementById('fuelEmergencyNotice');
const emergencyHelpOption = document.getElementById('emergencyHelpOption');
const emergencyHelpPanel = document.getElementById('emergencyHelpPanel');
const emergencyHelpStatus = document.getElementById('emergencyHelpStatus');
const emergencyTowCostLabel = document.getElementById('emergencyTowCost');
const radioPanel = document.getElementById('radioPanel');
const missionPanel = document.getElementById('missionPanel');
const missionsList = document.getElementById('missionsList');
const radioAudio = document.getElementById('radioAudio');
const radioStatus = document.getElementById('radioStatus');
const radioStationsList = document.getElementById('radioStationsList');
const radioAddForm = document.getElementById('radioAddForm');
const cancelEmergencyServiceButton = document.getElementById('cancelEmergencyService');
const shipAbilities = document.getElementById('shipAbilities');
const surfaceAbilities = document.getElementById('surfaceAbilities');
const surfaceAbilityCells = Array.from(document.querySelectorAll('.surface-ability'));
const SURFACE_ABILITY_KEYS = ['1', '2', '3'];
let selectedSurfaceAbilitySlot = null;
for (const cell of surfaceAbilityCells) {
  cell.addEventListener('click', (event) => {
    event.stopPropagation();
    selectSurfaceAbility(Number(cell.dataset.surfaceSlot));
  });
}
let freeCraftingMode = false;
const tipCooldownEl = document.getElementById('tipCooldown');
const centerCooldownEl = document.getElementById('centerCooldown');
const propulsorCooldownEl = document.getElementById('propulsorCooldown');
const shipAbilityCells = Array.from(document.querySelectorAll('#shipAbilities .ship-ability'));
const inventoryPanel = document.getElementById('inventoryPanel');
const inventoryTitlebar = document.querySelector('.inventory-titlebar');
const inventoryTitle = document.getElementById('inventoryTitle');
const closeInventoryBtn = document.getElementById('closeInventoryBtn');
const inventoryOptions = Array.from(document.querySelectorAll('.inventory-option'));
const inventoryOptionsNav = document.getElementById('inventoryOptions');
const shipWorkshop = document.getElementById('shipWorkshop');
const shipPreviewCanvas = document.getElementById('shipPreviewCanvas');
const shipPreviewContext = shipPreviewCanvas.getContext('2d');
const shipPartsList = document.getElementById('shipPartsList');
const shipStats = document.getElementById('shipStats');
const inventoryItemsGrid = document.getElementById('inventoryItemsGrid');
const inventoryTooltip = document.getElementById('inventoryTooltip');
const inventoryMapContainer = document.getElementById('inventoryMapContainer');
const inventoryMap = document.getElementById('inventoryMap');
const inventoryMapContext = inventoryMap.getContext('2d');
const inventoryMapTooltip = document.getElementById('inventoryMapTooltip');
const marketPanel = document.getElementById('marketPanel');
const marketStatus = document.getElementById('marketStatus');
const marketInventory = document.getElementById('marketInventory');
const merchantItemsGrid = document.getElementById('merchantItemsGrid');
const marketPlayerItemsGrid = document.getElementById('marketPlayerItemsGrid');
const chestPanel = document.getElementById('chestPanel');
const chestPlayerItemsGrid = document.getElementById('chestPlayerItemsGrid');
const chestItemsGrid = document.getElementById('chestItemsGrid');
const repairPanel = document.getElementById('repairPanel');
const repairOptions = document.getElementById('repairOptions');
const repairStatus = document.getElementById('repairStatus');
const repairSelectedButton = document.getElementById('repairSelectedButton');
const repairAllButton = document.getElementById('repairAllButton');
const repairSelectedSlots = new Set();
let currentInventoryView = 'menu';
let lastInventoryTab = 'objetos';
let missionPanelRefreshAt = 0;
const RADIO_STATIONS_STORAGE_KEY = 'spaceHeaven.customRadioStations';
const PRESET_RADIO_STATIONS = [
  { id: 'radio-paradise', name: 'Radio Paradise · Música variada', url: 'https://stream-tx1.radioparadise.com/mp3-128' },
  { id: 'kexp', name: 'KEXP · Alternativa', url: 'https://kexp.streamguys1.com/kexp160.aac' },
  { id: 'jazz24', name: 'Jazz24 · Jazz', url: 'https://knkx-live-a.edge.audiocdn.com/6285_128k' },
  { id: 'wrti-jazz', name: 'WRTI · Jazz', url: 'https://wrti-live.streamguys1.com/jazz-mp3' },
  { id: 'vermont-classical', name: 'Vermont Public · Clásica', url: 'https://vprclassical.streamguys1.com/vprclassical128.mp3' },
];
let currentMarketView = 'merchant';
let inventoryMapZoom = 1;
// Desplazamiento del mapa (unidades del mundo) al arrastrar con el clic derecho; se reinicia al cerrar el inventario.
let inventoryMapPan = { x: 0, y: 0 };
let inventoryMapDrag = null;
let playerZoom = 1;
let playerInventoryClickUntil = 0;
let playerInventoryClickFlipped = false;
let inventoryWindowGeometry = null;
let inventoryScrollPositions = {
  objects: 0,
  ship: 0,
  market: 0,
  merchantItems: 0,
  playerItems: 0,
};
let messageTimeout = null;
let earthWandererDialogOpen = false;
let earthWandererDialogText = '';
let earthWandererTipIndex = 0;
let playerChatMessage = '';
let playerChatMessageUntil = 0;
const AUTH_SESSION_KEY = 'spaceHeavenAccountSession';
let authSession = null;
try { authSession = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || 'null'); } catch { authSession = null; }
const authGate = document.getElementById('authGate');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authDescription = document.getElementById('authDescription');
const authUsernameField = document.getElementById('authUsernameField');
const authUsernameInput = document.getElementById('authUsername');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authError = document.getElementById('authError');
const authSubmit = document.getElementById('authSubmit');
const authModeToggle = document.getElementById('authModeToggle');
let authIsLogin = false;
let accountReady = false;
let GAME_SAVE_KEY = null;
let multiplayerPlayerId = (() => {
  if (authSession?.user?.id) return authSession.user.id;
  const key = 'spaceHeavenMultiplayerId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.()
      ?? `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
})();
let multiplayerName = authSession?.user?.username || `Piloto-${multiplayerPlayerId.slice(0, 4).toUpperCase()}`;
let multiplayerPlayers = [];
let multiplayerReady = false;
let multiplayerSyncBusy = false;
let lastMultiplayerWorldSentAt = 0;
let lastMultiplayerWorldPlanetSent = '';
let multiplayerChatMessage = '';
let multiplayerChatMessageUntil = 0;
let multiplayerWorldOwnerId = '';
let multiplayerIsWorldOwner = false;
let multiplayerWorlds = {};
let multiplayerWorldRevision = 0;
let multiplayerAppliedWorldRevision = -1;
let multiplayerEarthWandererTarget = null;
let multiplayerMartianTargets = null;
const multiplayerSyncedSurfaceEntities = new Set();
const multiplayerEndpoint = /^https?:$/.test(location.protocol)
  ? `${location.origin}/api/players`
  : null;
if (authGate) authGate.hidden = !multiplayerEndpoint;
if (!multiplayerEndpoint) accountReady = true;
if (!multiplayerEndpoint) GAME_SAVE_KEY = 'spaceheaven-save-v1';

function setAuthMode(login) {
  authIsLogin = login;
  authTitle.textContent = login ? 'Iniciar sesión' : 'Crear cuenta';
  authDescription.textContent = login ? 'Entra con el correo de tu cuenta.' : 'Regístrate para entrar al juego online.';
  authUsernameField.hidden = login;
  authUsernameInput.required = !login;
  authUsernameInput.autocomplete = login ? 'off' : 'username';
  authEmailInput.autocomplete = login ? 'username' : 'email';
  authPasswordInput.autocomplete = login ? 'current-password' : 'new-password';
  authSubmit.textContent = login ? 'Iniciar sesión y jugar' : 'Registrarme y jugar';
  authModeToggle.textContent = login ? '¿No tienes cuenta? · Regístrate' : 'Ya tengo cuenta · Iniciar sesión';
  authError.hidden = true;
}

async function authenticate(mode, values) {
  const response = await fetch(`/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo iniciar sesión.');
  authSession = result;
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authSession));
  multiplayerPlayerId = result.user.id;
  multiplayerName = result.user.username;
  accountReady = true;
  authGate.hidden = true;
  authPasswordInput.value = '';
  GAME_SAVE_KEY = `spaceheaven-save-v1-${result.user.id}`;
  startGameForAccount();
  syncMultiplayer();
}

authModeToggle?.addEventListener('click', () => setAuthMode(!authIsLogin));
authForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.hidden = true;
  authSubmit.disabled = true;
  authSubmit.textContent = 'Conectando…';
  try {
    await authenticate(authIsLogin ? 'login' : 'register', {
      username: authUsernameInput.value.trim(),
      email: authEmailInput.value.trim(),
      password: authPasswordInput.value,
    });
  } catch (error) {
    authError.textContent = error.message || 'No se pudo conectar con el servidor.';
    authError.hidden = false;
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authIsLogin ? 'Iniciar sesión y jugar' : 'Registrarme y jugar';
  }
});

async function restoreAccountSession() {
  if (!multiplayerEndpoint) return;
  if (authSession?.token) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authSession.token}` },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Sesión vencida.');
      const result = await response.json();
      authSession.user = result.user;
      multiplayerPlayerId = result.user.id;
      multiplayerName = result.user.username;
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authSession));
      accountReady = true;
      authGate.hidden = true;
      GAME_SAVE_KEY = `spaceheaven-save-v1-${result.user.id}`;
      startGameForAccount();
      return;
    } catch {
      authSession = null;
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  }
  setAuthMode(false);
  authGate.hidden = false;
}

if (multiplayerEndpoint) restoreAccountSession();
let lastGameSaveAt = 0;
let draggedInventoryItem = null;
let draggedItemDroppedInsideInterface = false;

const CHUNK_SIZE = 1200;
const SURFACE_CHUNK_COUNT = 100;
const SURFACE_WORLD_SIZE = CHUNK_SIZE * SURFACE_CHUNK_COUNT;
const HOME_LAND_CHUNK_COUNT = 2;
const HOME_LAND_START_CHUNK_X = Math.floor((SURFACE_WORLD_SIZE * 0.58125) / CHUNK_SIZE) - 1;
const HOME_LAND_START_CHUNK_Y = Math.floor((SURFACE_WORLD_SIZE * 0.6) / CHUNK_SIZE) - 1;
const RADAR_RANGE_CHUNKS = 20;
const RADAR_RANGE_WORLD = RADAR_RANGE_CHUNKS * CHUNK_SIZE;
const radarChunkCache = new Map();
let radarChunkCacheCenter = null;
let shipShotSound = null;
let inventorySelectSound = null;
let selectedHostileDrone = null;
let spaceHudOpacity = 0.5;
let spaceHudActionUntil = 0;
const HOSTILE_LIFETIME_RANGE_CHUNKS = 20;
const HOSTILE_INDICATOR_RANGE_CHUNKS = 6;
const HOSTILE_PURSUIT_RANGE_CHUNKS = 5;
const HOSTILE_ATTACK_RANGE_CHUNKS = 3;
const CHUNK_RADIUS = 2;
const SHIP_HEALTH_SCALE = 0.5;
const CAMERA_ZOOM = 2.2;
const MIN_PLAYER_ZOOM = 1;
const SURFACE_PLAYER_ZOOM = MIN_PLAYER_ZOOM * 2;
const MIN_SPACE_PLAYER_ZOOM = 0.5;
const MAX_PLAYER_ZOOM = 2.5;
const MAX_ORBIT_DISTANCE_CHUNKS = 320;
const ORBIT_DISTANCE_SCALE = (CHUNK_SIZE * MAX_ORBIT_DISTANCE_CHUNKS) / 790;
// Velocidad lineal (unidades/s) de la Tierra en su órbita; los demás planetas del sistema solar
// se mueven más lento cuanto más lejos están (v ∝ 1/√radio), así cualquier nave con propulsor puede alcanzarlos.
const HUB_EARTH_ORBIT_SPEED = 80;
const MIN_INVENTORY_MAP_ZOOM = 0.0625;
const MAX_INVENTORY_MAP_ZOOM = 8;
const PARALLAX_CELL_SIZE = 800;
const PARALLAX_DIVISOR = 192;
const SHIP_ACCELERATION = 520;
const TAKEOFF_KICK_SPEED = 180;
const SHIP_TURN_RATE = 1.8;
const SHIP_BRAKING = 240;
const SHIP_DRIFT_BRAKING = 300;
// Sin pilotaje la nave nunca se detiene del todo: conserva una deriva suave en su último rumbo (Espacio la frena).
const SHIP_IDLE_DRIFT_SPEED = 8;
// Paneles solares: 1 stack de energía cada 2 minutos, hasta 3 stacks en el inventario.
const SOLAR_PANEL_INTERVAL = 120;

const PROJECTILE_SPEED_MULTIPLIER = 4;
const FUEL_CONSUMPTION_DISTANCE = 4000;
const ENERGY_CONSUMPTION_DISTANCE = 1000;
const MAX_ITEM_STACK = 32;
const SOLAR_PANEL_MAX_ENERGY = 3 * MAX_ITEM_STACK;
const BASE_INVENTORY_STACK_CAPACITY = 20;
const HOMEWORLD_PICKUP_CAPACITY = 5;
const PLANET_PICKUP_CAPACITY = 7500;
const PLANET_PICKUP_REGEN_INTERVAL = 60 * 1000;
const MERCHANT_RESTOCK_INTERVAL = 5 * 60 * 1000;
const RESOURCE_SELL_PRICES = {
  metal: 15,
  crystal: 28,
  fuel: 20,
  energy: 5,
  titanium: 42,
  cobalt: 36,
  ammonia: 24,
  lithium: 48,
  silicate: 31,
  xenon: 58,
  uranium: 72,
  iridium: 95,
  deuterium: 84,
  graphene: 110,
  neodymium: 125,
  methane: 40,
  regolith: 8,
};
const RESOURCE_CATALOG = {
  metal: { name: 'Metal', icon: 'M', color: '#d5d9d5', description: 'Metal refinado utilizado como material.' },
  crystal: { name: 'Cristal', icon: 'C', color: '#8be7ff', description: 'Cristal mineral utilizado como material.' },
  fuel: { name: 'Combustible', icon: 'F', color: '#ffbd69', description: 'Combustible para propulsores y viajes espaciales.' },
  energy: { name: 'Energía', icon: 'E', color: '#ffe45b', description: 'Energía para el propulsor eléctrico.' },
  titanium: { name: 'Titanio', icon: 'Ti', color: '#c5d6e8', description: 'Metal ligero y resistente, común en mundos rocosos lejanos.', minTier: 1, environment: 'rocky' },
  cobalt: { name: 'Cobalto', icon: 'Co', color: '#6389ff', description: 'Metal azul empleado en aleaciones y baterías.', minTier: 1, environment: 'rocky' },
  ammonia: { name: 'Amoniaco', icon: 'NH₃', color: '#9fffd2', description: 'Compuesto volátil recogido en atmósferas de gigantes gaseosos.', minTier: 1, environment: 'gas' },
  lithium: { name: 'Litio', icon: 'Li', color: '#f1d4ff', description: 'Metal alcalino ligero para acumuladores de alta capacidad.', minTier: 2, environment: 'rocky' },
  silicate: { name: 'Silicato', icon: 'Si', color: '#d9b38c', description: 'Mineral de silicio y oxígeno extraído de cortezas rocosas.', minTier: 2, environment: 'rocky' },
  xenon: { name: 'Xenón', icon: 'Xe', color: '#a58aff', description: 'Gas noble raro obtenido de atmósferas planetarias.', minTier: 2, environment: 'gas' },
  uranium: { name: 'Uranio', icon: 'U', color: '#9bff4d', description: 'Mineral radiactivo de alto valor energético.', minTier: 3, environment: 'rocky' },
  iridium: { name: 'Iridio', icon: 'Ir', color: '#e4c7ff', description: 'Metal muy denso y escaso, propio de cortezas antiguas.', minTier: 3, environment: 'rocky' },
  deuterium: { name: 'Deuterio', icon: 'D₂', color: '#65e9ff', description: 'Isótopo de hidrógeno concentrado en gigantes gaseosos.', minTier: 3, environment: 'gas' },
  graphene: { name: 'Grafeno', icon: 'Gr', color: '#8b9eaa', description: 'Láminas de carbono ultrarresistentes recuperadas de minerales.', minTier: 3, environment: 'rocky' },
  neodymium: { name: 'Neodimio', icon: 'Nd', color: '#ff8dc8', description: 'Metal de tierras raras usado en imanes y motores avanzados.', minTier: 3, environment: 'rocky' },
  regolith: { name: 'Regolito', icon: 'Rg', color: '#d8cfc0', description: 'Polvo y grava fina de la superficie lunar. Se vende en la Tierra.' },
  methane: { name: 'Metano', icon: 'CH₄', color: '#b9ec76', description: 'Hidrocarburo ligero presente en atmósferas frías y lejanas.', minTier: 4, environment: 'gas' },
};
const STAR_MIN_CHUNK_DISTANCE = 20;
const BLACK_HOLE_MIN_CHUNK_DISTANCE = 40;
let savingDisabled = false;
// Sprites 16x16 de las piezas fabricables, incrustados para no depender de archivos externos.
const CRAFT_SPRITES = {
  wingTitanium: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAr0lEQVR42mNgGPKAkVyN6ga2/0k2AKaJgYGBYeuO7aS5QN3A9j9MEwMDA8Ol63cYGBgYGFiItXXrju1wTU4vqxkYxFsJuwDZVmTN+6CacRqAzVZkgGwIIy6NyLYSFY3YnAsD69dvZggM9MVuACHn4tIME2e6eeEwzoDEp1lWTo7hzNmLmF6Yt2QthgYTY32GM2cvwvlrl8zBHgvIKQ0ZtPdPZqgszIXz8bmaYBJGBwATPl+o/qJ61wAAAABJRU5ErkJggg==',
  wingGraphene: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAt0lEQVR42mNgGPKAkVyN/MIS/0k2gF9Y4r/DhecMBwwkGcKTi0hzgf/j///FJ3fD+VfPn2BgYGBgYCHWqeKTu+GakAEzMU42//0fq2acXvB//P8/zJ+4NGI1AOZcWADh0iwyby3Dm6RgVAP4hSX+E9KIrpmBgYGBEWarw4XnKBLEaIa7AGY7If/CwIunDzHDAGbI3i0rMTRISMujaHrz8in+QEQHOkZWDFfOHYPzP759wUhWuscGAPtGU13Xv5QBAAAAAElFTkSuQmCC',
  tipCobalt: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAj0lEQVR42mNgIAD4xJz+45NnYqAl4BNz+t+/4f9/fK7A64KPL/cStIQJn+0PXjIwrN78kEFMJQZnWOB1wYYTDOS7gFjAgsv5jbP2Mqze/JCBgYGBQUzTCSb1/9OrfYxEu2BpqzxlXoiufkjQEIJhEF39cAACEQZu7W2GswWkrEk3QM25Fs5+dX0fbbxAsQEAxrgogZZN/2QAAAAASUVORK5CYII=',
  tipPlasma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAlElEQVR42mNgIABkuaz/45NnYqAlkOWy/n999v//+FzBgs+AR4VbGRgefCTf9v/////vsr3230umC6cr8IbBjTkMDKV2UgxkB6LGg48M3Yee4TWABZfzd008wtC96DoDAwMDg4OiD0zq/+NvRxlJikaKvFB6SJOgF/Aa0G13nWBsMVHifMIuOPSMsjCAGULTzESxAQCiQDMAFuuGiwAAAABJRU5ErkJggg==',
  centerReinforced: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA7ElEQVR42mNkwAKExWX/VzV1Y4i31ZUyvH35mBFZjAWX5pMnjmMYoKyuw8DAwPAf2RAmYjUzMDAwKCirMVQ1dTMIi8v+xzCAkGYYOHniOIohLLgUNk6dwMDAwMAw4xmE/7y1AC63culCBqxeQAcwzfgAEy7n49OsoKzG4OwVxCAsLvufiYECUNXUjTsMkP2ML0BRXDDJ/zZBTchqHty9hWpA3kZVvIZM8r/NkLdRFc6/e/MKAyO+dAAzDFkTzOa7N68wvH35mJEFn3PRNeKMRnxOJhQu1HPB25ePGdvqShnMLSzxakD2PwMDAwMA4Tpryo7lXiYAAAAASUVORK5CYII=',
  thrusterAmmonia: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAjElEQVR42mNkQAPcWkr/p1zdwIAN5GgHMHy9do8RWYyFAQdYcOAECv/emr1Y1TExUAhwGtDgEEbQdhq74MAqOFspxHkAXDCCDGDBlozRUyFaTPxHTs5Yk/L5/F6stvHbGuB3ATLYePEkgwMDPwMDAwPDAYaPDP765oS9gAxwacBpALL/DScWE9IHDwcAIDguBQ6uBREAAAAASUVORK5CYII=',
};
const SHIP_PARTS = {
  center: [
    {
      id: 'center-classic',
      name: 'Centro clásico',
      src: 'sprites/nave/centro/centro_clasico1.png',
      price: 180,
      stats: { health: 120 },
    },
    {
      id: 'center-reinforced',
      name: 'Centro reforzado',
      src: CRAFT_SPRITES.centerReinforced,
      price: 520,
      craftOnly: true,
      stats: { health: 220 },
    },
  ],
  propulsor: [
    {
      id: 'thruster-electric',
      name: 'Propulsor eléctrico',
      src: 'sprites/nave/propulsores/propulsor_electrico.png',
      price: 300,
      stats: {
        speedMultiplier: 1,
        energyConsumptionDistance: ENERGY_CONSUMPTION_DISTANCE,
        inventoryStacks: 1,
        health: 85,
      },
    },
    {
      id: 'thruster-fuel',
      name: 'Propulsor de combustible',
      src: 'sprites/nave/propulsores/propulsor_combustible1.png',
      price: 450,
      stats: {
        speedMultiplier: 6,
        fuelConsumptionDistance: FUEL_CONSUMPTION_DISTANCE,
        inventoryStacks: -2,
        health: 85,
      },
    },
    {
      id: 'thruster-ammonia',
      name: 'Propulsor de amoniaco',
      src: CRAFT_SPRITES.thrusterAmmonia,
      price: 900,
      craftOnly: true,
      stats: {
        speedMultiplier: 4,
        fuelConsumptionDistance: FUEL_CONSUMPTION_DISTANCE * 2.5,
        inventoryStacks: -1,
        health: 110,
      },
    },
  ],
  wing: [
    {
      id: 'wing-fast',
      name: 'Alas rápidas',
      src: 'sprites/nave/alas/ala_rapida1.png',
      price: 220,
      stats: { speedMultiplier: 1.1, inventoryStacks: 2, health: 60 },
    },
    {
      id: 'wing-solar',
      name: 'Paneles solares',
      src: 'sprites/nave/alas/panel_solar.png',
      price: 380,
      stats: { solarEnergy: true, inventoryStacks: 4, health: 60 },
    },
    {
      id: 'wing-titanium',
      name: 'Alas de titanio',
      src: CRAFT_SPRITES.wingTitanium,
      price: 480,
      craftOnly: true,
      stats: { speedMultiplier: 1.12, inventoryStacks: 3, health: 100 },
    },
    {
      id: 'wing-graphene',
      name: 'Alas de grafeno',
      src: CRAFT_SPRITES.wingGraphene,
      price: 1500,
      craftOnly: true,
      stats: { speedMultiplier: 1.2, inventoryStacks: 4, health: 140 },
    },
  ],
  tip: [
    {
      id: 'tip-sonic',
      name: 'Punta sónica',
      src: 'sprites/nave/puntas/punta_sonica1.png',
      price: 160,
      stats: {
        inventoryStacks: -1,
        health: 50,
        weaponDamage: 16,
        weaponCooldown: 0.38,
        weaponProjectileSpeed: 720,
      },
    },
    {
      id: 'tip-rudimentaria',
      name: 'Punta rudimentaria',
      src: 'sprites/nave/puntas/punta_rudimentaria1.png',
      price: 130,
      stats: {
        inventoryStacks: 1,
        health: 75,
        weaponDamage: 5,
        weaponCooldown: 0.24,
        weaponProjectileSpeed: 600,
        weaponShots: 2,
      },
    },
    {
      id: 'tip-cobalt',
      name: 'Punta de cobalto',
      src: CRAFT_SPRITES.tipCobalt,
      price: 600,
      craftOnly: true,
      stats: {
        inventoryStacks: 0,
        health: 80,
        weaponDamage: 24,
        weaponCooldown: 0.32,
        weaponProjectileSpeed: 780,
      },
    },
    {
      id: 'tip-plasma',
      name: 'Punta de plasma',
      src: CRAFT_SPRITES.tipPlasma,
      price: 1400,
      craftOnly: true,
      stats: {
        inventoryStacks: -1,
        health: 95,
        weaponDamage: 42,
        weaponCooldown: 0.3,
        weaponProjectileSpeed: 900,
        weaponPierce: true,
      },
    },
  ],
};
const SHIP_PART_IMAGES = new Map();
for (const part of Object.values(SHIP_PARTS).flat()) {
  const image = new Image();
  image.src = part.src;
  image.addEventListener('error', () => {
    console.error(`No se pudo cargar el sprite de nave: ${part.src}`);
  });
  SHIP_PART_IMAGES.set(part.id, image);
}
const PLAYER_SPRITE = new Image();
PLAYER_SPRITE.src = 'sprites/jugador/player1.png';
PLAYER_SPRITE.addEventListener('error', () => {
  console.error('No se pudo cargar el sprite del jugador: sprites/jugador/player1.png');
});
const LUNATIC_SPRITE = new Image();
LUNATIC_SPRITE.src = 'sprites/enemies/lunatic.png';
LUNATIC_SPRITE.addEventListener('error', () => {
  console.error('No se pudo cargar el sprite del alien lunático: sprites/enemies/lunatic.png');
});
const LUNATIC_SHOOT_SPRITE = new Image();
LUNATIC_SHOOT_SPRITE.src = 'sprites/enemies/lunatic_shoot.png';
LUNATIC_SHOOT_SPRITE.addEventListener('error', () => {
  console.error('No se pudo cargar el disparo del alien lunático: sprites/enemies/lunatic_shoot.png');
});
const HOVERBOARD_ITEM_ID = 'hoverboard-board';
const HOVERBOARD_ITEM = {
  id: HOVERBOARD_ITEM_ID,
  name: 'Hoverboard',
  icon: '▰',
  color: '#69ffd0',
  count: 1,
  sprite: 'sprites/jugador/hoverboard/hoverboard_down.png',
  description: 'Tabla flotante para explorar planetas. Clic para equipar o guardar · Velocidad al caminar ×4.',
};
const REGOLITO_GUN_ITEM_ID = 'regolito-gun';
const REGOLITO_GUN_ITEM = {
  id: REGOLITO_GUN_ITEM_ID,
  name: 'Pistola de regolito',
  icon: '⌁',
  color: '#d8f1ff',
  count: 1,
  sprite: 'sprites/guns/regolito_gun.png',
  description: 'Pistola de superficie. Equípala en los slots 1, 2 o 3 para seleccionarla; apunta y haz clic para disparar. Carga 6 balas y usa regolito para recargar con R en 4 segundos.',
};
const COBALTO_KNIFE_ITEM_ID = 'cobalto-knife';
const COBALTO_KNIFE_ITEM = {
  id: COBALTO_KNIFE_ITEM_ID,
  name: 'Cuchillo de cobalto',
  icon: '⚔',
  color: '#8ecbff',
  count: 1,
  sprite: 'sprites/guns/cobalto_knife.png',
  description: 'Arma corta de superficie. Equípala en los slots 1, 2 o 3 para seleccionarla; apunta y haz clic para apuñalar hacia esa dirección; causa 1 de daño.',
};
const ITEM_PREVIEW_SPRITES = {
  [HOVERBOARD_ITEM_ID]: 'sprites/jugador/hoverboard/hoverboard_ground_left.png',
  [REGOLITO_GUN_ITEM_ID]: 'sprites/guns/miniatura/regolito_gun_miniatura.png',
  [COBALTO_KNIFE_ITEM_ID]: 'sprites/guns/miniatura/cobalto_knife_miniatura.png',
};
function getItemPreviewSprite(item) {
  return ITEM_PREVIEW_SPRITES[item?.id] ?? item?.sprite ?? '';
}
const COBALTO_KNIFE_SWING_DURATION = 0.09;
const COBALTO_KNIFE_RANGE = 56;
const REGOLITO_GUN_MAGAZINE_SIZE = 6;
const REGOLITO_GUN_RELOAD_SECONDS = 4;
const SURFACE_SHOT_SPRITE = new Image();
SURFACE_SHOT_SPRITE.src = 'sprites/jugador/shot-up-left-down.png';
const REGOLITO_GUN_SPRITE = new Image();
REGOLITO_GUN_SPRITE.src = REGOLITO_GUN_ITEM.sprite;
const COBALTO_KNIFE_SPRITE = new Image();
COBALTO_KNIFE_SPRITE.src = COBALTO_KNIFE_ITEM.sprite;
const HOVERBOARD_SPRITES = Object.fromEntries(
  ['down', 'left', 'up'].map((direction) => {
    const sprite = new Image();
    sprite.src = `sprites/jugador/hoverboard/hoverboard_${direction}.png`;
    return [direction, sprite];
  })
);
const HOVERBOARD_GROUND_SPRITE = new Image();
HOVERBOARD_GROUND_SPRITE.src = 'sprites/jugador/hoverboard/hoverboard_ground_left.png';
const PLAYER_INVENTORY_SPRITE = new Image();
PLAYER_INVENTORY_SPRITE.src = 'sprites/jugador/player1_inventory.png';
const PLAYER_INVENTORY_CLICK_SPRITE = new Image();
PLAYER_INVENTORY_CLICK_SPRITE.src = 'sprites/jugador/player1_inventory_click.png';
// Suelo de mármol (tile de 16x16, dibujado al doble = 1 casilla de 32 px): plataforma 5x5 bajo la nave,
// plataformas 3x3 bajo cada NPC y caminos de 1 casilla que los unen.
const MARBLE_FLOOR_SRC = 'sprites/tiles/marble_floor.png';
const MARBLE_FLOOR_TILE = 16;
const MARBLE_FLOOR_IMAGE = new Image();
MARBLE_FLOOR_IMAGE.src = MARBLE_FLOOR_SRC;
MARBLE_FLOOR_IMAGE.addEventListener('error', () => {
  console.error(`No se pudo cargar el tile de mármol: ${MARBLE_FLOOR_SRC}`);
});
let homeFloorCache = null;
let marsFloorCache = null;
const marsMountainChunkCache = new Map();
const marsMountainTileCache = new Map();
const marsGroundSpotCache = new Map();
const lunaCraterChunkCache = new Map();

// Suelos de los planetas: grass solo en la Tierra; rock (rocosos) y gas (gaseosos) se tiñen con el color de cada planeta.
// baseGray = gris (0-255) del color principal del tile; sirve para que ese color quede exactamente como el del planeta.
const GROUND_TILES = {
  grass: { src: 'sprites/tiles/grass_tile.png' },
  rock: { src: 'sprites/tiles/rock_planet.png', baseGray: 131 },
  gas: { src: 'sprites/tiles/gas_planet.png', baseGray: 114 },
};
for (const tile of Object.values(GROUND_TILES)) {
  tile.image = new Image();
  tile.image.src = tile.src;
  tile.image.addEventListener('error', () => {
    console.error(`No se pudo cargar el tile de suelo: ${tile.src}`);
  });
}
const groundLayerCache = new Map();
const WATER_FRAME_INTERVAL_MS = 250;
const WATER_TILE_IMAGES = Array.from({ length: 7 }, (_, index) => {
  const image = new Image();
  image.src = `sprites/tiles/water/water${index + 1}.png`;
  image.addEventListener('error', () => {
    console.error(`No se pudo cargar el cuadro de agua: ${image.src}`);
  });
  return image;
});
const waterGroundLayers = new Array(WATER_TILE_IMAGES.length).fill(null);

function getWaterGroundLayer() {
  const frameIndex = Math.floor(performance.now() / WATER_FRAME_INTERVAL_MS) % WATER_TILE_IMAGES.length;
  const image = WATER_TILE_IMAGES[frameIndex];
  if (!(image.complete && image.naturalWidth > 0)) return null;
  if (waterGroundLayers[frameIndex]) return waterGroundLayers[frameIndex];

  const layer = document.createElement('canvas');
  layer.width = SURFACE_TILE;
  layer.height = SURFACE_TILE;
  const layerContext = layer.getContext('2d');
  layerContext.imageSmoothingEnabled = false;
  layerContext.drawImage(image, 0, 0, SURFACE_TILE, SURFACE_TILE);
  waterGroundLayers[frameIndex] = layer;
  return layer;
}

function getHomeLandBounds() {
  return {
    x: HOME_LAND_START_CHUNK_X * CHUNK_SIZE,
    y: HOME_LAND_START_CHUNK_Y * CHUNK_SIZE,
    width: HOME_LAND_CHUNK_COUNT * CHUNK_SIZE,
    height: HOME_LAND_CHUNK_COUNT * CHUNK_SIZE,
  };
}

function isWithinHomeLand(x, y) {
  const land = getHomeLandBounds();
  const wrappedX = wrapSurfaceCoordinate(x);
  const wrappedY = wrapSurfaceCoordinate(y);
  return wrappedX >= land.x && wrappedX < land.x + land.width &&
    wrappedY >= land.y && wrappedY < land.y + land.height;
}

function getPlanetGroundKind(planet) {
  if (isHomeworld(planet)) return 'grass';
  return planet.gas ? 'gas' : 'rock';
}

function buildGroundTile(kind, color) {
  const tile = GROUND_TILES[kind];
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = SURFACE_TILE;
  tileCanvas.height = SURFACE_TILE;
  const tileCtx = tileCanvas.getContext('2d');
  tileCtx.imageSmoothingEnabled = false;
  if (kind === 'grass') {
    tileCtx.drawImage(tile.image, 0, 0, SURFACE_TILE, SURFACE_TILE);
    return tileCanvas;
  }
  tileCtx.fillStyle = color;
  tileCtx.fillRect(0, 0, SURFACE_TILE, SURFACE_TILE);
  if (tileCtx.filter !== undefined) {
    // El color principal del tile pasa a blanco y el de detalle a gris: al multiplicar sobre el color del planeta
    // el principal queda igual y el detalle sale más oscuro.
    tileCtx.globalCompositeOperation = 'multiply';
    tileCtx.filter = `grayscale(1) brightness(${255 / tile.baseGray})`;
    tileCtx.drawImage(tile.image, 0, 0, SURFACE_TILE, SURFACE_TILE);
  }
  return tileCanvas;
}

function getPlanetGroundLayer(planet) {
  const kind = getPlanetGroundKind(planet);
  const tile = GROUND_TILES[kind];
  if (!(tile.image.complete && tile.image.naturalWidth > 0)) return null;
  const key = `${kind}|${kind === 'grass' ? '' : planet.color}`;
  if (groundLayerCache.has(key)) return groundLayerCache.get(key);
  const layer = buildGroundTile(kind, planet.color);
  if (groundLayerCache.size > 40) groundLayerCache.clear();
  groundLayerCache.set(key, layer);
  return layer;
}

const PLAYER_FACING_FRAMES = {
  up: { x: 0, y: 0 },
  down: { x: 0, y: 16 },
  left: { x: 16, y: 16 },
  right: { x: 16, y: 16, flip: true },
};
const PLAYER_ANIMATION_FRAME_DURATION = 0.12;
const SURFACE_TILE = 32;
const SURFACE_GUN_PLACEMENTS = {
  up: { x: 0, y: -SURFACE_TILE, rotation: Math.PI / 2 },
  left: { x: -SURFACE_TILE, y: 0, rotation: 0 },
  right: { x: SURFACE_TILE, y: 0, rotation: 0, flipX: true },
  down: { x: 0, y: SURFACE_TILE, rotation: -Math.PI / 2 },
};
const EARTH_WANDERER_TIPS = [
  'Si te perdés por el espacio, escribí /home y volvés a la Tierra.',
  'Para volar, W acelera, S da marcha atrás y A y D giran. Con Espacio frenás, pero la nave sigue derrapando un poco.',
  'Con 1 disparás. La punta que tengas puesta define qué tan rápido y fuerte pegan los rayos.',
  'El centro te ayuda a apuntar: con 2, tus próximos tres tiros siguen al enemigo más cercano durante un ratito.',
  'Con R activás el impulso del propulsor. Cada modelo tiene su propio efecto y tarda distinto en recargarse.',
  'Podés abrir el inventario con I mientras volás; el tiempo sigue corriendo.',
  'Las piezas de la nave solo se pueden cambiar cuando aterrizás.',
  'El reparador de la Tierra te arregla las piezas. Cuanto más dañadas y caras sean, más te va a cobrar.',
  'Ojo con los enemigos: te persiguen hasta cinco chunks y te pueden disparar hasta a tres.',
];

// Todo el texto del mundo usa la misma fuente y el mismo tamaño.
const WORLD_FONT_SIZE = 10;
const WORLD_FONT = `${WORLD_FONT_SIZE}px "Press Start 2P", monospace`;
if (document.fonts?.load) {
  document.fonts.load(WORLD_FONT).catch(() => {});
}

function drawWorldText(text, x, y, color, withBox = false, fontSize = WORLD_FONT_SIZE) {
  if (game.scene === 'surface' && game.surface) ({ x, y } = getSurfaceRenderPoint(x, y));
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (withBox) {
    const width = ctx.measureText(text).width + 8;
    ctx.fillStyle = '#020704';
    ctx.fillRect(x - width / 2, y - fontSize - 2, width, fontSize + 6);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawSpeechBubble(text, x, bottomY, borderColor = '#c8ffd6', textColor = '#effff2') {
  if (game.scene === 'surface' && game.surface) ({ x, y: bottomY } = getSurfaceRenderPoint(x, bottomY));
  ctx.save();
  const fontSize = Math.max(8, WORLD_FONT_SIZE * 0.85);
  const lineHeight = fontSize + 4;
  const maxWidth = Math.min(game.width * 0.72, 440);
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth - 20) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  const textWidth = Math.max(...lines.map((entry) => ctx.measureText(entry).width));
  const boxWidth = Math.min(maxWidth, textWidth + 20);
  const boxHeight = lines.length * lineHeight + 14;
  const left = x - boxWidth / 2;
  const top = bottomY - boxHeight - 7;
  ctx.fillStyle = '#020704';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, top, boxWidth, boxHeight);
  ctx.strokeRect(left, top, boxWidth, boxHeight);
  ctx.beginPath();
  ctx.moveTo(x - 5, bottomY - 7);
  ctx.lineTo(x, bottomY);
  ctx.lineTo(x + 5, bottomY - 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = textColor;
  lines.forEach((entry, index) => {
    ctx.fillText(entry, x, top + 7 + index * lineHeight);
  });
  ctx.restore();
}

function drawPlayerChatBubble(x, bottomY) {
  if (!playerChatMessage || Date.now() >= playerChatMessageUntil) return;
  drawSpeechBubble(playerChatMessage, x, bottomY);
}

function openChatComposer() {
  chatInput.value = '';
  chatComposer.hidden = false;
  chatInput.focus();
}

function closeChatComposer() {
  chatComposer.hidden = true;
  chatInput.blur();
}

function showPlayerChatMessage(text) {
  playerChatMessage = text;
  playerChatMessageUntil = Date.now() + 9000;
}

function sendChatMessage(text) {
  const message = text.trim();
  if (!message) {
    playerChatMessage = '';
    playerChatMessageUntil = 0;
    chatInput.value = '';
    closeChatComposer();
    return;
  }
  if (/^\/repair(?:\s|$)/i.test(message)) {
    const health = ensureShipPartHealth();
    for (const slot of Object.keys(SHIP_PART_BASE_HEALTH)) {
      if (!health[slot]) continue;
      health[slot].hp = getShipPartMaxHealth(slot, health[slot].partId);
    }
    if (!inventoryPanel.hidden && currentInventoryView === 'nave') renderShipWorkshop();
    updateShipStatsDisplay();
    showPlayerChatMessage('/repair');
    setMessage('Toda la nave fue reparada al máximo.');
    chatInput.value = '';
    closeChatComposer();
    saveGameState();
    return;
  }
  if (/^\/craft(?:\s|$)/i.test(message)) {
    freeCraftingMode = !freeCraftingMode;
    showPlayerChatMessage('/craft');
    setMessage(freeCraftingMode ? 'Crafteo gratis activado.' : 'Crafteo gratis desactivado.');
    if (!inventoryPanel.hidden && currentInventoryView === 'craft') renderCraftPanel();
    chatInput.value = '';
    closeChatComposer();
    return;
  }
  if (/^\/home(?:\s|$)/i.test(message)) {
    const homeworld = game.homeStar?.planets.find(isHomeworld)
      ?? game.planets.find(isHomeworld);
    if (!homeworld) {
      setMessage('No se encontró la Tierra para regresar.');
      return;
    }
    if (game.scene !== 'space') {
      game.selectedPlanet = homeworld;
      enterPlanet(homeworld);
    } else {
      activateEmergencyCapsule('command');
      setMessage('Regresando a la Tierra.');
    }
    showPlayerChatMessage('/home');
    chatInput.value = '';
    closeChatComposer();
    return;
  }
  if (/^\/mision(?:\s|$)/i.test(message)) {
    if (earthMissionStatus !== 'active') {
      setMessage('No tienes una misión activa. Habla con Jorge para aceptar una.');
      chatInput.value = '';
      closeChatComposer();
      return;
    }
    const missionReward = earthMission.type === 'kill_surface'
      ? earthMission.targetEnemyType === 'lunatic' ? 2500 : 1000
      : earthMission.rewardCredits;
    game.player.credits += missionReward;
    earthMissionIndex += 1;
    earthMission = createEarthMission(earthMissionIndex);
    earthMissionStatus = 'available';
    earthMissionKillProgress = 0;
    updateHud();
    saveGameState();
    showPlayerChatMessage('/mision');
    setMessage(`Misión completada. Recibiste ${missionReward} créditos.`);
    chatInput.value = '';
    closeChatComposer();
    return;
  }
  if (/^\/mars(?:\s|$)/i.test(message)) {
    const mars = game.homeStar?.planets.find(isMars)
      ?? game.planets.find(isMars);
    if (!mars) {
      setMessage('No se encontró Marte para viajar.');
      return;
    }
    if (game.scene !== 'surface' || game.surface?.planet !== mars) enterPlanet(mars);
    showPlayerChatMessage('/mars');
    setMessage('Viajando a Marte.');
    chatInput.value = '';
    closeChatComposer();
    return;
  }
  if (/^\/fuel(?:\s|$)/i.test(message)) {
    addResourceToInventory('fuel', MAX_ITEM_STACK * 4);
    if (!inventoryPanel.hidden) updateInventoryItemsGrid();
    updateHud();
    showPlayerChatMessage('/fuel');
    setMessage('Recibiste 4 stacks de combustible.');
    chatInput.value = '';
    closeChatComposer();
    saveGameState();
    return;
  }
  if (/^\/regolito(?:\s|$)/i.test(message)) {
    addResourceToInventory('regolith', MAX_ITEM_STACK);
    if (!inventoryPanel.hidden) updateInventoryItemsGrid();
    updateHud();
    showPlayerChatMessage('/regolito');
    setMessage(`Recibiste 1 stack de regolito (${MAX_ITEM_STACK}).`);
    chatInput.value = '';
    closeChatComposer();
    saveGameState();
    return;
  }
  if (/^\/money(?:\s|$)/i.test(message)) {
    game.player.credits += 5000;
    updateHud();
    showPlayerChatMessage('/money');
    setMessage('Recibiste 5.000 créditos.');
    chatInput.value = '';
    closeChatComposer();
    saveGameState();
    return;
  }
  if (/^\/enemy(?:\s|$)/i.test(message)) {
    if (game.scene === 'space') {
      for (let index = 0; index < 3; index += 1) spawnHostileDrone();
      showPlayerChatMessage('/enemy');
      setMessage('¡Aparecieron 3 enemigos cerca de tu nave!');
    } else if (game.scene === 'surface' && (isMars(game.surface?.planet) || isLuna(game.surface?.planet))) {
      const lunatic = isLuna(game.surface.planet);
      const enemy = spawnMartianEnemy(20, lunatic ? 'lunatic' : 'martian');
      if (!enemy) {
        setMessage(`No se encontró espacio libre para ${lunatic ? 'el alien lunático' : 'el marciano hostil'}.`);
        return;
      }
      showPlayerChatMessage('/enemy');
      setMessage(`Apareció ${lunatic ? 'un alien lunático' : 'un marciano hostil'} a 20 tiles.`);
    } else {
      setMessage('/enemy funciona en el espacio, Marte o la Luna.');
      return;
    }
    chatInput.value = '';
    closeChatComposer();
    return;
  }
  if (message.startsWith('/')) {
    setMessage('Comando desconocido. Prueba /home, /mars, /enemy, /fuel, /regolito, /money, /mision, /repair o /craft.');
    return;
  }
  showPlayerChatMessage(message);
  multiplayerChatMessage = message;
  multiplayerChatMessageUntil = Date.now() + 9000;
  chatInput.value = '';
  closeChatComposer();
}

function getMultiplayerSnapshot() {
  const onSurface = game.scene === 'surface' && game.surface;
  const surfaceWorld = onSurface ? {
    planet: game.surface.planet.name,
    pickups: game.surface.pickups.map((pickup) => ({
      id: pickup.id,
      resourceKey: pickup.resourceKey,
      count: pickup.count,
      x: pickup.x / SURFACE_WORLD_SIZE,
      y: pickup.y / SURFACE_WORLD_SIZE,
    })),
    earthWanderer: isHomeworld(game.surface.planet) && game.earthWanderer ? {
      x: game.earthWanderer.x / SURFACE_WORLD_SIZE,
      y: game.earthWanderer.y / SURFACE_WORLD_SIZE,
      facing: game.earthWanderer.facing,
      animationFrame: game.earthWanderer.animationFrame,
      hueOffset: game.earthWanderer.hueOffset,
      greetingTarget: game.earthWanderer.greetingTarget,
      greetingPhase: game.earthWanderer.greetingPhase,
    } : null,
    martianNpcs: isMars(game.surface.planet) && game.martianNpcs
      ? game.martianNpcs.map((npc) => ({
        x: npc.x / SURFACE_WORLD_SIZE,
        y: npc.y / SURFACE_WORLD_SIZE,
        facing: npc.facing,
        animationFrame: npc.animationFrame,
      }))
      : null,
  } : null;
  return {
    id: multiplayerPlayerId,
    name: multiplayerName,
    scene: game.scene,
    x: onSurface ? game.surface.x : game.player.x,
    y: onSurface ? game.surface.y : game.player.y,
    rotation: game.player.rotation,
    velocityX: game.player.velocityX,
    velocityY: game.player.velocityY,
    planet: onSurface ? game.surface.planet.name : '',
    surfaceX: onSurface ? game.surface.x / SURFACE_WORLD_SIZE : 0.5,
    surfaceY: onSurface ? game.surface.y / SURFACE_WORLD_SIZE : 0.5,
    facing: onSurface ? game.surface.facing : 'down',
    animationFrame: onSurface ? game.surface.animationFrame : 1,
    hue: game.player.hue,
    shipParts: game.player.shipParts,
    surfaceWorld,
    chat: Date.now() < multiplayerChatMessageUntil ? multiplayerChatMessage : '',
    sentAt: Date.now(),
  };
}

async function syncMultiplayer() {
  if (!multiplayerEndpoint || !accountReady || !authSession?.token || multiplayerSyncBusy) return;
  multiplayerSyncBusy = true;
  try {
    const snapshot = getMultiplayerSnapshot();
    if (snapshot.surfaceWorld) {
      const changedWorld = snapshot.surfaceWorld.planet !== lastMultiplayerWorldPlanetSent;
      const shouldSendWorld = changedWorld || !multiplayerReady || multiplayerIsWorldOwner
        ? changedWorld || Date.now() - lastMultiplayerWorldSentAt >= 500
        : false;
      if (shouldSendWorld) {
        lastMultiplayerWorldSentAt = Date.now();
        lastMultiplayerWorldPlanetSent = snapshot.surfaceWorld.planet;
      }
      else delete snapshot.surfaceWorld;
    }
    const response = await fetch(multiplayerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.token}` },
      body: JSON.stringify(snapshot),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const responseState = await response.json();
    const peers = Array.isArray(responseState) ? responseState : responseState.players;
    const activeWorldKey = game.scene === 'surface' && game.surface
      ? game.surface.planet.name.toLowerCase()
      : '';
    multiplayerWorldOwnerId = Array.isArray(responseState)
      ? ''
      : responseState.worldOwners?.[activeWorldKey] || '';
    multiplayerIsWorldOwner = multiplayerWorldOwnerId === multiplayerPlayerId;
    multiplayerWorlds = Array.isArray(responseState) ? {} : (responseState.worlds || {});
    multiplayerWorldRevision += 1;
    const previousPlayers = new Map(multiplayerPlayers.map((player) => [player.id, player]));
    const receivedAt = Date.now();
    multiplayerPlayers = Array.isArray(peers) ? peers.map((player) => {
      const previous = previousPlayers.get(player.id);
      const sameLocation = previous
        && previous.scene === player.scene
        && (player.scene !== 'surface' || previous.planet?.toLowerCase() === player.planet?.toLowerCase());
      let surfaceVelocityX = sameLocation ? (previous.surfaceVelocityX || 0) : 0;
      let surfaceVelocityY = sameLocation ? (previous.surfaceVelocityY || 0) : 0;
      const snapshotDelta = sameLocation ? (player.sentAt - previous.sentAt) / 1000 : 0;
      if (player.scene === 'surface' && snapshotDelta > 0.015 && snapshotDelta < 1) {
        let dx = player.surfaceX - previous.surfaceX;
        let dy = player.surfaceY - previous.surfaceY;
        if (dx > 0.5) dx -= 1;
        if (dx < -0.5) dx += 1;
        if (dy > 0.5) dy -= 1;
        if (dy < -0.5) dy += 1;
        const estimateX = clamp(dx * SURFACE_WORLD_SIZE / snapshotDelta, -1200, 1200);
        const estimateY = clamp(dy * SURFACE_WORLD_SIZE / snapshotDelta, -1200, 1200);
        surfaceVelocityX = surfaceVelocityX * 0.35 + estimateX * 0.65;
        surfaceVelocityY = surfaceVelocityY * 0.35 + estimateY * 0.65;
      }
      return {
        ...player,
        receivedAt,
        surfaceVelocityX,
        surfaceVelocityY,
        drawX: sameLocation ? (previous.drawX ?? previous.x) : player.x,
        drawY: sameLocation ? (previous.drawY ?? previous.y) : player.y,
        drawSurfaceX: sameLocation ? (previous.drawSurfaceX ?? previous.surfaceX) : player.surfaceX,
        drawSurfaceY: sameLocation ? (previous.drawSurfaceY ?? previous.surfaceY) : player.surfaceY,
      };
    }) : [];
    multiplayerReady = true;
    const count = multiplayerPlayers.length;
    multiplayerStatus.textContent = count ? `EN LÍNEA · ${count + 1} JUGADORES` : 'EN LÍNEA · ESPERANDO JUGADORES';
    multiplayerStatus.classList.add('multiplayer-online');
    multiplayerStatus.classList.remove('multiplayer-offline');
  } catch (error) {
    multiplayerReady = false;
    multiplayerPlayers = [];
    multiplayerStatus.textContent = 'SIN CONEXIÓN';
    multiplayerStatus.classList.add('multiplayer-offline');
    multiplayerStatus.classList.remove('multiplayer-online');
  } finally {
    multiplayerSyncBusy = false;
  }
}

if (multiplayerEndpoint) {
  multiplayerStatus.hidden = false;
  window.setInterval(syncMultiplayer, 50);
}

function updateMultiplayerInterpolation(dt) {
  const blend = 1 - Math.exp(-36 * dt);
  for (const remote of multiplayerPlayers) {
    const predictionSeconds = Math.min(Math.max((Date.now() - remote.receivedAt) / 1000, 0), 0.14);
    const targetX = remote.x + (remote.scene === 'space' ? (remote.velocityX || 0) * predictionSeconds : 0);
    const targetY = remote.y + (remote.scene === 'space' ? (remote.velocityY || 0) * predictionSeconds : 0);
    remote.drawX += (targetX - remote.drawX) * blend;
    remote.drawY += (targetY - remote.drawY) * blend;
    let predictedSurfaceX = remote.surfaceX + (remote.surfaceVelocityX || 0) * predictionSeconds / SURFACE_WORLD_SIZE;
    let predictedSurfaceY = remote.surfaceY + (remote.surfaceVelocityY || 0) * predictionSeconds / SURFACE_WORLD_SIZE;
    predictedSurfaceX = (predictedSurfaceX % 1 + 1) % 1;
    predictedSurfaceY = (predictedSurfaceY % 1 + 1) % 1;
    let surfaceDeltaX = predictedSurfaceX - remote.drawSurfaceX;
    let surfaceDeltaY = predictedSurfaceY - remote.drawSurfaceY;
    if (surfaceDeltaX > 0.5) surfaceDeltaX -= 1;
    if (surfaceDeltaX < -0.5) surfaceDeltaX += 1;
    if (surfaceDeltaY > 0.5) surfaceDeltaY -= 1;
    if (surfaceDeltaY < -0.5) surfaceDeltaY += 1;
    remote.drawSurfaceX = (remote.drawSurfaceX + surfaceDeltaX * blend + 1) % 1;
    remote.drawSurfaceY = (remote.drawSurfaceY + surfaceDeltaY * blend + 1) % 1;
  }
  applySharedSurfaceWorld(dt, blend);
}

function applySharedSurfaceWorld(dt, blend) {
  if (!multiplayerReady || game.scene !== 'surface' || !game.surface) return;
  const worldKey = game.surface.planet.name.toLowerCase();
  const world = multiplayerWorlds[worldKey];
  if (!world) return;

  if (multiplayerAppliedWorldRevision !== multiplayerWorldRevision) {
    const collected = game.player.collectedPickupIds;
    game.surface.pickups = world.pickups
      .filter((pickup) => !collected.has(pickup.id))
      .map((pickup) => {
        const resource = RESOURCE_CATALOG[pickup.resourceKey];
        if (!resource) return null;
        return {
          id: pickup.id,
          resourceKey: pickup.resourceKey,
          name: resource.name,
          icon: resource.icon,
          color: resource.color,
          count: pickup.count,
          x: pickup.x * SURFACE_WORLD_SIZE,
          y: pickup.y * SURFACE_WORLD_SIZE,
        };
      })
      .filter(Boolean);
    multiplayerEarthWandererTarget = world.earthWanderer || null;
    multiplayerMartianTargets = Array.isArray(world.martianNpcs) ? world.martianNpcs : null;
    multiplayerAppliedWorldRevision = multiplayerWorldRevision;
  }

  if (!multiplayerIsWorldOwner && isHomeworld(game.surface.planet) && !multiplayerEarthWandererTarget) {
    game.earthWanderer = null;
  }
  if (!multiplayerIsWorldOwner && isHomeworld(game.surface.planet) && multiplayerEarthWandererTarget) {
    const target = multiplayerEarthWandererTarget;
    const npc = game.earthWanderer || (game.earthWanderer = {
      x: target.x * SURFACE_WORLD_SIZE,
      y: target.y * SURFACE_WORLD_SIZE,
      facing: target.facing,
      animationFrame: target.animationFrame,
      animationTimer: 0,
      hueOffset: target.hueOffset,
      mode: 'wander',
      greetingTarget: target.greetingTarget,
      greetingPhase: target.greetingPhase,
      route: [],
      step: null,
      wait: 0,
      wanderTime: 0,
    });
    const syncKey = `${worldKey}:earthWanderer`;
    if (!multiplayerSyncedSurfaceEntities.has(syncKey)) {
      npc.x = target.x * SURFACE_WORLD_SIZE;
      npc.y = target.y * SURFACE_WORLD_SIZE;
      multiplayerSyncedSurfaceEntities.add(syncKey);
    } else {
      npc.x = wrapSurfaceCoordinate(npc.x + getSurfaceAxisDelta(target.x * SURFACE_WORLD_SIZE, npc.x) * blend);
      npc.y = wrapSurfaceCoordinate(npc.y + getSurfaceAxisDelta(target.y * SURFACE_WORLD_SIZE, npc.y) * blend);
    }
    npc.facing = target.facing;
    npc.animationFrame = target.animationFrame;
    npc.hueOffset = target.hueOffset;
    npc.greetingTarget = target.greetingTarget;
    npc.greetingPhase = target.greetingPhase;
  }

  if (!multiplayerIsWorldOwner && isMars(game.surface.planet) && multiplayerMartianTargets) {
    if (!Array.isArray(game.martianNpcs) || game.martianNpcs.length !== multiplayerMartianTargets.length) {
      game.martianNpcs = multiplayerMartianTargets.map((npc, index) => ({
        id: index,
        x: npc.x * SURFACE_WORLD_SIZE,
        y: npc.y * SURFACE_WORLD_SIZE,
        facing: npc.facing,
        animationFrame: npc.animationFrame,
        animationTimer: 0,
        wait: 0,
        step: null,
        isMoving: false,
      }));
    }
    game.martianNpcs.forEach((npc, index) => {
      const target = multiplayerMartianTargets[index];
      const syncKey = `${worldKey}:martian:${index}`;
      if (!multiplayerSyncedSurfaceEntities.has(syncKey)) {
        npc.x = target.x * SURFACE_WORLD_SIZE;
        npc.y = target.y * SURFACE_WORLD_SIZE;
        multiplayerSyncedSurfaceEntities.add(syncKey);
      } else {
        npc.x = wrapSurfaceCoordinate(npc.x + getSurfaceAxisDelta(target.x * SURFACE_WORLD_SIZE, npc.x) * blend);
        npc.y = wrapSurfaceCoordinate(npc.y + getSurfaceAxisDelta(target.y * SURFACE_WORLD_SIZE, npc.y) * blend);
      }
      npc.facing = target.facing;
      npc.animationFrame = target.animationFrame;
    });
  }
}

chatComposer.addEventListener('submit', (event) => {
  event.preventDefault();
  sendChatMessage(chatInput.value);
});

const SURFACE_WALK_SPEED = 145;
const MARTIAN_ENEMY_MAX_HEALTH = 3;
const MARTIAN_ENEMY_DETECTION_RANGE = CHUNK_SIZE * 2;
const MARTIAN_ENEMY_SIGHT_RANGE = SURFACE_TILE * 14;
const MARTIAN_ENEMY_ATTACK_RANGE = SURFACE_TILE * 10;
const MARTIAN_ENEMY_SPAWN_LIMIT = 8;

// Casillas ocupadas por objetos del suelo y NPC: se comportan como paredes.
const SHIP_TILE_OFFSETS = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]];

// Posiciones (proporción del canvas) de los NPC de la Tierra; se alinean a la cuadrícula.
const HOME_NPC_LAYOUT = {
  merchant: { x: 0.2, y: 0.38 },
  repairer: { x: 0.5, y: 0.58 },
  questGiver: { x: 0.84, y: 0.3 },
  chest: { x: 0.2, y: 0.76 },
  workbench: { x: 0.84, y: 0.76 },
};

function getHomeNpcPosition(key) {
  const layout = HOME_NPC_LAYOUT[key];
  const layoutWidth = game.surface?.baseViewportWidth ?? game.width;
  const layoutHeight = game.surface?.baseViewportHeight ?? game.height;
  return {
    x: snapSurfaceCoordinate((game.surface?.shipX ?? SURFACE_WORLD_SIZE * 0.58125) + (layout.x - 0.58125) * layoutWidth),
    y: snapSurfaceCoordinate((game.surface?.shipY ?? SURFACE_WORLD_SIZE * 0.6) + (layout.y - 0.6) * layoutHeight),
  };
}

function getHomeChestPosition() {
  return getHomeNpcPosition('chest');
}

function createEarthWanderer() {
  const player = game.surface;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const point = snapSurfacePoint(
      player.shipX + (player.baseViewportWidth ?? game.width) * (0.62 + Math.random() * 0.22 - 0.58125),
      player.shipY + (player.baseViewportHeight ?? game.height) * (0.4 + Math.random() * 0.32 - 0.6)
    );
    if (
      !isSurfaceTileBlocked(point.x, point.y) &&
      getSurfaceDistance(point.x, point.y, player.x, player.y) > SURFACE_TILE * 3
    ) {
      return {
        ...point,
        facing: 'down',
        step: null,
        wait: 0.4 + Math.random() * 1.2,
        animationFrame: 1,
        animationTimer: 0,
        hueOffset: Math.random() * 360,
        mode: 'wander',
        wanderTime: 0,
        route: [],
        greetingTarget: null,
        greetingPhase: null,
        greetingUntil: 0,
      };
    }
  }
  return {
    ...snapSurfacePoint(
      player.shipX + (player.baseViewportWidth ?? game.width) * (0.68 - 0.58125),
      player.shipY + (player.baseViewportHeight ?? game.height) * (0.46 - 0.6)
    ),
    facing: 'down',
    step: null,
    wait: 1,
    animationFrame: 1,
    animationTimer: 0,
    hueOffset: Math.random() * 360,
    mode: 'wander',
    wanderTime: 0,
    route: [],
    greetingTarget: null,
    greetingPhase: null,
    greetingUntil: 0,
  };
}

function findEarthWandererGreetingRoute(npc, target) {
  const destinations = [
    { x: target.x + SURFACE_TILE, y: target.y },
    { x: target.x - SURFACE_TILE, y: target.y },
    { x: target.x, y: target.y + SURFACE_TILE },
    { x: target.x, y: target.y - SURFACE_TILE },
  ].map((point) => snapSurfacePoint(point.x, point.y))
    .filter((point) => !isSurfaceTileBlocked(point.x, point.y, npc.x, npc.y));
  const destinationKeys = new Set(destinations.map((point) => `${point.x},${point.y}`));
  const start = snapSurfacePoint(npc.x, npc.y);
  const localSearchRadius = Math.max(game.width, game.height) * 3;
  const queue = [{ ...start, route: [] }];
  const visited = new Set([`${start.x},${start.y}`]);
  const directions = [
    { x: SURFACE_TILE, y: 0, facing: 'right' },
    { x: -SURFACE_TILE, y: 0, facing: 'left' },
    { x: 0, y: SURFACE_TILE, facing: 'down' },
    { x: 0, y: -SURFACE_TILE, facing: 'up' },
  ];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (destinationKeys.has(`${current.x},${current.y}`)) return current.route;
    for (const direction of directions) {
      const next = snapSurfacePoint(current.x + direction.x, current.y + direction.y);
      const key = `${next.x},${next.y}`;
      if (
        visited.has(key) ||
        getSurfaceDistance(next.x, next.y, start.x, start.y) > localSearchRadius ||
        isSurfaceTileBlocked(next.x, next.y, npc.x, npc.y)
      ) continue;
      visited.add(key);
      queue.push({
        ...next,
        route: [...current.route, { ...next, facing: direction.facing }],
      });
    }
  }
  return null;
}

function startEarthWandererGreeting(npc) {
  const targets = [
    { key: 'merchant', position: getMerchantPosition() },
    { key: 'repairer', position: getRepairerPosition() },
    { key: 'questGiver', position: getQuestGiverPosition() },
  ].sort(() => Math.random() - 0.5);
  for (const target of targets) {
    const route = findEarthWandererGreetingRoute(npc, target.position);
    if (!route) continue;
    npc.mode = 'greeting';
    npc.greetingTarget = target.key;
    npc.route = route;
    if (route.length === 0) {
      npc.greetingPhase = 'hello';
      npc.greetingUntil = game.time + 1.1;
    }
    return true;
  }
  npc.wanderTime = 55;
  return false;
}

function createMartianNpcs() {
  const npcs = [];
  for (let index = 0; index < 3; index += 1) {
    let point = null;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = snapSurfacePoint(
        game.surface.x + (Math.random() * 2 - 1) * SURFACE_TILE * 6,
        game.surface.y + (Math.random() * 2 - 1) * SURFACE_TILE * 6
      );
      const occupiedByMartian = npcs.some((npc) =>
        Math.floor(npc.x / SURFACE_TILE) === Math.floor(candidate.x / SURFACE_TILE) &&
        Math.floor(npc.y / SURFACE_TILE) === Math.floor(candidate.y / SURFACE_TILE)
      );
      if (
        !occupiedByMartian && !isSurfaceTileBlocked(candidate.x, candidate.y) &&
        getSurfaceDistance(candidate.x, candidate.y, game.surface.x, game.surface.y) > SURFACE_TILE * 2
      ) {
        point = candidate;
        break;
      }
    }
    point ||= snapSurfacePoint(
      game.surface.x + (index - 1) * SURFACE_TILE * 3,
      game.surface.y - SURFACE_TILE * 3
    );
    npcs.push({
      id: index,
      x: point.x,
      y: point.y,
      facing: 'down',
      step: null,
      wait: Math.random() * 1.4,
      isMoving: false,
      animationFrame: 1,
      animationTimer: 0,
    });
  }
  return npcs;
}

function isMartianTileBlocked(x, y, npc) {
  const cellX = wrapCell(Math.floor(wrapSurfaceCoordinate(x) / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE);
  const cellY = wrapCell(Math.floor(wrapSurfaceCoordinate(y) / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE);
  return isSurfaceTileBlocked(x, y, npc.x, npc.y) || game.martianNpcs.some((other) =>
    other !== npc &&
    wrapCell(Math.floor(other.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellX &&
    wrapCell(Math.floor(other.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellY
  );
}

function updateMartianWalking(npc, dt) {
  const wasMoving = npc.isMoving;
  npc.isMoving = false;
  if (!npc.step) {
    npc.wait -= dt;
    if (npc.wait <= 0) {
      const directions = [
        { x: 1, y: 0, facing: 'right' },
        { x: -1, y: 0, facing: 'left' },
        { x: 0, y: 1, facing: 'down' },
        { x: 0, y: -1, facing: 'up' },
      ].sort(() => Math.random() - 0.5);
      for (const direction of directions) {
        const toX = wrapSurfaceCoordinate(npc.x + direction.x * SURFACE_TILE);
        const toY = wrapSurfaceCoordinate(npc.y + direction.y * SURFACE_TILE);
        if (isMartianTileBlocked(toX, toY, npc)) continue;
        npc.facing = direction.facing;
        npc.step = { toX, toY };
        break;
      }
      if (!npc.step) npc.wait = 0.5 + Math.random() * 1.3;
    }
  }
  if (npc.step) {
    const dx = getSurfaceAxisDelta(npc.step.toX, npc.x);
    const dy = getSurfaceAxisDelta(npc.step.toY, npc.y);
    const distance = Math.hypot(dx, dy);
    const move = Math.min(SURFACE_WALK_SPEED * 0.42 * dt, distance);
    npc.x = wrapSurfaceCoordinate(npc.x + (dx / distance) * move);
    npc.y = wrapSurfaceCoordinate(npc.y + (dy / distance) * move);
    npc.isMoving = true;
    if (move >= distance - 1e-6) {
      npc.x = npc.step.toX;
      npc.y = npc.step.toY;
      npc.step = null;
      npc.wait = 0.25 + Math.random() * 1.1;
    }
  }
  if (npc.isMoving) {
    if (!wasMoving) {
      npc.animationFrame = 0;
      npc.animationTimer = 0;
    } else {
      npc.animationTimer += dt;
      while (npc.animationTimer >= PLAYER_ANIMATION_FRAME_DURATION) {
        npc.animationTimer -= PLAYER_ANIMATION_FRAME_DURATION;
        npc.animationFrame = (npc.animationFrame + 1) % 4;
      }
    }
  } else {
    npc.animationFrame = 1;
    npc.animationTimer = 0;
  }
}

function updateMartianNpcs(dt) {
  if (game.scene !== 'surface' || !isMars(game.surface.planet)) return;
  if (!game.martianNpcs) {
    game.martianNpcs = createMartianNpcs();
    game.martianChatTimer = 12 + Math.random() * 16;
  }
  const npcs = game.martianNpcs;
  let talkingIds = new Set();
  const conversation = game.martianConversation;
  if (conversation) {
    const first = npcs.find((npc) => npc.id === conversation.firstId);
    const second = npcs.find((npc) => npc.id === conversation.secondId);
    if (!first || !second) {
      game.martianConversation = null;
    } else {
      talkingIds = new Set([first.id, second.id]);
      const faceEachOther = (npc, other) => {
        const dx = other.x - npc.x;
        const dy = other.y - npc.y;
        npc.facing = Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? 'left' : 'right')
          : (dy < 0 ? 'up' : 'down');
        npc.step = null;
        npc.isMoving = false;
        npc.animationFrame = 1;
        npc.animationTimer = 0;
      };
      faceEachOther(first, second);
      faceEachOther(second, first);
      if (game.time >= conversation.until) {
        conversation.phase += 1;
        if (conversation.phase >= conversation.lines.length) {
          game.martianConversation = null;
          talkingIds.clear();
        } else {
          conversation.until = game.time + 1.35;
        }
      }
    }
  }
  if (!game.martianConversation) {
    game.martianChatTimer -= dt;
    if (game.martianChatTimer <= 0) {
      const pairs = [];
      for (let firstIndex = 0; firstIndex < npcs.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < npcs.length; secondIndex += 1) {
          const first = npcs[firstIndex];
          const second = npcs[secondIndex];
          const distance = getSurfaceDistance(first.x, first.y, second.x, second.y);
          if (!first.step && !second.step && distance <= SURFACE_TILE * 7) {
            pairs.push({ first, second, distance });
          }
        }
      }
      pairs.sort((a, b) => a.distance - b.distance);
      const pair = pairs[0];
      if (pair) {
        const conversations = [
          ['¿Encontraste algo interesante?', 'Unos minerales brillantes por allá.', '¡Después vamos a mirar!'],
          ['¿Cómo va la caminata?', 'Bien, aunque hay bastante polvo.', 'Sí, mejor seguimos.'],
          ['¿Viste pasar una nave?', 'Sí, iba rumbo a las estrellas.', 'Ojalá vuelva pronto.'],
        ];
        game.martianConversation = {
          firstId: pair.first.id,
          secondId: pair.second.id,
          lines: conversations[Math.floor(Math.random() * conversations.length)],
          phase: 0,
          until: game.time + 1.35,
        };
        talkingIds = new Set([pair.first.id, pair.second.id]);
        game.martianChatTimer = 20 + Math.random() * 25;
      } else {
        game.martianChatTimer = 4;
      }
    }
  }
  for (const npc of npcs) {
    if (!talkingIds.has(npc.id)) updateMartianWalking(npc, dt);
  }
}

function hasMountainBesideMarsTile(x, y) {
  for (const offsetY of [-1, 0, 1]) {
    for (const offsetX of [-1, 0, 1]) {
      if (offsetX === 0 && offsetY === 0) continue;
      if (isMarsMountainCellBlocked(x + offsetX * SURFACE_TILE, y + offsetY * SURFACE_TILE)) return true;
    }
  }
  return false;
}

function canSpawnMartianEnemyAt(x, y) {
  if (isSurfaceTileBlocked(x, y)) return false;
  const cellX = wrapCell(Math.floor(x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE);
  const cellY = wrapCell(Math.floor(y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE);
  const occupiedByFriendly = game.martianNpcs?.some((npc) =>
    wrapCell(Math.floor(npc.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellX &&
    wrapCell(Math.floor(npc.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellY
  );
  const occupiedByEnemy = game.martianEnemies.some((enemy) =>
    wrapCell(Math.floor(enemy.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellX &&
    wrapCell(Math.floor(enemy.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellY
  );
  return !occupiedByFriendly && !occupiedByEnemy;
}

function findMartianEnemySpawnPoint(distanceTiles = null, requireMountain = true, preferredDirection = null) {
  const attempts = 240;
  const preferredAngle = preferredDirection && (preferredDirection.x || preferredDirection.y)
    ? Math.atan2(preferredDirection.y, preferredDirection.x)
    : null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle = preferredAngle === null
      ? (attempt + Math.random()) / attempts * Math.PI * 2
      : preferredAngle + (((attempt + Math.random()) / attempts) - 0.5) * Math.PI * 0.55;
    // Mantener los spawns dentro del radio donde el jugador puede detectarlos.
    const maxSpawnDistanceTiles = Math.floor(CHUNK_SIZE * 2 / SURFACE_TILE);
    const distance = SURFACE_TILE * (distanceTiles ?? (
      25 + Math.random() * Math.max(1, maxSpawnDistanceTiles - 25)
    ));
    const point = snapSurfacePoint(
      game.surface.x + Math.cos(angle) * distance,
      game.surface.y + Math.sin(angle) * distance
    );
    if (!canSpawnMartianEnemyAt(point.x, point.y)) continue;
    if (requireMountain && distanceTiles === null && !hasMountainBesideMarsTile(point.x, point.y)) continue;
    return point;
  }
  if (distanceTiles !== null) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const angle = attempt / attempts * Math.PI * 2;
      const point = snapSurfacePoint(
        game.surface.x + Math.cos(angle) * SURFACE_TILE * distanceTiles,
        game.surface.y + Math.sin(angle) * SURFACE_TILE * distanceTiles
      );
      if (canSpawnMartianEnemyAt(point.x, point.y)) return point;
    }
  }
  return null;
}

function spawnMartianEnemy(distanceTiles = null, type = 'martian', preferredDirection = null) {
  const lunatic = type === 'lunatic';
  if (game.scene !== 'surface' || !game.surface || !(lunatic ? isLuna(game.surface.planet) : isMars(game.surface.planet))) return null;
  const point = findMartianEnemySpawnPoint(distanceTiles, !lunatic, preferredDirection);
  if (!point) return null;
  const enemy = {
    id: game.martianEnemySequence++,
    type,
    planetName: game.surface.planet.name,
    runSpeedMultiplier: lunatic ? 2 : 1,
    x: point.x,
    y: point.y,
    hp: MARTIAN_ENEMY_MAX_HEALTH,
    maxHp: MARTIAN_ENEMY_MAX_HEALTH,
    ammo: 6,
    maxAmmo: 6,
    reloadUntil: 0,
    reloadStartedAt: 0,
    loot: {},
    miningTargetId: null,
    miningUntil: 0,
    facing: 'down',
    step: null,
    turnUntil: 0,
    wait: 0.2,
    isMoving: false,
    animationFrame: 1,
    animationTimer: 0,
    shotUntil: 0,
    fireCooldown: 0.6 + Math.random() * 0.8,
  };
  enemy.miningTargetId = findMartianMiningTarget(enemy)?.id ?? null;
  game.martianEnemies.push(enemy);
  return enemy;
}

function isMartianEnemyTileBlocked(x, y, enemy) {
  if (isSurfaceTileBlocked(x, y, enemy.x, enemy.y)) return true;
  const cellX = wrapCell(Math.floor(wrapSurfaceCoordinate(x) / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE);
  const cellY = wrapCell(Math.floor(wrapSurfaceCoordinate(y) / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE);
  return game.martianEnemies.some((other) => other !== enemy &&
    wrapCell(Math.floor(other.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellX &&
    wrapCell(Math.floor(other.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellY
  ) || game.martianNpcs?.some((npc) =>
    wrapCell(Math.floor(npc.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellX &&
    wrapCell(Math.floor(npc.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellY
  );
}

function hasMartianLineOfSight(fromX, fromY, toX, toY) {
  if (!isMars(game.surface?.planet)) return true;
  const dx = getSurfaceAxisDelta(toX, fromX);
  const dy = getSurfaceAxisDelta(toY, fromY);
  const distance = Math.hypot(dx, dy);
  const steps = Math.ceil(distance / (SURFACE_TILE / 2));
  for (let step = 1; step < steps; step += 1) {
    const progress = step / steps;
    if (isMarsMountainCellBlocked(fromX + dx * progress, fromY + dy * progress)) return false;
  }
  return true;
}

function getMartianAimFacing(dx, dy) {
  return Math.abs(dx) >= Math.abs(dy)
    ? (dx < 0 ? 'left' : 'right')
    : (dy < 0 ? 'up' : 'down');
}

function isMartianFiringPosition(x, y) {
  const dx = getSurfaceAxisDelta(game.surface.x, x);
  const dy = getSurfaceAxisDelta(game.surface.y, y);
  const distance = Math.hypot(dx, dy);
  const aligned = Math.min(Math.abs(dx), Math.abs(dy)) <= SURFACE_TILE * 0.6;
  return distance <= MARTIAN_ENEMY_ATTACK_RANGE && aligned &&
    hasMartianLineOfSight(x, y, game.surface.x, game.surface.y);
}

function findMartianEnemyPathStep(enemy, miningTarget = null) {
  const columnCount = SURFACE_WORLD_SIZE / SURFACE_TILE;
  const startX = wrapCell(Math.floor(enemy.x / SURFACE_TILE), columnCount);
  const startY = wrapCell(Math.floor(enemy.y / SURFACE_TILE), columnCount);
  const queue = [{ x: startX, y: startY, first: null, depth: 0 }];
  const visited = new Set([`${startX},${startY}`]);
  const directions = [
    { x: 1, y: 0, facing: 'right' },
    { x: -1, y: 0, facing: 'left' },
    { x: 0, y: 1, facing: 'down' },
    { x: 0, y: -1, facing: 'up' },
  ];
  for (let cursor = 0; cursor < queue.length && visited.size < 600; cursor += 1) {
    const node = queue[cursor];
    const worldX = wrapSurfaceCoordinate((node.x + 0.5) * SURFACE_TILE);
    const worldY = wrapSurfaceCoordinate((node.y + 0.5) * SURFACE_TILE);
    const reachedGoal = miningTarget
      ? getSurfaceDistance(worldX, worldY, miningTarget.x, miningTarget.y) <= SURFACE_TILE * 1.1
      : isMartianFiringPosition(worldX, worldY);
    if (node.first && reachedGoal) return node.first;
    if (node.depth >= 28) continue;
    const orderedDirections = directions.slice().sort((a, b) => {
      const aDistance = getSurfaceDistance(
        worldX + a.x * SURFACE_TILE, worldY + a.y * SURFACE_TILE,
        game.surface.x, game.surface.y
      );
      const bDistance = getSurfaceDistance(
        worldX + b.x * SURFACE_TILE, worldY + b.y * SURFACE_TILE,
        game.surface.x, game.surface.y
      );
      return aDistance - bDistance;
    });
    for (const direction of orderedDirections) {
      const nextX = wrapCell(node.x + direction.x, columnCount);
      const nextY = wrapCell(node.y + direction.y, columnCount);
      const key = `${nextX},${nextY}`;
      if (visited.has(key)) continue;
      const nextWorldX = wrapSurfaceCoordinate((nextX + 0.5) * SURFACE_TILE);
      const nextWorldY = wrapSurfaceCoordinate((nextY + 0.5) * SURFACE_TILE);
      if (isMartianEnemyTileBlocked(nextWorldX, nextWorldY, enemy)) continue;
      visited.add(key);
      queue.push({
        x: nextX,
        y: nextY,
        first: node.first ?? direction,
        depth: node.depth + 1,
      });
    }
  }
  return null;
}

function fireMartianEnemyGun(enemy, facing) {
  if (enemy.ammo <= 0 || enemy.reloadUntil > game.time) return false;
  const direction = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  }[facing];
  const placement = SURFACE_GUN_PLACEMENTS[facing];
  game.surfaceProjectiles.push({
    owner: 'martian',
    damage: 1,
    x: wrapSurfaceCoordinate(enemy.x + placement.x + direction.x * 27),
    y: wrapSurfaceCoordinate(enemy.y + placement.y + direction.y * 27),
    vx: direction.x * 1440,
    vy: direction.y * 1440,
    remainingDistance: CHUNK_SIZE * 4,
  });
  enemy.shotUntil = game.time + 0.18;
  enemy.fireCooldown = 1.05;
  enemy.ammo -= 1;
  if (enemy.ammo <= 0) {
    enemy.reloadStartedAt = game.time;
    enemy.reloadUntil = game.time + REGOLITO_GUN_RELOAD_SECONDS;
  }
  return true;
}

function damageMartianEnemy(enemy, damage) {
  if (!game.martianEnemies.includes(enemy)) return;
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.flashUntil = game.time + 0.15;
  game.player.damageHudUntil = game.time + 5;
  if (enemy.hp <= 0) {
    game.martianEnemies.splice(game.martianEnemies.indexOf(enemy), 1);
    const missionProgressText = handleSurfaceEnemyMissionKill(enemy);
    const lootSummary = [];
    for (const [resourceKey, count] of Object.entries(enemy.loot ?? {})) {
      if (count <= 0) continue;
      addResourceToInventory(resourceKey, count);
      lootSummary.push(`${count} ${RESOURCE_CATALOG[resourceKey]?.name?.toLowerCase() ?? resourceKey}`);
    }
    if (lootSummary.length) {
      setCombatMessage(enemy.type === 'lunatic' ? '¡Alien lunático derrotado!' : '¡Marciano derrotado!');
      setMessage(`BOTÍN: +${lootSummary.join(', +')}`);
    } else {
      setCombatMessage(enemy.type === 'lunatic' ? '¡Alien lunático derrotado!' : '¡Marciano hostil derrotado!');
    }
    if (!inventoryPanel.hidden) updateInventoryItemsGrid();
    updateHud();
    saveGameState();
    if (missionProgressText) {
      const lootText = lootSummary.length ? ` BOTÍN: +${lootSummary.join(', +')}.` : '';
      setMessage(`${missionProgressText}${lootText}`);
    }
  } else {
    setCombatMessage(`Impacto al marciano: ${enemy.hp}/${enemy.maxHp} HP.`);
  }
}

function damageEarthWanderer(npc, damage = 1) {
  if (!npc || npc !== game.earthWanderer || !isHomeworld(game.surface?.planet)) return;
  if (npc.talking || earthWandererDialogOpen) closeEarthWandererDialog();
  // El viajero reacciona a los impactos, pero nunca puede morir.
  npc.health = Infinity;
  npc.damageTaken = (npc.damageTaken ?? 0) + Math.max(0, damage);
  npc.hitFlashUntil = game.time + 0.18;
  npc.mode = 'flee';
  npc.fleeUntil = game.time + 8;
  npc.fleeFromX = game.surface.x;
  npc.fleeFromY = game.surface.y;
  npc.greetingTarget = null;
  npc.greetingPhase = null;
  npc.greetingUntil = 0;
  npc.route = [];
  npc.step = null;
  npc.wait = 0;
  setCombatMessage('¡El viajero recibió un impacto y salió corriendo!');
}

function damageSurfacePlayer(damage) {
  if (game.time < (game.player.surfaceDamageInvulnerableUntil ?? 0)) return;
  game.player.surfaceHealth = Math.max(0, (game.player.surfaceHealth ?? 3) - damage);
  game.player.surfaceDamageInvulnerableUntil = game.time + 0.75;
  game.player.surfaceDamageFlashUntil = game.time + 0.15;
  game.player.damageHudUntil = game.time + 5;
  let wasDefeated = false;
  if (game.player.surfaceHealth <= 0) {
    wasDefeated = true;
    game.player.surfaceHealth = 3;
    const shipPosition = getSurfaceShipPosition();
    // Reaparece en el punto donde aterriza el jugador, debajo de la nave.
    game.surface.x = shipPosition.x;
    game.surface.y = wrapSurfaceCoordinate(shipPosition.y + SURFACE_TILE * 2);
    game.surface.facing = 'up';
    game.surface.step = null;
    game.surface.isMoving = false;
    game.surface.turnUntil = 0;
    game.surface.quickStepDirection = null;
    game.surface.bumping = false;
    game.surface.animationTimer = 0;
    game.surface.respawnUntil = game.time + 0.35;
    game.surface.shotUntil = 0;
    game.surface.gunFiredUntil = 0;
    game.pointer.moveTarget = null;
    game.pointer.followPlanet = null;
    game.pointer.isDown = false;
    for (const key of Object.keys(MOVEMENT_KEY_DIRECTIONS)) game.keys[key] = false;
    // No reordenar el array mientras update() lo está recorriendo.
    for (const projectile of game.surfaceProjectiles) {
      if (projectile.owner === 'martian') projectile.remainingDistance = 0;
    }
    const boardWasEquipped = game.player.hoverboardEquipped;
    const boardWasDeployed = game.surface.hoverboard?.deployed;
    if (boardWasEquipped || boardWasDeployed) {
      const board = game.surface.hoverboard ?? (game.surface.hoverboard = {
        deployed: false, x: shipPosition.x, y: shipPosition.y, spawnUntil: 0, mountUntil: 0,
      });
      board.deployed = true;
      // Dejar el hoverboard junto al jugador para que siga accesible tras reaparecer.
      board.x = game.surface.x;
      board.y = game.surface.y;
      board.spawnUntil = 0;
      board.mountUntil = 0;
      game.player.hoverboardEquipped = false;
      saveSurfaceHoverboardState();
      updateInventoryItemsGrid();
      updateSurfaceAbilityBar();
    }
    game.player.surfaceDamageInvulnerableUntil = game.time + 1.5;
    setCombatMessage('Te derrotaron. Regresaste a la nave con la vida restaurada.');
  } else {
    setPlayerDamageMessage(`¡Te dispararon! ${game.player.surfaceHealth}/3 de vida.`);
  }
  if (wasDefeated) window.setTimeout(saveGameState, 0);
  else saveGameStateIfDue();
}

function findMartianMiningTarget(enemy) {
  return (game.surface.pickups ?? [])
    .filter((pickup) => pickup.count > 0)
    .sort((a, b) => getSurfaceDistance(a.x, a.y, enemy.x, enemy.y) -
      getSurfaceDistance(b.x, b.y, enemy.x, enemy.y))[0] ?? null;
}

function collectMartianMiningTarget(enemy, pickup) {
  const currentPickup = game.surface.pickups.find((item) => item.id === pickup.id);
  if (!currentPickup) {
    enemy.miningTargetId = null;
    enemy.miningUntil = 0;
    return;
  }
  enemy.loot[currentPickup.resourceKey] = (enemy.loot[currentPickup.resourceKey] ?? 0) + currentPickup.count;
  game.surface.pickups = game.surface.pickups.filter((item) => item.id !== currentPickup.id);
  const planetState = getPlanetResourceState(game.surface.planet);
  planetState.pickups = planetState.pickups.filter((item) => item.id !== currentPickup.id);
  surfacePickupIndexSource = null;
  enemy.miningTargetId = null;
  enemy.miningUntil = 0;
  enemy.pathDirection = null;
  enemy.pathThinkTimer = 0;
  saveGameState();
}

function getMartianMiningStep(enemy, target) {
  const dx = getSurfaceAxisDelta(target.x, enemy.x);
  const dy = getSurfaceAxisDelta(target.y, enemy.y);
  const distance = Math.hypot(dx, dy);
  const waypointDistance = SURFACE_TILE * 16;
  const waypoint = distance > waypointDistance
    ? {
      x: wrapSurfaceCoordinate(enemy.x + dx / distance * waypointDistance),
      y: wrapSurfaceCoordinate(enemy.y + dy / distance * waypointDistance),
    }
    : target;
  const pathStep = findMartianEnemyPathStep(enemy, waypoint);
  if (pathStep) return pathStep;

  const directions = [
    { x: 1, y: 0, facing: 'right' }, { x: -1, y: 0, facing: 'left' },
    { x: 0, y: 1, facing: 'down' }, { x: 0, y: -1, facing: 'up' },
  ].filter((direction) => !isMartianEnemyTileBlocked(
    wrapSurfaceCoordinate(enemy.x + direction.x * SURFACE_TILE),
    wrapSurfaceCoordinate(enemy.y + direction.y * SURFACE_TILE), enemy
  ));
  directions.sort((a, b) => {
    const aDistance = getSurfaceDistance(enemy.x + a.x * SURFACE_TILE, enemy.y + a.y * SURFACE_TILE, target.x, target.y);
    const bDistance = getSurfaceDistance(enemy.x + b.x * SURFACE_TILE, enemy.y + b.y * SURFACE_TILE, target.x, target.y);
    return aDistance - bDistance;
  });
  return directions[0] ?? null;
}

function updateMartianEnemy(enemy, dt) {
  enemy.fireCooldown = Math.max(0, enemy.fireCooldown - dt);
  enemy.shotUntil = Math.max(0, enemy.shotUntil);
  enemy.wait = Math.max(0, enemy.wait - dt);
  if (enemy.reloadUntil > 0 && game.time >= enemy.reloadUntil) {
    enemy.ammo = enemy.maxAmmo;
    enemy.reloadUntil = 0;
    enemy.reloadStartedAt = 0;
  }
  const dx = getSurfaceAxisDelta(game.surface.x, enemy.x);
  const dy = getSurfaceAxisDelta(game.surface.y, enemy.y);
  const distance = Math.hypot(dx, dy);
  const canSeePlayer = distance <= MARTIAN_ENEMY_SIGHT_RANGE &&
    hasMartianLineOfSight(enemy.x, enemy.y, game.surface.x, game.surface.y);
  let desiredStep = null;
  let targetFacing = null;
  enemy.pathThinkTimer = Math.max(0, (enemy.pathThinkTimer ?? 0) - dt);

  const isReloading = enemy.reloadUntil > game.time;
  let miningTarget = null;
  if (canSeePlayer && !isReloading) {
    enemy.alerted = true;
    enemy.miningTargetId = null;
    enemy.miningUntil = 0;
    targetFacing = getMartianAimFacing(dx, dy);
    if (isMartianFiringPosition(enemy.x, enemy.y)) {
      if (!enemy.step) {
        if (enemy.facing !== targetFacing) {
          enemy.facing = targetFacing;
          enemy.turnUntil = game.time + SURFACE_TILE / SURFACE_WALK_SPEED;
        } else if (game.time >= (enemy.turnUntil ?? 0) && enemy.fireCooldown <= 0 && enemy.ammo > 0) {
          fireMartianEnemyGun(enemy, targetFacing);
        }
        enemy.isMoving = false;
        enemy.animationFrame = 1;
        enemy.animationTimer = 0;
        return;
      }
    } else if (!enemy.step && enemy.wait <= 0) {
      if (enemy.pathThinkTimer <= 0) {
        desiredStep = findMartianEnemyPathStep(enemy);
        enemy.pathDirection = desiredStep;
        enemy.pathThinkTimer = 0.45;
      } else {
        desiredStep = enemy.pathDirection;
      }
    }
  } else if (isReloading) {
    enemy.alerted = canSeePlayer;
    const awayDirections = [
      { x: 1, y: 0, facing: 'right' }, { x: -1, y: 0, facing: 'left' },
      { x: 0, y: 1, facing: 'down' }, { x: 0, y: -1, facing: 'up' },
    ].filter((direction) => !isMartianEnemyTileBlocked(
      wrapSurfaceCoordinate(enemy.x + direction.x * SURFACE_TILE),
      wrapSurfaceCoordinate(enemy.y + direction.y * SURFACE_TILE),
      enemy
    )).sort((a, b) => {
      const aDistance = getSurfaceDistance(enemy.x + a.x * SURFACE_TILE, enemy.y + a.y * SURFACE_TILE, game.surface.x, game.surface.y);
      const bDistance = getSurfaceDistance(enemy.x + b.x * SURFACE_TILE, enemy.y + b.y * SURFACE_TILE, game.surface.x, game.surface.y);
      return bDistance - aDistance;
    });
    if (!enemy.step) desiredStep = awayDirections[0] ?? null;
    if (!desiredStep) enemy.wait = 0.15;
  } else {
    enemy.alerted = false;
    const targetIsAvailable = game.surface.pickups.some((pickup) => pickup.id === enemy.miningTargetId);
    if (!targetIsAvailable) {
      const nearestTarget = findMartianMiningTarget(enemy);
      enemy.miningTargetId = nearestTarget?.id ?? null;
      enemy.pathDirection = null;
      enemy.pathThinkTimer = 0;
      enemy.miningUntil = 0;
    }
    miningTarget = game.surface.pickups.find((pickup) => pickup.id === enemy.miningTargetId) ?? null;
    if (miningTarget && getSurfaceDistance(enemy.x, enemy.y, miningTarget.x, miningTarget.y) <= SURFACE_TILE * 1.1) {
      enemy.step = null;
      enemy.isMoving = false;
      enemy.animationFrame = 1;
      enemy.miningUntil ||= game.time + 1.5;
      if (game.time >= enemy.miningUntil) collectMartianMiningTarget(enemy, miningTarget);
      if (enemy.miningTargetId) return;
      miningTarget = null;
    }
    if (!enemy.step && enemy.wait <= 0) {
      if (miningTarget) {
        if (enemy.pathThinkTimer <= 0) {
          desiredStep = getMartianMiningStep(enemy, miningTarget);
          enemy.pathDirection = desiredStep;
          enemy.pathThinkTimer = 0.45;
        } else {
          desiredStep = enemy.pathDirection;
        }
      }
      if (!desiredStep) {
        const directions = [
          { x: 1, y: 0, facing: 'right' }, { x: -1, y: 0, facing: 'left' },
          { x: 0, y: 1, facing: 'down' }, { x: 0, y: -1, facing: 'up' },
        ].sort(() => Math.random() - 0.5);
        desiredStep = directions.find((direction) => !isMartianEnemyTileBlocked(
          wrapSurfaceCoordinate(enemy.x + direction.x * SURFACE_TILE),
          wrapSurfaceCoordinate(enemy.y + direction.y * SURFACE_TILE), enemy
        )) ?? null;
        if (!desiredStep) enemy.wait = 0.5;
      }
    }
  }

  if (!enemy.step && desiredStep) {
    if (enemy.facing !== desiredStep.facing) {
      enemy.facing = desiredStep.facing;
      enemy.turnUntil = game.time + SURFACE_TILE / SURFACE_WALK_SPEED;
      enemy.isMoving = false;
      enemy.animationFrame = 1;
      return;
    }
    if (game.time < (enemy.turnUntil ?? 0)) return;
    const toX = wrapSurfaceCoordinate(enemy.x + desiredStep.x * SURFACE_TILE);
    const toY = wrapSurfaceCoordinate(enemy.y + desiredStep.y * SURFACE_TILE);
    if (!isMartianEnemyTileBlocked(toX, toY, enemy)) {
      enemy.step = { toX, toY };
      enemy.turnUntil = 0;
    } else {
      enemy.pathDirection = null;
      enemy.pathThinkTimer = 0;
      enemy.wait = 0.05;
    }
  }

  const wasMoving = enemy.isMoving;
  enemy.isMoving = false;
  if (enemy.step) {
    const stepX = getSurfaceAxisDelta(enemy.step.toX, enemy.x);
    const stepY = getSurfaceAxisDelta(enemy.step.toY, enemy.y);
    const distanceToStep = Math.abs(stepX) + Math.abs(stepY);
    const moveMultiplier = enemy.type === 'lunatic'
      ? (enemy.runSpeedMultiplier ?? 2)
      : (isReloading ? 0.5 : 1);
    const move = Math.min(SURFACE_WALK_SPEED * moveMultiplier * dt, distanceToStep);
    enemy.x = wrapSurfaceCoordinate(enemy.x + Math.sign(stepX) * move);
    enemy.y = wrapSurfaceCoordinate(enemy.y + Math.sign(stepY) * move);
    enemy.isMoving = true;
    if (move >= distanceToStep - 1e-6) {
      enemy.x = enemy.step.toX;
      enemy.y = enemy.step.toY;
      enemy.step = null;
      enemy.wait = 0;
    }
  }
  if (enemy.isMoving) {
    if (!wasMoving) {
      enemy.animationFrame = 0;
      enemy.animationTimer = 0;
    } else {
      enemy.animationTimer += dt;
      while (enemy.animationTimer >= PLAYER_ANIMATION_FRAME_DURATION) {
        enemy.animationTimer -= PLAYER_ANIMATION_FRAME_DURATION;
        enemy.animationFrame = (enemy.animationFrame + 1) % 4;
      }
    }
  } else {
    enemy.animationFrame = 1;
    enemy.animationTimer = 0;
  }
}

function updateMartianEnemies(dt) {
  if (game.scene !== 'surface' || !game.surface || !(isMars(game.surface.planet) || isLuna(game.surface.planet))) return;
  const currentType = isLuna(game.surface.planet) ? 'lunatic' : 'martian';
  const activeRadius = CHUNK_SIZE * 6;
  const desiredEnemyCount = currentType === 'lunatic' ? 6 : 4;
  const facingDirections = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };
  const facingDirection = facingDirections[game.surface.facing] ?? facingDirections.down;
  const step = game.surface.step;
  const preferredDirection = step
    ? {
      x: Math.sign(getSurfaceAxisDelta(step.toX, game.surface.x)),
      y: Math.sign(getSurfaceAxisDelta(step.toY, game.surface.y)),
    }
    : facingDirection;
  if (game.martianEnemySpawnType !== currentType || !Number.isFinite(game.martianEnemySpawnTimer)) {
    game.martianEnemySpawnType = currentType;
    game.martianEnemySpawnTimer = 0.2 + Math.random() * 0.3;
  }
  game.martianEnemySpawnTimer -= dt;
  if (game.martianEnemySpawnTimer <= 0) {
    const nearbyEnemyCount = game.martianEnemies.filter((enemy) =>
      (enemy.type ?? 'martian') === currentType &&
      getSurfaceDistance(enemy.x, enemy.y, game.surface.x, game.surface.y) <= activeRadius
    ).length;
    if (nearbyEnemyCount < desiredEnemyCount) spawnMartianEnemy(null, currentType, preferredDirection);
    game.martianEnemySpawnTimer = 0.75 + Math.random() * 0.5;
  }
  for (let index = game.martianEnemies.length - 1; index >= 0; index -= 1) {
    const enemy = game.martianEnemies[index];
    if ((enemy.type ?? 'martian') !== currentType ||
        getSurfaceDistance(enemy.x, enemy.y, game.surface.x, game.surface.y) > activeRadius) {
      game.martianEnemies.splice(index, 1);
      continue;
    }
    updateMartianEnemy(enemy, dt);
  }
}

function updateEarthWanderer(dt) {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet)) return;
  const npc = game.earthWanderer || (game.earthWanderer = createEarthWanderer());
  if (npc.mode === 'flee' && game.time >= (npc.fleeUntil ?? 0)) {
    npc.mode = 'wander';
    npc.fleeUntil = 0;
    npc.wanderTime = 0;
    npc.wait = 0.2;
  }
  if (npc.talking) {
    const dx = getSurfaceAxisDelta(game.surface.x, npc.x);
    const dy = getSurfaceAxisDelta(game.surface.y, npc.y);
    npc.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    npc.step = null;
    npc.isMoving = false;
    npc.animationFrame = 1;
    npc.animationTimer = 0;
    return;
  }
  if (npc.mode === 'wander') {
    npc.wanderTime += dt;
    if (npc.wanderTime >= 60) startEarthWandererGreeting(npc);
  } else if (npc.mode === 'flee') {
    npc.fleeFromX = game.surface.x;
    npc.fleeFromY = game.surface.y;
  } else if (npc.mode === 'greeting' && npc.greetingPhase) {
    const target = npc.greetingTarget === 'merchant'
      ? getMerchantPosition()
      : npc.greetingTarget === 'repairer'
        ? getRepairerPosition()
        : getQuestGiverPosition();
    if (npc.greetingPhase === 'hello') {
      npc.facing = Math.abs(target.x - npc.x) > Math.abs(target.y - npc.y)
        ? (target.x < npc.x ? 'left' : 'right')
        : (target.y < npc.y ? 'up' : 'down');
      if (game.time >= npc.greetingUntil) {
        npc.greetingPhase = 'reply';
        npc.greetingUntil = game.time + 1.1;
      }
    } else if (npc.greetingPhase === 'reply' && game.time >= npc.greetingUntil) {
      npc.greetingPhase = 'pause';
      npc.greetingUntil = game.time + 0.6;
    } else if (npc.greetingPhase === 'pause' && game.time >= npc.greetingUntil) {
      npc.mode = 'wander';
      npc.greetingTarget = null;
      npc.greetingPhase = null;
      npc.route = [];
      npc.wanderTime = 0;
      npc.wait = 0.3 + Math.random() * 0.6;
    }
  }
  const wasAnimating = npc.isMoving;
  npc.isMoving = false;
  if (!npc.step) {
    npc.wait -= dt;
    if (npc.wait <= 0) {
      const directions = [
        { x: 1, y: 0, facing: 'right' },
        { x: -1, y: 0, facing: 'left' },
        { x: 0, y: 1, facing: 'down' },
        { x: 0, y: -1, facing: 'up' },
      ];
      if (npc.mode === 'flee') {
        directions.sort((first, second) => {
          const firstDistance = getSurfaceDistance(
            npc.x + first.x * SURFACE_TILE, npc.y + first.y * SURFACE_TILE,
            npc.fleeFromX, npc.fleeFromY
          );
          const secondDistance = getSurfaceDistance(
            npc.x + second.x * SURFACE_TILE, npc.y + second.y * SURFACE_TILE,
            npc.fleeFromX, npc.fleeFromY
          );
          return secondDistance - firstDistance || Math.random() - 0.5;
        });
      } else {
        directions.sort(() => Math.random() - 0.5);
      }
      if (npc.mode === 'greeting' && npc.route.length > 0) {
        const next = npc.route.shift();
        npc.facing = next.facing;
        npc.step = { toX: next.x, toY: next.y };
      }
      for (const direction of npc.mode === 'wander' || npc.mode === 'flee' ? directions : []) {
        const toX = wrapSurfaceCoordinate(npc.x + direction.x * SURFACE_TILE);
        const toY = wrapSurfaceCoordinate(npc.y + direction.y * SURFACE_TILE);
        if (isSurfaceTileBlocked(toX, toY, npc.x, npc.y)) continue;
        npc.facing = direction.facing;
        npc.step = { toX, toY };
        break;
      }
      if (!npc.step) npc.wait = 0.5 + Math.random() * 1.2;
      if (!npc.step && npc.mode === 'greeting' && !npc.greetingPhase) {
        npc.greetingPhase = 'hello';
        npc.greetingUntil = game.time + 1.1;
      }
    }
  }
  if (npc.step) {
    const dx = getSurfaceAxisDelta(npc.step.toX, npc.x);
    const dy = getSurfaceAxisDelta(npc.step.toY, npc.y);
    const distance = Math.hypot(dx, dy);
    const moveSpeed = npc.mode === 'flee' ? SURFACE_WALK_SPEED * 1.6 : SURFACE_WALK_SPEED * 0.42;
    const move = Math.min(moveSpeed * dt, distance);
    npc.x = wrapSurfaceCoordinate(npc.x + (dx / distance) * move);
    npc.y = wrapSurfaceCoordinate(npc.y + (dy / distance) * move);
    npc.isMoving = true;
    if (move >= distance - 1e-6) {
      npc.x = npc.step.toX;
      npc.y = npc.step.toY;
      npc.step = null;
      npc.wait = npc.mode === 'greeting' ? 0 : npc.mode === 'flee' ? 0.04 : 0.25 + Math.random() * 1.1;
    }
  }
  if (npc.isMoving) {
    if (!wasAnimating) {
      npc.animationFrame = 0;
      npc.animationTimer = 0;
    } else {
      npc.animationTimer += dt;
      while (npc.animationTimer >= PLAYER_ANIMATION_FRAME_DURATION) {
        npc.animationTimer -= PLAYER_ANIMATION_FRAME_DURATION;
        npc.animationFrame = (npc.animationFrame + 1) % 4;
      }
    }
  } else {
    npc.animationFrame = 1;
    npc.animationTimer = 0;
  }
}

function getHomeFloorCells() {
  const key = String(SURFACE_WORLD_SIZE);
  if (homeFloorCache?.key === key) return homeFloorCache.cells;
  const cells = new Set();
  const add = (cellX, cellY) => cells.add(`${cellX},${cellY}`);
  const ship = getSurfaceShipPosition();
  const shipCell = [Math.floor(ship.x / SURFACE_TILE), Math.floor(ship.y / SURFACE_TILE)];
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) add(shipCell[0] + dx, shipCell[1] + dy);
  }
  for (const npcKey of Object.keys(HOME_NPC_LAYOUT)) {
    const npc = getHomeNpcPosition(npcKey);
    const npcCell = [Math.floor(npc.x / SURFACE_TILE), Math.floor(npc.y / SURFACE_TILE)];
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) add(npcCell[0] + dx, npcCell[1] + dy);
    }
    // Camino: sale del NPC en horizontal hasta la columna de la nave y baja o sube hasta su plataforma.
    for (let cellX = Math.min(npcCell[0], shipCell[0]); cellX <= Math.max(npcCell[0], shipCell[0]); cellX += 1) {
      add(cellX, npcCell[1]);
    }
    for (let cellY = Math.min(npcCell[1], shipCell[1]); cellY <= Math.max(npcCell[1], shipCell[1]); cellY += 1) {
      add(shipCell[0], cellY);
    }
  }
  homeFloorCache = { key, cells, canvas: null };
  return cells;
}

// Devuelve true si la posición (en px) está sobre el suelo de mármol o junto a él.
function isNearHomeFloor(x, y) {
  const cells = getHomeFloorCells();
  const cellX = Math.floor(x / SURFACE_TILE);
  const cellY = Math.floor(y / SURFACE_TILE);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (cells.has(`${cellX + dx},${cellY + dy}`)) return true;
    }
  }
  return false;
}

function getHomeFloorCanvas() {
  const cells = getHomeFloorCells();
  if (homeFloorCache.canvas) return homeFloorCache.canvas;
  if (!(MARBLE_FLOOR_IMAGE.complete && MARBLE_FLOOR_IMAGE.naturalWidth > 0)) return null;
  const floor = document.createElement('canvas');
  floor.width = Math.ceil(game.width / SURFACE_TILE) * MARBLE_FLOOR_TILE;
  floor.height = Math.ceil(game.height / SURFACE_TILE) * MARBLE_FLOOR_TILE;
  const floorCtx = floor.getContext('2d');
  floorCtx.imageSmoothingEnabled = false;
  for (const cell of cells) {
    const [cellX, cellY] = cell.split(',').map(Number);
    floorCtx.drawImage(
      MARBLE_FLOOR_IMAGE,
      0, 0, MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE,
      cellX * MARBLE_FLOOR_TILE, cellY * MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE
    );
  }
  homeFloorCache.canvas = floor;
  return floor;
}

function getMarsFloorCells() {
  const key = String(SURFACE_WORLD_SIZE);
  if (marsFloorCache?.key === key) return marsFloorCache.cells;
  const cells = new Set();
  const columns = Math.ceil(SURFACE_WORLD_SIZE / SURFACE_TILE);
  const rows = columns;
  const add = (cellX, cellY) => {
    if (cellX >= 0 && cellY >= 0 && cellX < columns && cellY < rows) {
      cells.add(`${cellX},${cellY}`);
    }
  };

  // Plataforma amplia bajo la nave, igual que la zona de aterrizaje de la Tierra.
  const ship = getSurfaceShipPosition();
  const shipCellX = Math.floor(ship.x / SURFACE_TILE);
  const shipCellY = Math.floor(ship.y / SURFACE_TILE);
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) add(shipCellX + dx, shipCellY + dy);
  }

  // Plataformas de 3×3 distribuidas por Marte; las posiciones se adaptan al tamaño del mapa.
  const platformCenters = [
    [0.16, 0.2], [0.5, 0.16], [0.84, 0.22],
    [0.22, 0.52], [0.78, 0.5],
    [0.16, 0.82], [0.5, 0.84], [0.84, 0.8],
  ];
  for (const [ratioX, ratioY] of platformCenters) {
    const centerX = Math.round((columns - 1) * ratioX);
    const centerY = Math.round((rows - 1) * ratioY);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) add(centerX + dx, centerY + dy);
    }
  }

  marsFloorCache = { key, cells, canvas: null };
  return cells;
}

function getMarsFloorCanvas() {
  const cells = getMarsFloorCells();
  if (marsFloorCache.canvas) return marsFloorCache.canvas;
  if (!(MARBLE_FLOOR_IMAGE.complete && MARBLE_FLOOR_IMAGE.naturalWidth > 0)) return null;
  const floor = document.createElement('canvas');
  floor.width = Math.ceil(game.width / SURFACE_TILE) * MARBLE_FLOOR_TILE;
  floor.height = Math.ceil(game.height / SURFACE_TILE) * MARBLE_FLOOR_TILE;
  const floorCtx = floor.getContext('2d');
  floorCtx.imageSmoothingEnabled = false;
  for (const cell of cells) {
    const [cellX, cellY] = cell.split(',').map(Number);
    floorCtx.drawImage(
      MARBLE_FLOOR_IMAGE,
      0, 0, MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE,
      cellX * MARBLE_FLOOR_TILE, cellY * MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE
    );
  }
  marsFloorCache.canvas = floor;
  return floor;
}

function getMarsMountainChunk(chunkX, chunkY) {
  chunkX = wrapCell(chunkX, SURFACE_CHUNK_COUNT);
  chunkY = wrapCell(chunkY, SURFACE_CHUNK_COUNT);
  const key = `${chunkX},${chunkY}`;
  if (marsMountainChunkCache.has(key)) return marsMountainChunkCache.get(key);

  // Semilla estable por chunk: la montaña no cambia al salir y volver a la zona.
  let seed = (chunkX * 374761393 + chunkY * 668265263 + 0x4d415253) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const mountains = [];
  const mountainRolls = random() < 0.5 ? 2 : 1;
  for (let mountainRoll = 0; mountainRoll < mountainRolls; mountainRoll += 1) {
  if (random() >= 0.84) continue;
    const chunkStartX = chunkX * CHUNK_SIZE;
    const chunkStartY = chunkY * CHUNK_SIZE;
    const minCellX = Math.ceil(chunkStartX / SURFACE_TILE) + 1;
    const minCellY = Math.ceil(chunkStartY / SURFACE_TILE) + 1;
    const maxClusterX = Math.floor((chunkStartX + CHUNK_SIZE - SURFACE_TILE) / SURFACE_TILE);
    const maxClusterY = Math.floor((chunkStartY + CHUNK_SIZE - SURFACE_TILE) / SURFACE_TILE);
    const width = 12;
    const height = 12;
    if (maxClusterX - minCellX >= width && maxClusterY - minCellY >= height) {
      const cellX = minCellX + Math.floor(random() * (maxClusterX - minCellX - width + 2));
      const cellY = minCellY + Math.floor(random() * (maxClusterY - minCellY - height + 2));
      const ship = getSurfaceShipPosition();
      const centerX = (cellX + width / 2) * SURFACE_TILE;
      const centerY = (cellY + height / 2) * SURFACE_TILE;
      if (getSurfaceDistance(centerX, centerY, ship.x, ship.y) > SURFACE_TILE * 11) {
        const pieces = [];
        const silhouettes = [
          ['00100', '01110', '01110', '11111', '11111'], // Pico central sobre base ancha
          ['01110', '11111', '11111', '11111', '11111'], // Meseta amplia
          ['10000', '11000', '11100', '11110', '11111'], // Cresta inclinada ascendente
          ['00001', '00011', '00111', '01111', '11111'], // Cresta inclinada opuesta
          ['01010', '11111', '11111', '11111', '11111'], // Dos cumbres sobre base ancha
          ['00100', '01110', '11110', '11111', '11111'], // Ladera irregular
        ];
        const silhouette = silhouettes[Math.floor(random() * silhouettes.length)];
        // Los rectángulos se pisan para formar una silueta continua, con contornos variados.
        for (let row = 0; row < 5; row += 1) {
          for (let col = 0; col < 5; col += 1) {
            if (silhouette[row][col] !== '1') continue;
            pieces.push({
              x: cellX + col * 2,
              y: cellY + row * 2,
              width: 2 + Math.floor(random() * 3),
              height: 2 + Math.floor(random() * 3),
              row,
              tone: 1 - row * 0.055 + (Math.floor(random() * 3) - 1) * 0.025,
            });
          }
        }
        mountains.push({
          x: cellX,
          y: cellY,
          width,
          height,
          pieces,
        });
      }
    }
  }
  if (marsMountainChunkCache.size > 400) marsMountainChunkCache.clear();
  marsMountainChunkCache.set(key, mountains);
  return mountains;
}

function getVisibleMarsMountains(centerX, centerY, halfWidth, halfHeight) {
  const minChunkX = Math.floor((centerX - halfWidth) / CHUNK_SIZE);
  const maxChunkX = Math.floor((centerX + halfWidth) / CHUNK_SIZE);
  const minChunkY = Math.floor((centerY - halfHeight) / CHUNK_SIZE);
  const maxChunkY = Math.floor((centerY + halfHeight) / CHUNK_SIZE);
  const visited = new Set();
  const mountains = [];
  for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY += 1) {
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
      const key = `${wrapCell(chunkX, SURFACE_CHUNK_COUNT)},${wrapCell(chunkY, SURFACE_CHUNK_COUNT)}`;
      if (visited.has(key)) continue;
      visited.add(key);
      mountains.push(...getMarsMountainChunk(chunkX, chunkY));
    }
  }
  return mountains;
}

function getMarsGroundSpotChunk(chunkX, chunkY) {
  chunkX = wrapCell(chunkX, SURFACE_CHUNK_COUNT);
  chunkY = wrapCell(chunkY, SURFACE_CHUNK_COUNT);
  const key = `${chunkX},${chunkY}`;
  if (marsGroundSpotCache.has(key)) return marsGroundSpotCache.get(key);
  let seed = (chunkX * 2246822519 + chunkY * 3266489917 + 0x4d415253) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const spots = [];
  const baseX = chunkX * CHUNK_SIZE;
  const baseY = chunkY * CHUNK_SIZE;
  for (let cluster = 0; cluster < 20; cluster += 1) {
    const centerX = baseX + random() * CHUNK_SIZE;
    const centerY = baseY + random() * CHUNK_SIZE;
    const fleckCount = 3 + Math.floor(random() * 5);
    for (let fleck = 0; fleck < fleckCount; fleck += 1) {
      const width = 2 + random() * 4;
      const height = 1.5 + random() * 3;
      spots.push({
        x: centerX + (random() - 0.5) * 15,
        y: centerY + (random() - 0.5) * 11,
        width,
        height,
        alpha: 0.13 + random() * 0.1,
      });
    }
  }
  if (marsGroundSpotCache.size > 400) marsGroundSpotCache.clear();
  marsGroundSpotCache.set(key, spots);
  return spots;
}

function drawMarsGroundSpots(centerX, centerY, halfWidth, halfHeight) {
  const minChunkX = Math.floor((centerX - halfWidth) / CHUNK_SIZE);
  const maxChunkX = Math.floor((centerX + halfWidth) / CHUNK_SIZE);
  const minChunkY = Math.floor((centerY - halfHeight) / CHUNK_SIZE);
  const maxChunkY = Math.floor((centerY + halfHeight) / CHUNK_SIZE);
  const visited = new Set();
  for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY += 1) {
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
      const key = `${wrapCell(chunkX, SURFACE_CHUNK_COUNT)},${wrapCell(chunkY, SURFACE_CHUNK_COUNT)}`;
      if (visited.has(key)) continue;
      visited.add(key);
      for (const spot of getMarsGroundSpotChunk(chunkX, chunkY)) {
        const point = getSurfaceRenderPoint(spot.x, spot.y);
        if (Math.abs(point.x - centerX) > halfWidth || Math.abs(point.y - centerY) > halfHeight) continue;
        ctx.fillStyle = `rgba(112, 55, 43, ${spot.alpha})`;
        ctx.fillRect(point.x - spot.width / 2, point.y - spot.height / 2, spot.width, spot.height);
      }
    }
  }
}

function getLunaCraterChunk(chunkX, chunkY) {
  chunkX = wrapCell(chunkX, SURFACE_CHUNK_COUNT);
  chunkY = wrapCell(chunkY, SURFACE_CHUNK_COUNT);
  const key = `${chunkX},${chunkY}`;
  if (lunaCraterChunkCache.has(key)) return lunaCraterChunkCache.get(key);
  let seed = (chunkX * 2246822519 + chunkY * 3266489917 + 0x4c554e41) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const craters = [];
  const baseX = chunkX * CHUNK_SIZE;
  const baseY = chunkY * CHUNK_SIZE;
  for (let index = 0; index < 7; index += 1) {
    const radius = SURFACE_TILE * (1.5 + random() * 2.5);
    craters.push({
      x: baseX + radius + random() * (CHUNK_SIZE - radius * 2),
      y: baseY + radius + random() * (CHUNK_SIZE - radius * 2),
      radius,
      shade: 0.13 + random() * 0.09,
      rim: 0.08 + random() * 0.06,
    });
  }
  if (lunaCraterChunkCache.size > 400) lunaCraterChunkCache.clear();
  lunaCraterChunkCache.set(key, craters);
  return craters;
}

function drawLunaCraters(centerX, centerY, halfWidth, halfHeight) {
  const minChunkX = Math.floor((centerX - halfWidth) / CHUNK_SIZE);
  const maxChunkX = Math.floor((centerX + halfWidth) / CHUNK_SIZE);
  const minChunkY = Math.floor((centerY - halfHeight) / CHUNK_SIZE);
  const maxChunkY = Math.floor((centerY + halfHeight) / CHUNK_SIZE);
  const visited = new Set();
  for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY += 1) {
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
      const key = `${wrapCell(chunkX, SURFACE_CHUNK_COUNT)},${wrapCell(chunkY, SURFACE_CHUNK_COUNT)}`;
      if (visited.has(key)) continue;
      visited.add(key);
      for (const crater of getLunaCraterChunk(chunkX, chunkY)) {
        const point = getSurfaceRenderPoint(crater.x, crater.y);
        if (Math.abs(point.x - centerX) > halfWidth + crater.radius || Math.abs(point.y - centerY) > halfHeight + crater.radius) continue;
        const tile = SURFACE_TILE;
        const minX = Math.floor((point.x - crater.radius) / tile);
        const maxX = Math.ceil((point.x + crater.radius) / tile);
        const minY = Math.floor((point.y - crater.radius) / tile);
        const maxY = Math.ceil((point.y + crater.radius) / tile);
        for (let cellY = minY; cellY <= maxY; cellY += 1) {
          for (let cellX = minX; cellX <= maxX; cellX += 1) {
            const dx = (cellX + 0.5) * tile - point.x;
            const dy = (cellY + 0.5) * tile - point.y;
            const distance = Math.hypot(dx, dy) / crater.radius;
            if (distance > 1) continue;
            ctx.fillStyle = distance > 0.72
              ? `rgba(45, 45, 43, ${crater.rim})`
              : `rgba(28, 29, 31, ${crater.shade})`;
            ctx.fillRect(cellX * tile, cellY * tile, tile, tile);
          }
        }
      }
    }
  }
}

function getLunaCraterSpeedMultiplier(x, y) {
  const chunkX = Math.floor(wrapSurfaceCoordinate(x) / CHUNK_SIZE);
  const chunkY = Math.floor(wrapSurfaceCoordinate(y) / CHUNK_SIZE);
  let slowestMultiplier = 1;
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (const crater of getLunaCraterChunk(chunkX + offsetX, chunkY + offsetY)) {
        const distance = Math.hypot(
          getSurfaceAxisDelta(crater.x, x),
          getSurfaceAxisDelta(crater.y, y)
        ) / crater.radius;
        if (distance >= 1) continue;
        const interior = distance <= 0.72;
        const darkness = crater.shade * (interior ? 1 : 0.45);
        // El centro, más oscuro, frena hasta un 45%; los bordes aplican menos.
        const slowdown = Math.min(0.45, (darkness / 0.22) * 0.45);
        slowestMultiplier = Math.min(slowestMultiplier, 1 - slowdown);
      }
    }
  }
  return slowestMultiplier;
}

function getMarsMountainTile(planet, layer, tone = 1) {
  const key = `${planet.color}|${layer}|${tone.toFixed(3)}`;
  if (marsMountainTileCache.has(key)) return marsMountainTileCache.get(key);
  const groundLayer = getPlanetGroundLayer(planet);
  if (!groundLayer) return null;
  const tile = document.createElement('canvas');
  tile.width = SURFACE_TILE;
  tile.height = SURFACE_TILE;
  const tileCtx = tile.getContext('2d');
  tileCtx.imageSmoothingEnabled = false;
  tileCtx.filter = layer === 'peak'
    ? `hue-rotate(10deg) brightness(${0.7 * tone})`
    : `hue-rotate(5deg) brightness(${0.85 * tone})`;
  tileCtx.drawImage(groundLayer, 0, 0, SURFACE_TILE, SURFACE_TILE);
  marsMountainTileCache.set(key, tile);
  return tile;
}

function isMarsMountainCellBlocked(x, y) {
  const columnCount = SURFACE_WORLD_SIZE / SURFACE_TILE;
  const cellX = wrapCell(Math.floor(wrapSurfaceCoordinate(x) / SURFACE_TILE), columnCount);
  const cellY = wrapCell(Math.floor(wrapSurfaceCoordinate(y) / SURFACE_TILE), columnCount);
  const chunkX = Math.floor((cellX * SURFACE_TILE) / CHUNK_SIZE);
  const chunkY = Math.floor((cellY * SURFACE_TILE) / CHUNK_SIZE);
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      for (const mountain of getMarsMountainChunk(chunkX + dx, chunkY + dy)) {
        if (mountain.pieces.some((piece) =>
          cellX >= piece.x && cellX < piece.x + piece.width &&
          cellY >= piece.y && cellY < piece.y + piece.height
        )) return true;
      }
    }
  }
  return false;
}

function drawMarsMountains(planet, centerX, centerY, halfWidth, halfHeight) {
  const mountains = getVisibleMarsMountains(centerX, centerY, halfWidth, halfHeight);
  const patterns = new Map();
  const getPattern = (layer, tone) => {
    const key = `${layer}|${tone.toFixed(3)}`;
    if (!patterns.has(key)) {
      const tile = getMarsMountainTile(planet, layer, tone);
      patterns.set(key, tile ? ctx.createPattern(tile, 'repeat') : null);
    }
    return patterns.get(key);
  };
  const drawRect = (pattern, x, y, width, height) => {
    if (!pattern) return;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = pattern;
    ctx.fill();
  };
  for (const mountain of mountains) {
    // Cada bloque conserva sus bordes cuadrados; su patrón continuo evita costuras entre tiles.
    for (const piece of mountain.pieces) {
      const point = getSurfaceRenderPoint(
        (piece.x + piece.width / 2) * SURFACE_TILE,
        (piece.y + piece.height / 2) * SURFACE_TILE
      );
      const rectWidth = piece.width * SURFACE_TILE;
      const rectHeight = piece.height * SURFACE_TILE;
      if (Math.abs(point.x - centerX) > halfWidth + rectWidth / 2 ||
          Math.abs(point.y - centerY) > halfHeight + rectHeight / 2) continue;
      // Medio píxel de solape tapa posibles huecos de rasterizado sin alterar la forma cuadrada.
      const rectX = point.x - rectWidth / 2 - 0.5;
      const rectY = point.y - rectHeight / 2 - 0.5;
      const filledWidth = rectWidth + 1;
      const filledHeight = rectHeight + 1;
      const tone = piece.tone ?? 1;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      drawRect(getPattern('shadow', tone), rectX, rectY, filledWidth, filledHeight);
      // La cima oscura deja visible la capa menos oscura debajo, dentro del mismo cuadrado.
      drawRect(getPattern('peak', tone), rectX, rectY, filledWidth, filledHeight * 0.72);
      ctx.restore();
    }

  }
}

// La nave se alinea a la cuadrícula para que sus casillas coincidan con lo que se dibuja.
function getSurfaceShipPosition() {
  return {
    x: snapSurfaceCoordinate(game.surface?.shipX ?? SURFACE_WORLD_SIZE * 0.58125),
    y: snapSurfaceCoordinate(game.surface?.shipY ?? SURFACE_WORLD_SIZE * 0.6),
  };
}

function drawSurfaceFloorCells(cells) {
  if (!(MARBLE_FLOOR_IMAGE.complete && MARBLE_FLOOR_IMAGE.naturalWidth > 0)) return;
  const halfWidth = game.width / playerZoom / 2 + SURFACE_TILE;
  const halfHeight = game.height / playerZoom / 2 + SURFACE_TILE;
  for (const cell of cells) {
    const [cellX, cellY] = cell.split(',').map(Number);
    const centerX = (cellX + 0.5) * SURFACE_TILE;
    const centerY = (cellY + 0.5) * SURFACE_TILE;
    const x = game.surface.x + getSurfaceAxisDelta(centerX, game.surface.x);
    const y = game.surface.y + getSurfaceAxisDelta(centerY, game.surface.y);
    if (Math.abs(x - game.surface.x) > halfWidth || Math.abs(y - game.surface.y) > halfHeight) continue;
    ctx.drawImage(
      MARBLE_FLOOR_IMAGE,
      0, 0, MARBLE_FLOOR_TILE, MARBLE_FLOOR_TILE,
      x - SURFACE_TILE / 2, y - SURFACE_TILE / 2, SURFACE_TILE, SURFACE_TILE
    );
  }
}

function isShipTile(x, y) {
  const ship = getSurfaceShipPosition();
  const cellX = Math.floor(wrapSurfaceCoordinate(x) / SURFACE_TILE);
  const cellY = Math.floor(wrapSurfaceCoordinate(y) / SURFACE_TILE);
  const columnCount = SURFACE_WORLD_SIZE / SURFACE_TILE;
  return SHIP_TILE_OFFSETS.some(([ox, oy]) =>
    wrapCell(Math.floor(ship.x / SURFACE_TILE) + ox, columnCount) === cellX &&
    wrapCell(Math.floor(ship.y / SURFACE_TILE) + oy, columnCount) === cellY
  );
}

function wrapCell(cell, count) {
  return ((cell % count) + count) % count;
}

function isSurfaceTileBlocked(x, y, fromX = null, fromY = null) {
  x = wrapSurfaceCoordinate(x);
  y = wrapSurfaceCoordinate(y);
  if (
    isHomeworld(game.surface?.planet) &&
    !game.player.hoverboardEquipped &&
    !isWithinHomeLand(x, y)
  ) return true;
  const cellX = Math.floor(x / SURFACE_TILE);
  const cellY = Math.floor(y / SURFACE_TILE);
  const occupies = (item) =>
    wrapCell(Math.floor(item.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellX &&
    wrapCell(Math.floor(item.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) === cellY;
  // Si el jugador ya está sobre la nave (partida antigua), puede salir sin quedar atrapado.
  const insideShip = fromX !== null && isShipTile(fromX, fromY);
  if (!insideShip && isShipTile(x, y)) return true;
  if (occupies(game.surface)) return true;
  if (getSurfacePickupCandidates(x, y, SURFACE_TILE, SURFACE_TILE).some(occupies)) return true;
  if (isMars(game.surface.planet) && isMarsMountainCellBlocked(x, y)) return true;
  if (isHomeworld(game.surface.planet)) {
    const wandererOccupies = game.earthWanderer && occupies(game.earthWanderer);
    return occupies(getMerchantPosition()) || occupies(getRepairerPosition()) ||
      occupies(getQuestGiverPosition()) || occupies(getHomeChestPosition()) ||
      occupies(getHomeWorkbenchPosition()) || wandererOccupies;
  }
  return false;
}

// Centra un valor en la casilla (cuadrícula de SURFACE_TILE) más cercana dentro de [min, max].
function snapToSurfaceGrid(value, min, max) {
  let center = Math.round((value - SURFACE_TILE / 2) / SURFACE_TILE) * SURFACE_TILE + SURFACE_TILE / 2;
  while (center < min) center += SURFACE_TILE;
  while (center > max) center -= SURFACE_TILE;
  return center;
}

function snapSurfacePoint(x, y) {
  return {
    x: snapSurfaceCoordinate(x),
    y: snapSurfaceCoordinate(y),
  };
}

function wrapSurfaceCoordinate(value) {
  return ((value % SURFACE_WORLD_SIZE) + SURFACE_WORLD_SIZE) % SURFACE_WORLD_SIZE;
}

function getSurfaceAxisDelta(target, origin) {
  let delta = wrapSurfaceCoordinate(target) - wrapSurfaceCoordinate(origin);
  if (delta > SURFACE_WORLD_SIZE / 2) delta -= SURFACE_WORLD_SIZE;
  if (delta < -SURFACE_WORLD_SIZE / 2) delta += SURFACE_WORLD_SIZE;
  return delta;
}

function getSurfaceDistance(x1, y1, x2, y2) {
  return Math.hypot(getSurfaceAxisDelta(x1, x2), getSurfaceAxisDelta(y1, y2));
}

let surfacePickupIndexSource = null;
let surfacePickupChunkIndex = new Map();

function getSurfacePickupCandidates(centerX, centerY, halfWidth, halfHeight) {
  const pickups = game.surface?.pickups ?? [];
  if (surfacePickupIndexSource !== pickups) {
    surfacePickupIndexSource = pickups;
    surfacePickupChunkIndex = new Map();
    for (const pickup of pickups) {
      const chunkX = wrapCell(Math.floor(pickup.x / CHUNK_SIZE), SURFACE_CHUNK_COUNT);
      const chunkY = wrapCell(Math.floor(pickup.y / CHUNK_SIZE), SURFACE_CHUNK_COUNT);
      const key = `${chunkX},${chunkY}`;
      if (!surfacePickupChunkIndex.has(key)) surfacePickupChunkIndex.set(key, []);
      surfacePickupChunkIndex.get(key).push(pickup);
    }
  }

  const minChunkX = Math.floor((centerX - halfWidth) / CHUNK_SIZE);
  const maxChunkX = Math.floor((centerX + halfWidth) / CHUNK_SIZE);
  const minChunkY = Math.floor((centerY - halfHeight) / CHUNK_SIZE);
  const maxChunkY = Math.floor((centerY + halfHeight) / CHUNK_SIZE);
  const visitedChunks = new Set();
  const candidates = [];
  for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY += 1) {
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
      const key = `${wrapCell(chunkX, SURFACE_CHUNK_COUNT)},${wrapCell(chunkY, SURFACE_CHUNK_COUNT)}`;
      if (visitedChunks.has(key)) continue;
      visitedChunks.add(key);
      const chunk = surfacePickupChunkIndex.get(key);
      if (chunk) candidates.push(...chunk);
    }
  }
  return candidates.filter((pickup) =>
    Math.abs(getSurfaceAxisDelta(pickup.x, centerX)) <= halfWidth &&
    Math.abs(getSurfaceAxisDelta(pickup.y, centerY)) <= halfHeight
  );
}

function getSurfaceRenderPoint(x, y) {
  return {
    x: game.surface.x + getSurfaceAxisDelta(x, game.surface.x),
    y: game.surface.y + getSurfaceAxisDelta(y, game.surface.y),
  };
}

function snapSurfaceCoordinate(value) {
  const wrapped = wrapSurfaceCoordinate(value);
  const snapped = Math.round((wrapped - SURFACE_TILE / 2) / SURFACE_TILE) * SURFACE_TILE + SURFACE_TILE / 2;
  return wrapSurfaceCoordinate(snapped);
}

// Matiz (0-360) de la ropa del jugador en el sprite; los NPC la reemplazan por otro matiz.
const PLAYER_CLOTHES_HUE = 120;
const NPC_HUES = { merchant: 200, repairer: 5, questGiver: 40 };
const npcSpriteCache = new Map();
const playerPoseSpriteCache = new Map();
const hoverboardSpriteCache = new Map();

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Devuelve un canvas 16x16 con el cuadro del jugador, con la ropa cambiada al matiz indicado.
function ensureClothesMaskFilter() {
  if (document.getElementById('clothesMaskFilter')) return;
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<filter id="clothesMaskFilter" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -8 8 -8 0 -2"/>
  </filter>`;
  document.body.append(svg);
}

function buildMaskedHueFrame(frameX, frameY, hue, source = PLAYER_SPRITE) {
  try {
    ensureClothesMaskFilter();
    const make = () => {
      const c = document.createElement('canvas');
      c.width = 16;
      c.height = 16;
      const cx = c.getContext('2d');
      cx.imageSmoothingEnabled = false;
      return [c, cx];
    };
    const [base, baseCtx] = make();
    baseCtx.drawImage(source, frameX, frameY, 16, 16, 0, 0, 16, 16);
    const [tinted, tintedCtx] = make();
    tintedCtx.filter = `hue-rotate(${hue - PLAYER_CLOTHES_HUE}deg)`;
    tintedCtx.drawImage(source, frameX, frameY, 16, 16, 0, 0, 16, 16);
    tintedCtx.filter = 'none';
    const [mask, maskCtx] = make();
    maskCtx.filter = 'url(#clothesMaskFilter)';
    maskCtx.drawImage(source, frameX, frameY, 16, 16, 0, 0, 16, 16);
    maskCtx.filter = 'none';
    tintedCtx.globalCompositeOperation = 'destination-in';
    tintedCtx.drawImage(mask, 0, 0);
    baseCtx.drawImage(tinted, 0, 0);
    return base;
  } catch (error) {
    return null;
  }
}

function getPlayerInventoryFrame(source, hue) {
  if (!(source.complete && source.naturalWidth > 0)) return null;
  const key = `${source.src},${hue}`;
  if (playerPoseSpriteCache.has(key)) return playerPoseSpriteCache.get(key);
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = 16;
  frameCanvas.height = 16;
  const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(source, 0, 0, 16, 16);
  let image;
  try {
    image = frameCtx.getImageData(0, 0, 16, 16);
  } catch {
    const fallback = buildMaskedHueFrame(0, 0, hue, source);
    playerPoseSpriteCache.set(key, fallback);
    return fallback;
  }
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(data[index], data[index + 1], data[index + 2]);
    let diff = Math.abs(h - PLAYER_CLOTHES_HUE);
    if (diff > 180) diff = 360 - diff;
    if (s > 0.35 && diff <= 35) {
      const [r, g, b] = hslToRgb((h - PLAYER_CLOTHES_HUE + hue + 360) % 360, s, l);
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
    }
  }
  frameCtx.putImageData(image, 0, 0);
  if (playerPoseSpriteCache.size > 40) playerPoseSpriteCache.clear();
  playerPoseSpriteCache.set(key, frameCanvas);
  return frameCanvas;
}

function getNpcFrame(frameX, frameY, hue, source = PLAYER_SPRITE) {
  const key = `${source.src},${frameX},${frameY},${hue}`;
  if (npcSpriteCache.has(key)) return npcSpriteCache.get(key);
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = 16;
  frameCanvas.height = 16;
  const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(source, frameX, frameY, 16, 16, 0, 0, 16, 16);
  let image;
  try {
    image = frameCtx.getImageData(0, 0, 16, 16);
  } catch (error) {
    // Abierto como file://, el navegador bloquea leer píxeles: se recolorea solo el verde
    // con una máscara (filtro SVG) y hue-rotate, sin tocar la piel ni el resto.
    const fallback = buildMaskedHueFrame(frameX, frameY, hue, source);
    npcSpriteCache.set(key, fallback);
    return fallback;
  }
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    let diff = Math.abs(h - PLAYER_CLOTHES_HUE);
    if (diff > 180) diff = 360 - diff;
    if (s > 0.35 && diff <= 35) {
      const [r, g, b] = hslToRgb((h - PLAYER_CLOTHES_HUE + hue + 360) % 360, s, l);
      data[i] = r; data[i + 1] = g; data[i + 2] = b;
    }
  }
  frameCtx.putImageData(image, 0, 0);
  if (npcSpriteCache.size > 400) npcSpriteCache.clear();
  npcSpriteCache.set(key, frameCanvas);
  return frameCanvas;
}

function getHoverboardFrame(source, frameIndex, hue) {
  if (!(source.complete && source.naturalWidth >= 48)) return null;
  const key = `${source.src},${frameIndex},${hue}`;
  if (hoverboardSpriteCache.has(key)) return hoverboardSpriteCache.get(key);
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = 48;
  frameCanvas.height = 32;
  const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
  frameCtx.imageSmoothingEnabled = false;
  const sourceX = source.naturalWidth >= 96 ? frameIndex * 48 : 0;
  frameCtx.drawImage(source, sourceX, 0, 48, 32, 0, 0, 48, 32);
  try {
    const image = frameCtx.getImageData(0, 0, 48, 32);
    const data = image.data;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] === 0) continue;
      const [sourceHue, saturation, lightness] = rgbToHsl(data[index], data[index + 1], data[index + 2]);
      let hueDifference = Math.abs(sourceHue - PLAYER_CLOTHES_HUE);
      if (hueDifference > 180) hueDifference = 360 - hueDifference;
      if (saturation > 0.35 && hueDifference <= 35) {
        const [red, green, blue] = hslToRgb(
          (sourceHue - PLAYER_CLOTHES_HUE + hue + 360) % 360,
          saturation,
          lightness
        );
        data[index] = red;
        data[index + 1] = green;
        data[index + 2] = blue;
      }
    }
    frameCtx.putImageData(image, 0, 0);
  } catch {
    // file:// puede bloquear la lectura de píxeles; se aplica la máscara verde como en los sprites del jugador.
    try {
      ensureClothesMaskFilter();
      const makeLayer = () => {
        const layer = document.createElement('canvas');
        layer.width = 48;
        layer.height = 32;
        return [layer, layer.getContext('2d')];
      };
      const [tinted, tintedCtx] = makeLayer();
      tintedCtx.imageSmoothingEnabled = false;
      tintedCtx.filter = `hue-rotate(${hue - PLAYER_CLOTHES_HUE}deg)`;
      tintedCtx.drawImage(source, sourceX, 0, 48, 32, 0, 0, 48, 32);
      tintedCtx.filter = 'none';
      const [mask, maskCtx] = makeLayer();
      maskCtx.imageSmoothingEnabled = false;
      maskCtx.filter = 'url(#clothesMaskFilter)';
      maskCtx.drawImage(source, sourceX, 0, 48, 32, 0, 0, 48, 32);
      maskCtx.filter = 'none';
      tintedCtx.globalCompositeOperation = 'destination-in';
      tintedCtx.drawImage(mask, 0, 0);
      frameCtx.drawImage(tinted, 0, 0);
    } catch {
      // El sprite original sigue siendo visible si el navegador bloquea el filtro SVG.
    }
  }
  if (hoverboardSpriteCache.size > 120) hoverboardSpriteCache.clear();
  hoverboardSpriteCache.set(key, frameCanvas);
  return frameCanvas;
}

function drawNpcSprite(x, y, hue, facingOverride = null, animationFrame = 1, flashWhite = false, source = PLAYER_SPRITE) {
  if (!(source.complete && source.naturalWidth > 0)) return false;
  const point = getSurfaceRenderPoint(x, y);
  x = point.x;
  y = point.y;
  const dx = getSurfaceAxisDelta(game.surface.x, x);
  const dy = getSurfaceAxisDelta(game.surface.y, y);
  const facing = facingOverride || (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
  const frame = PLAYER_FACING_FRAMES[facing];
  const frameX = animationFrame * 32 + frame.x;
  const canvasFrame = getNpcFrame(frameX, frame.y, hue, source);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (frame.flip) ctx.scale(-1, 1);
  ctx.filter = flashWhite ? 'brightness(0) invert(1)' : 'none';
  if (canvasFrame) {
    ctx.drawImage(canvasFrame, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
  } else {
    ctx.filter = flashWhite ? 'brightness(0) invert(1)' : `hue-rotate(${hue - PLAYER_CLOTHES_HUE}deg)`;
    ctx.drawImage(source, frameX, frame.y, 16, 16, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
  }
  ctx.restore();
  return true;
}
// Deja margen dentro de cada tile para que los pies no toquen el borde inferior.
const PLAYER_SPRITE_SIZE = 24;
const SOLAR_SYSTEM_PLANETS = [
  { name: 'Mercurion', color: '#a8a49b', gas: false, radius: 5, orbitRadius: 85, angle: 2.5 },
  { name: 'Venara', color: '#e9a95b', gas: false, radius: 8, orbitRadius: 155, angle: 4.1 },
  { name: 'Tierra', color: '#3ed5ff', gas: false, radius: 11, orbitRadius: 250, angle: 0 },
  { name: 'Martis', color: '#ff765b', gas: false, radius: 8, orbitRadius: 350, angle: 2.7 },
  { name: 'Jupiron', color: '#edc88c', gas: true, radius: 19, orbitRadius: 460, angle: 5.1 },
  { name: 'Saturnia', color: '#e7d5a7', gas: true, radius: 16, orbitRadius: 570, angle: 1.4, ring: true },
  { name: 'Uranix', color: '#83d8df', gas: true, radius: 13, orbitRadius: 680, angle: 3.8 },
  { name: 'Neptaris', color: '#6584f5', gas: true, radius: 13, orbitRadius: 790, angle: 0.7 },
  // Satélite: orbita alrededor de su planeta (orbitRadius en unidades del mundo, sin ORBIT_DISTANCE_SCALE).
  { name: 'Luna', color: '#b9b8b2', gas: false, radius: 4, orbitRadius: 3000, orbitSpeed: 0.005, angle: 1.2, verticalTilt: 1, orbitRotation: 0, parentName: 'Tierra' },
];

const farStarCells = new Map();
const midStarCells = new Map();
const nearStarCells = new Map();

const game = {
  width: canvas.width,
  height: canvas.height,
  lastTime: 0,
  time: 0,
  keys: {},
  movementKeyOrder: {},
  movementKeySequence: 0,
  movementKeyLastDownAt: {},
  hostileDrones: [],
  martianEnemies: [],
  martianEnemySpawnTimer: null,
  martianEnemySequence: 1,
  earthWanderer: null,
  martianNpcs: null,
  martianConversation: null,
  martianChatTimer: 0,
  hostileProjectiles: [],
  playerProjectiles: [],
  surfaceProjectiles: [],
  emergencyReturn: false,
  emergencyCapsule: null,
  emergencyService: null,
  hostileSpawnTimer: 20,
  pointer: {
    isDown: false,
    downAt: 0,
    x: 0,
    y: 0,
    clickTarget: null,
    moveTarget: null,
    followPlanet: null,
  },
  player: {
    x: 170,
    y: 0,
    radius: 12,
    speed: 210,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    propulsionDistance: 0,
    solarCharge: 0,
    hoverboardEquipped: false,
    surfaceHealth: 3,
    surfaceDamageInvulnerableUntil: 0,
    surfaceDamageFlashUntil: 0,
    surfaceEquipment: [null, null, null],
    regolitoGunAmmo: REGOLITO_GUN_MAGAZINE_SIZE,
    regolitoGunHalfCredit: 0,
    regolitoGunReloadUntil: 0,
    regolitoGunReloadAmmo: 0,
    regolitoGunReloadStartedAt: 0,
    weaponCooldown: 0,
    propulsionBoost: null,
    propulsionAbilityReadyAt: 0,
    centerHoming: null,
    centerAbilityReadyAt: 0,
    credits: 150,
    hue: 120,
    shipParts: {
      center: 'center-classic',
      propulsor: 'thruster-electric',
      leftWing: null,
      rightWing: null,
      tip: null,
    },
    shipPartHealth: {},
    inventory: {
      metal: 0,
      crystal: 0,
      fuel: 8,
      energy: 100,
    },
    inventoryLots: {
      metal: [],
      crystal: [],
      fuel: [{ unitPrice: RESOURCE_SELL_PRICES.fuel, count: 8 }],
      energy: [{ unitPrice: RESOURCE_SELL_PRICES.energy, count: 100 }],
    },
    collectedPickupIds: new Set(),
    planetResourceStates: {},
    inventorySlots: createStartingInventorySlots(),
    hoverboardWorldStates: {},
    chestSlots: Array(100).fill(null),
  },
  scene: 'space',
  surface: null,
  chunks: new Map(),
  chunkCenter: null,
  planets: [],
  selectedPlanet: null,
  homeStar: null,
};

const MOVEMENT_KEY_DIRECTIONS = {
  arrowup: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  arrowdown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};

function getLatestMovementInput() {
  let latestKey = null;
  let latestOrder = -1;
  for (const key of Object.keys(MOVEMENT_KEY_DIRECTIONS)) {
    if (game.keys[key] && (game.movementKeyOrder[key] ?? 0) > latestOrder) {
      latestKey = key;
      latestOrder = game.movementKeyOrder[key] ?? 0;
    }
  }
  return latestKey ? MOVEMENT_KEY_DIRECTIONS[latestKey] : { x: 0, y: 0 };
}

function createStartingInventorySlots() {
  const slots = Array(100).fill(null);
  // La partida nueva solo trae el centro clásico y el propulsor eléctrico, ya equipados.
  const startingItems = ['center-classic', 'thruster-electric'].map((id) => {
    const part = getShipPart(id);
    return {
      id: part.id,
      name: part.name,
      icon: '◆',
      color: '#8dffa9',
      count: 1,
      sprite: part.src,
    };
  });
  startingItems.forEach((item, index) => {
    slots[index] = item;
  });
  slots[startingItems.length] = { ...HOVERBOARD_ITEM };
  return slots;
}

function ensureHoverboardInventoryItem() {
  const hasHoverboard = [...game.player.inventorySlots, ...game.player.chestSlots]
    .some((item) => item?.id === HOVERBOARD_ITEM_ID);
  if (hasHoverboard) return;
  const emptySlot = game.player.inventorySlots.findIndex((item) => !item);
  if (emptySlot >= 0) game.player.inventorySlots[emptySlot] = { ...HOVERBOARD_ITEM };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function markSpaceHudAction() {
  if (game.scene === 'space') spaceHudActionUntil = Math.max(spaceHudActionUntil, game.time + 1.2);
}

function updateSpaceHudOpacity(dt) {
  const target = game.scene === 'space' && game.time < spaceHudActionUntil ? 1 : 0.5;
  const opacityStep = 0.5 * dt;
  spaceHudOpacity = target > spaceHudOpacity
    ? Math.min(target, spaceHudOpacity + opacityStep)
    : Math.max(target, spaceHudOpacity - opacityStep);
  if (game.scene === 'space') {
    shipAbilities.style.opacity = String(spaceHudOpacity);
    multiplayerStatus.style.opacity = String(spaceHudOpacity);
    const frameColor = getHealthFrameColor();
    for (const frame of shipAbilities.querySelectorAll('.ship-ability')) {
      frame.style.borderColor = frameColor;
      frame.style.boxShadow = `0 0 8px ${frameColor}55`;
    }
    multiplayerStatus.style.borderColor = frameColor;
  } else {
    shipAbilities.style.opacity = '';
    multiplayerStatus.style.opacity = '';
    for (const frame of shipAbilities.querySelectorAll('.ship-ability')) {
      frame.style.borderColor = '';
      frame.style.boxShadow = '';
    }
    multiplayerStatus.style.borderColor = '';
  }
}

function getHealthFrameColor() {
  const stats = getEquippedShipStats();
  const healthRatio = stats.maxHealth > 0 ? clamp(stats.currentHealth / stats.maxHealth, 0, 1) : 1;
  const green = [84, 255, 118];
  const orange = [255, 145, 54];
  const damageRatio = 1 - healthRatio;
  const rgb = green.map((channel, index) => Math.round(channel + (orange[index] - channel) * damageRatio));
  return `rgb(${rgb.join(', ')})`;
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  game.width = width;
  game.height = height;
  homeFloorCache = null;
  marsFloorCache = null;
}

function blendHexColors(color, target, amount) {
  const sourceRgb = color.match(/[a-f\d]{2}/gi)?.map((part) => parseInt(part, 16));
  const targetRgb = target.match(/[a-f\d]{2}/gi)?.map((part) => parseInt(part, 16));
  if (!sourceRgb || !targetRgb || sourceRgb.length !== 3 || targetRgb.length !== 3) {
    return color;
  }

  const channels = sourceRgb.map((channel, index) =>
    Math.round(channel + (targetRgb[index] - channel) * amount)
  );
  return `rgb(${channels.join(', ')})`;
}

function solarHueColor(time, phase = 0) {
  const hue = 15 + (Math.sin(time * 0.12 + phase) + 1) * 27.5;
  return `hsl(${hue}, 100%, 58%)`;
}

function coordinateSeed(x, y, salt = 0) {
  let hash = Math.imul((x | 0) ^ salt, 0x45d9f3b);
  hash = Math.imul(hash ^ (y | 0), 0x45d9f3b);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function createRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createStarSprite() {
  const sprite = document.createElement('canvas');
  const spriteContext = sprite.getContext('2d');
  sprite.width = 12;
  sprite.height = 12;

  const halo = spriteContext.createRadialGradient(6, 6, 0.4, 6, 6, 6);
  halo.addColorStop(0, 'rgba(240, 246, 255, 0.95)');
  halo.addColorStop(0.16, 'rgba(210, 225, 255, 0.68)');
  halo.addColorStop(0.48, 'rgba(165, 190, 235, 0.18)');
  halo.addColorStop(1, 'rgba(140, 170, 230, 0)');
  spriteContext.fillStyle = halo;
  spriteContext.fillRect(0, 0, sprite.width, sprite.height);
  return sprite;
}

const starSprite = createStarSprite();
const STAR_SPRITE_RADIUS = starSprite.width / 2;
const PLANET_SPRITE_SIZE = 32;
const planetSpriteCache = new Map();
const spaceBackgroundCanvas = document.createElement('canvas');
const spaceBackgroundContext = spaceBackgroundCanvas.getContext('2d');
let spaceBackgroundCacheTime = -Infinity;
const SPACE_BACKGROUND_REFRESH_INTERVAL = 1000 / 30;

function getPlanetSprite(planet) {
  const cacheKey = planet.color;
  let sprite = planetSpriteCache.get(cacheKey);
  if (sprite) {
    return sprite;
  }

  sprite = document.createElement('canvas');
  sprite.width = PLANET_SPRITE_SIZE;
  sprite.height = PLANET_SPRITE_SIZE;
  const spriteContext = sprite.getContext('2d');
  spriteContext.fillStyle = planet.color;
  spriteContext.beginPath();
  spriteContext.arc(
    PLANET_SPRITE_SIZE / 2,
    PLANET_SPRITE_SIZE / 2,
    PLANET_SPRITE_SIZE / 2 - 1,
    0,
    Math.PI * 2
  );
  spriteContext.fill();

  planetSpriteCache.set(cacheKey, sprite);
  return sprite;
}

function drawShipParts(context, centerX, centerY, tileSize, parts = game.player.shipParts, healthBySlot = null) {
  const drawPart = (slot, partId, x, y, mirrored = false) => {
    const image = SHIP_PART_IMAGES.get(partId);
    if (!image?.complete || image.naturalWidth === 0) {
      return;
    }
    context.save();
    context.translate(centerX + x * tileSize, centerY + y * tileSize);
    if (mirrored) {
      context.scale(-1, 1);
    }
    const health = healthBySlot?.[slot];
    if (health && health.hp <= 0) {
      context.restore();
      return;
    }
    if (health) {
      const maxHealth = getShipPartMaxHealth(slot, health.partId) || 1;
      const grayAmount = clamp(1 - health.hp / maxHealth, 0, 1);
      context.filter = `grayscale(${Math.round(grayAmount * 100)}%)`;
    }
    context.drawImage(image, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
    context.restore();
  };

  context.save();
  context.imageSmoothingEnabled = false;
  drawPart('tip', parts.tip, 0, -1);
  drawPart('leftWing', parts.leftWing, -1, 0);
  drawPart('center', parts.center, 0, 0);
  drawPart('rightWing', parts.rightWing, 1, 0, true);
  drawPart('propulsor', parts.propulsor, 0, 1);
  context.restore();
}

function drawShipPreview() {
  shipPreviewContext.clearRect(0, 0, shipPreviewCanvas.width, shipPreviewCanvas.height);
  drawShipParts(
    shipPreviewContext,
    shipPreviewCanvas.width / 2,
    shipPreviewCanvas.height / 2,
    Math.min(shipPreviewCanvas.width, shipPreviewCanvas.height) / 3.5,
    game.player.shipParts,
    ensureShipPartHealth()
  );
}

function drawBackgroundStar(screenX, screenY, size, wraps) {
  const xOffsets = [0];
  const yOffsets = [0];

  if (wraps) {
    if (screenX < STAR_SPRITE_RADIUS) {
      xOffsets.push(game.width);
    } else if (screenX > game.width - STAR_SPRITE_RADIUS) {
      xOffsets.push(-game.width);
    }
    if (screenY < STAR_SPRITE_RADIUS) {
      yOffsets.push(game.height);
    } else if (screenY > game.height - STAR_SPRITE_RADIUS) {
      yOffsets.push(-game.height);
    }
  }

  for (const xOffset of xOffsets) {
    for (const yOffset of yOffsets) {
      ctx.fillRect(screenX + xOffset, screenY + yOffset, size, size);
      ctx.drawImage(
        starSprite,
        screenX + xOffset - STAR_SPRITE_RADIUS,
        screenY + yOffset - STAR_SPRITE_RADIUS
      );
    }
  }
}

function getBackgroundEdgeOpacity(x, y) {
  const fadeWidth = Math.min(64, game.width * 0.15);
  const fadeHeight = Math.min(64, game.height * 0.15);
  const horizontalFade = clamp(Math.min(x, game.width - x) / fadeWidth, 0, 1);
  const verticalFade = clamp(Math.min(y, game.height - y) / fadeHeight, 0, 1);
  return Math.min(horizontalFade, verticalFade);
}

function getTwinkleProperties(phase) {
  return {
    twinkles: Math.sin(phase * 2.17) > 0.65,
    twinkleSpeed: 1.2 + Math.abs(Math.sin(phase * 4.17)) * 1.3,
  };
}

const PARALLAX_STAR_COLORS = [
  { color: '#fff4e4', weight: 0.42 }, // blanco cálido
  { color: '#c3d3ff', weight: 0.2 },  // azul pálido
  { color: '#ffd9a0', weight: 0.16 }, // amarillento
  { color: '#ffb27a', weight: 0.14 }, // anaranjado
  { color: '#ff8a70', weight: 0.08 }, // rojizo
];

const GLOW_MAX_OPACITY = 0.5;
const starGlowSprites = new Map();

// Pequeño halo de color suave que se dibuja detrás de las estrellas más cercanas.
function getStarGlowSprite(color) {
  let sprite = starGlowSprites.get(color);
  if (sprite) return sprite;
  sprite = document.createElement('canvas');
  sprite.width = 16;
  sprite.height = 16;
  const glowContext = sprite.getContext('2d');
  const gradient = glowContext.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, `${color}ff`);
  gradient.addColorStop(0.2, `${color}bf`);
  gradient.addColorStop(0.45, `${color}63`);
  gradient.addColorStop(0.7, `${color}23`);
  gradient.addColorStop(1, `${color}00`);
  glowContext.fillStyle = gradient;
  glowContext.fillRect(0, 0, 16, 16);
  starGlowSprites.set(color, sprite);
  return sprite;
}

function pickParallaxStarColor(roll) {
  let total = 0;
  for (const entry of PARALLAX_STAR_COLORS) {
    total += entry.weight;
    if (roll <= total) return entry.color;
  }
  return PARALLAX_STAR_COLORS[0].color;
}

function createParallaxCell(cellX, cellY, seed, count, minBrightness, maxBrightness) {
  const random = createRandom(coordinateSeed(cellX, cellY, seed));
  return Array.from({ length: count }, () => {
    const phase = random() * Math.PI * 2;
    return {
      x: (cellX + random()) * PARALLAX_CELL_SIZE,
      y: (cellY + random()) * PARALLAX_CELL_SIZE,
      brightness: minBrightness + Math.floor(random() * (maxBrightness - minBrightness + 1)),
      color: pickParallaxStarColor(random()),
      big: random() > 0.9,
      phase,
      ...getTwinkleProperties(phase),
    };
  });
}

function candidateWinsSeparation(cx, cy, minDistance, salt, probability) {
  const ownRoll = coordinateSeed(cx, cy, salt) / 4294967296;
  if (ownRoll >= probability) {
    return false;
  }

  for (let dx = -minDistance; dx <= minDistance; dx += 1) {
    for (let dy = -minDistance; dy <= minDistance; dy += 1) {
      if ((dx === 0 && dy === 0) || dx * dx + dy * dy > minDistance * minDistance) {
        continue;
      }

      const neighborRoll = coordinateSeed(cx + dx, cy + dy, salt) / 4294967296;
      if (
        neighborRoll < probability &&
        (neighborRoll < ownRoll ||
          (neighborRoll === ownRoll && (cx + dx < cx || (cx + dx === cx && cy + dy < cy))))
      ) {
        return false;
      }
    }
  }

  return true;
}

// orbitSpeed (rad/s ÷ 2) de un planeta del sistema solar para que su velocidad lineal baje con la distancia.
function getHubOrbitSpeed(nominalOrbitRadius, index) {
  const linearSpeed = HUB_EARTH_ORBIT_SPEED * Math.sqrt(250 / nominalOrbitRadius);
  const worldRadius = nominalOrbitRadius * ORBIT_DISTANCE_SCALE;
  return (linearSpeed / (worldRadius * 2)) * (index % 2 === 0 ? 1 : -1);
}

function makePlanet(spec, star, index, random, isHub) {
  const types = [
    { color: '#d5a865', radius: 7, gas: false },
    { color: '#93c9cb', radius: 9, gas: false },
    { color: '#ca7658', radius: 10, gas: false },
    { color: '#8d9ce8', radius: 12, gas: true },
  ];
  const type = types[Math.floor(random() * types.length)];
  const radius = spec.radius ?? type.radius;
  const name = spec.name ?? `Planeta ${index + 1}`;

  return {
    name,
    color: spec.color ?? type.color,
    radius,
    orbitRadius: spec.parentName
      ? spec.orbitRadius
      : (spec.orbitRadius ?? 100 + index * 110) * ORBIT_DISTANCE_SCALE,
    angle: spec.angle ?? random() * Math.PI * 2,
    orbitSpeed: spec.orbitSpeed ?? (isHub
      ? getHubOrbitSpeed(spec.orbitRadius, index)
      : (random() * 0.22 + 0.025) * (index % 2 === 0 ? 1 : -1)),
    verticalTilt: spec.verticalTilt ?? (0.45 + random() * 0.45),
    orbitRotation: spec.orbitRotation ?? (random() * Math.PI),
    ring: Boolean(spec.ring),
    gas: Boolean(spec.gas ?? type.gas),
    seed: coordinateSeed(star.chunkX, star.chunkY, index + 811),
    resources: {
      metal: 2 + Math.floor(random() * 7),
      crystal: 1 + Math.floor(random() * 7),
      fuel: 1 + Math.floor(random() * 6),
    },
    isHomeworld: isHub && name === 'Tierra',
    isMoon: Boolean(spec.parentName),
    parentName: spec.parentName ?? null,
    parent: null,
    star,
  };
}

// Zona ocupada por el sistema solar: no se generan otras estrellas ni agujeros negros dentro de la órbita más lejana.
function isInsideHomeSystem(chunkX, chunkY) {
  return Math.hypot(chunkX, chunkY) <= MAX_ORBIT_DISTANCE_CHUNKS + 1;
}

function createChunk(chunkX, chunkY, includeBackgroundStars = true) {
  const seed = coordinateSeed(chunkX, chunkY, 42);
  const random = createRandom(seed);
  const baseX = chunkX * CHUNK_SIZE;
  const baseY = chunkY * CHUNK_SIZE;
  const chunk = {
    x: chunkX,
    y: chunkY,
    stars: includeBackgroundStars ? Array.from({ length: 76 }, () => {
      const x = baseX + random() * CHUNK_SIZE;
      const y = baseY + random() * CHUNK_SIZE;
      const brightness = 70 + Math.floor(random() * 150);
      const phase = random() * Math.PI * 2;
      const size = random() > 0.92 ? 2 : 1;
      return {
        x,
        y,
        brightness,
        phase,
        ...getTwinkleProperties(phase),
        size,
      };
    }) : [],
    systems: [],
    blackHole: null,
  };

  if (chunkX === 0 && chunkY === 0) {
    if (!game.homeStar) {
      const hub = {
        name: 'Sol',
        x: 0,
        y: 0,
        radius: 30,
        color: '#ffa841',
        chunkX,
        chunkY,
        isHub: true,
        planets: [],
      };
      hub.planets = SOLAR_SYSTEM_PLANETS.map((spec, index) =>
        makePlanet(spec, hub, index, random, true)
      );
      for (const planet of hub.planets) {
        if (planet.parentName) {
          planet.parent = hub.planets.find((candidate) => candidate.name === planet.parentName) ?? null;
        }
      }
      game.homeStar = hub;
    }
    chunk.systems.push(game.homeStar);
  } else if (
    !isInsideHomeSystem(chunkX, chunkY) &&
    candidateWinsSeparation(chunkX, chunkY, STAR_MIN_CHUNK_DISTANCE, 0xa11ce, 0.04)
  ) {
    const star = {
      name: `Estrella ${chunkX}, ${chunkY}`,
      x: baseX + CHUNK_SIZE * (0.2 + random() * 0.6),
      y: baseY + CHUNK_SIZE * (0.2 + random() * 0.6),
      radius: 18 + random() * 15,
      color: ['#a9bfff', '#fff2c6', '#ff9b71'][Math.floor(random() * 3)],
      chunkX,
      chunkY,
      isHub: false,
      planets: [],
    };
    const count = 2 + Math.floor(random() * 5);
    for (let index = 0; index < count; index += 1) {
      star.planets.push(makePlanet({}, star, index, random, false));
    }
    chunk.systems.push(star);
  }

  if (
    !isInsideHomeSystem(chunkX, chunkY) &&
    candidateWinsSeparation(chunkX, chunkY, BLACK_HOLE_MIN_CHUNK_DISTANCE, 0xdead, 0.0025)
  ) {
    chunk.blackHole = {
      x: baseX + CHUNK_SIZE * (0.2 + random() * 0.6),
      y: baseY + CHUNK_SIZE * (0.2 + random() * 0.6),
    };
  }

  return chunk;
}

function updateVisibleChunks() {
  const centerX = Math.floor(game.player.x / CHUNK_SIZE);
  const centerY = Math.floor(game.player.y / CHUNK_SIZE);
  if (game.chunkCenter && game.chunkCenter.x === centerX && game.chunkCenter.y === centerY) {
    return;
  }

  game.chunkCenter = { x: centerX, y: centerY };
  for (const [key, chunk] of game.chunks) {
    if (
      Math.abs(chunk.x - centerX) > CHUNK_RADIUS ||
      Math.abs(chunk.y - centerY) > CHUNK_RADIUS
    ) {
      game.chunks.delete(key);
    }
  }
  for (let dx = -CHUNK_RADIUS; dx <= CHUNK_RADIUS; dx += 1) {
    for (let dy = -CHUNK_RADIUS; dy <= CHUNK_RADIUS; dy += 1) {
      const chunkX = centerX + dx;
      const chunkY = centerY + dy;
      const key = `${chunkX},${chunkY}`;
      if (!game.chunks.has(key)) game.chunks.set(key, createChunk(chunkX, chunkY));
    }
  }
}

function updatePlanetPositions() {
  game.planets = [];
  const positionedPlanets = new Set();
  for (const chunk of game.chunks.values()) {
    for (const star of chunk.systems) {
      for (const planet of star.planets) {
        updatePlanetPosition(planet);
        game.planets.push(planet);
        positionedPlanets.add(planet);
      }
    }
  }

  const trackedPlanet = game.pointer.followPlanet || game.selectedPlanet;
  const persistentSystems = [
    game.homeStar,
    trackedPlanet?.star,
    game.surface?.planet.star,
  ].filter(Boolean);
  for (const star of persistentSystems) {
    for (const planet of star.planets) {
      if (!positionedPlanets.has(planet)) {
        updatePlanetPosition(planet);
        game.planets.push(planet);
        positionedPlanets.add(planet);
      }
    }
  }
}

function updatePlanetPosition(planet) {
  const center = planet.parent ?? planet.star;
  if (planet.parent) updatePlanetPosition(planet.parent);
  const angle = planet.angle + game.time * planet.orbitSpeed * 2;
  const orbitX = Math.cos(angle) * planet.orbitRadius;
  const orbitY = Math.sin(angle) * planet.orbitRadius * planet.verticalTilt;
  const rotationCos = Math.cos(planet.orbitRotation);
  const rotationSin = Math.sin(planet.orbitRotation);
  planet.x = center.x + orbitX * rotationCos - orbitY * rotationSin;
  planet.y = center.y + orbitX * rotationSin + orbitY * rotationCos;
}

function getPlanetVelocity(planet) {
  const angularSpeed = planet.orbitSpeed * 2;
  const angle = planet.angle + game.time * angularSpeed;
  const orbitVelocityX = -Math.sin(angle) * planet.orbitRadius * angularSpeed;
  const orbitVelocityY = Math.cos(angle) * planet.orbitRadius * planet.verticalTilt * angularSpeed;
  const rotationCos = Math.cos(planet.orbitRotation);
  const rotationSin = Math.sin(planet.orbitRotation);

  const parentVelocity = planet.parent ? getPlanetVelocity(planet.parent) : { x: 0, y: 0 };
  return {
    x: parentVelocity.x + orbitVelocityX * rotationCos - orbitVelocityY * rotationSin,
    y: parentVelocity.y + orbitVelocityX * rotationSin + orbitVelocityY * rotationCos,
  };
}

function updateHud() {
  creditsEl.textContent = game.player.credits;
}

function normalizeInventoryLots() {
  if (!game.player.inventoryLots || typeof game.player.inventoryLots !== 'object') {
    game.player.inventoryLots = {};
  }

  for (const resourceKey of Object.keys(RESOURCE_CATALOG)) {
    game.player.inventory[resourceKey] ||= 0;
    const total = Math.max(0, Math.floor(game.player.inventory[resourceKey] || 0));
    const savedLots = Array.isArray(game.player.inventoryLots[resourceKey])
      ? game.player.inventoryLots[resourceKey]
      : [];
    const lotsByPrice = new Map();
    let remaining = total;

    for (const lot of savedLots) {
      if (
        !lot ||
        !Number.isFinite(lot.unitPrice) ||
        lot.unitPrice < 0 ||
        !Number.isInteger(lot.count) ||
        lot.count <= 0 ||
        remaining <= 0
      ) {
        continue;
      }
      const count = Math.min(remaining, lot.count);
      lotsByPrice.set(lot.unitPrice, (lotsByPrice.get(lot.unitPrice) || 0) + count);
      remaining -= count;
    }

    if (remaining > 0) {
      const defaultPrice = RESOURCE_SELL_PRICES[resourceKey];
      lotsByPrice.set(defaultPrice, (lotsByPrice.get(defaultPrice) || 0) + remaining);
    }
    game.player.inventoryLots[resourceKey] = Array.from(
      lotsByPrice,
      ([unitPrice, count]) => ({ unitPrice, count })
    );
  }
}

function addResourceToInventory(resourceKey, count, unitPrice = RESOURCE_SELL_PRICES[resourceKey]) {
  if (!Number.isInteger(count) || count <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return;
  }
  normalizeInventoryLots();
  const lots = game.player.inventoryLots[resourceKey];
  const existingLot = lots.find((lot) => lot.unitPrice === unitPrice);
  if (existingLot) {
    existingLot.count += count;
  } else {
    lots.push({ unitPrice, count });
  }
  game.player.inventory[resourceKey] += count;
}

function removeResourceFromInventory(resourceKey, count, unitPrice = null) {
  if (!Number.isInteger(count) || count <= 0) return 0;
  normalizeInventoryLots();
  const lots = game.player.inventoryLots[resourceKey];
  let remaining = Math.min(count, game.player.inventory[resourceKey]);

  for (let index = 0; index < lots.length && remaining > 0;) {
    const lot = lots[index];
    if (unitPrice !== null && lot.unitPrice !== unitPrice) {
      index += 1;
      continue;
    }
    const removed = Math.min(remaining, lot.count);
    lot.count -= removed;
    remaining -= removed;
    if (lot.count === 0) {
      lots.splice(index, 1);
    } else {
      index += 1;
    }
  }

  const removedCount = Math.min(count, game.player.inventory[resourceKey]) - remaining;
  game.player.inventory[resourceKey] -= removedCount;
  return removedCount;
}

function takePriceLots(priceLots, count) {
  let remaining = count;
  const taken = [];
  const kept = [];
  for (const lot of priceLots || []) {
    const moved = Math.min(remaining, lot.count);
    if (moved > 0) taken.push({ unitPrice: lot.unitPrice, count: moved });
    if (lot.count > moved) kept.push({ unitPrice: lot.unitPrice, count: lot.count - moved });
    remaining -= moved;
  }
  return { taken, remaining: kept };
}

function addPriceLots(priceLots, additions) {
  for (const lot of additions || []) {
    if (!lot || !Number.isFinite(lot.unitPrice) || !Number.isInteger(lot.count) || lot.count <= 0) continue;
    const existing = priceLots.find((entry) => entry.unitPrice === lot.unitPrice);
    if (existing) existing.count += lot.count;
    else priceLots.push({ unitPrice: lot.unitPrice, count: lot.count });
  }
}

function mergeResourceStack(target, source, count) {
  const sourceLots = source.priceLots || [{
    unitPrice: source.unitPrice ?? RESOURCE_SELL_PRICES[source.resourceKey], count: source.count,
  }];
  const split = takePriceLots(sourceLots, count);
  target.priceLots ||= [{
    unitPrice: target.unitPrice ?? RESOURCE_SELL_PRICES[target.resourceKey], count: target.count,
  }];
  addPriceLots(target.priceLots, split.taken);
  target.unitPrice = target.priceLots.length === 1 ? target.priceLots[0].unitPrice : null;
  source.priceLots = split.remaining;
  target.count += count;
  source.count -= count;
}

function removePriceLotsFromInventory(resourceKey, priceLots) {
  let removed = 0;
  for (const lot of priceLots || []) {
    removed += removeResourceFromInventory(resourceKey, lot.count, lot.unitPrice);
  }
  return removed;
}

function setItemPreviewSource(imageElement, source) {
  if (!imageElement || !source || imageElement.dataset.previewSource === source) return;
  imageElement.dataset.previewSource = source;
  if (source.includes('/guns/')) imageElement.classList.add('combat-item-preview');
  imageElement.src = source;
  const cropVisibleSprite = () => {
    if (imageElement.dataset.previewCropped === source || !imageElement.naturalWidth || !imageElement.naturalHeight) return;
    try {
      const sourceCanvas = document.createElement('canvas');
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!sourceContext) return;
      // Para sprites animados horizontales, usar solo el primer cuadro como miniatura.
      const frameWidth = imageElement.naturalWidth >= imageElement.naturalHeight * 3.5
        ? Math.floor(imageElement.naturalWidth / 3)
        : imageElement.naturalWidth;
      sourceCanvas.width = frameWidth;
      sourceCanvas.height = imageElement.naturalHeight;
      sourceContext.drawImage(imageElement, 0, 0, frameWidth, imageElement.naturalHeight, 0, 0, frameWidth, imageElement.naturalHeight);
      const pixels = sourceContext.getImageData(0, 0, frameWidth, imageElement.naturalHeight).data;
      let left = frameWidth;
      let top = imageElement.naturalHeight;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < imageElement.naturalHeight; y += 1) {
        for (let x = 0; x < frameWidth; x += 1) {
          if (pixels[(y * frameWidth + x) * 4 + 3] <= 8) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      if (right < left || bottom < top) return;
      const padding = 1;
      left = Math.max(0, left - padding);
      top = Math.max(0, top - padding);
      right = Math.min(frameWidth - 1, right + padding);
      bottom = Math.min(imageElement.naturalHeight - 1, bottom + padding);
      const trimmed = document.createElement('canvas');
      trimmed.width = right - left + 1;
      trimmed.height = bottom - top + 1;
      trimmed.getContext('2d')?.drawImage(sourceCanvas, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
      imageElement.dataset.previewCropped = source;
      imageElement.src = trimmed.toDataURL();
    } catch (error) {
      // Si el navegador no permite leer los píxeles, se conserva el sprite original.
    }
  };
  imageElement.addEventListener('load', cropVisibleSprite, { once: true });
  if (imageElement.complete) cropVisibleSprite();
}

function updateInventoryItemsGrid(grid = inventoryItemsGrid) {
  stackMatchingItems(game.player.inventorySlots, false);
  const resources = Object.entries(RESOURCE_CATALOG).map(([key, data]) => ({ key, ...data }));

  normalizeInventoryLots();
  for (const resource of resources) {
    const stacks = [];
    let currentStack = null;
    for (const lot of game.player.inventoryLots[resource.key]) {
      let remaining = lot.count;
      while (remaining > 0) {
        if (!currentStack || currentStack.count >= MAX_ITEM_STACK) {
          currentStack = { count: 0, priceLots: [] };
          stacks.push(currentStack);
        }
        const moved = Math.min(remaining, MAX_ITEM_STACK - currentStack.count);
        addPriceLots(currentStack.priceLots, [{ unitPrice: lot.unitPrice, count: moved }]);
        currentStack.count += moved;
        remaining -= moved;
      }
    }
    const requiredSlots = stacks.length;
    const slotIndexes = game.player.inventorySlots
      .map((item, index) => item?.resourceKey === resource.key ? index : -1)
      .filter((index) => index >= 0);

    while (slotIndexes.length > requiredSlots) {
      game.player.inventorySlots[slotIndexes.pop()] = null;
    }
    while (slotIndexes.length < requiredSlots) {
      const emptyIndex = game.player.inventorySlots.findIndex((item) => item === null);
      if (emptyIndex < 0) {
        console.error(`No hay ranuras para mostrar todo el recurso ${resource.name}.`);
        break;
      }
      slotIndexes.push(emptyIndex);
    }

    for (let stackIndex = 0; stackIndex < slotIndexes.length; stackIndex += 1) {
      const slotIndex = slotIndexes[stackIndex];
      const stack = stacks[stackIndex];
      const itemId = `resource-${resource.key}-${stackIndex}`;
      game.player.inventorySlots[slotIndex] = {
        id: itemId,
        name: resource.name,
        icon: resource.icon,
        color: resource.color,
        count: stack.count,
        resourceKey: resource.key,
        priceLots: stack.priceLots,
        unitPrice: stack.priceLots.length === 1 ? stack.priceLots[0].unitPrice : null,
        description: `${resource.description} Apilable hasta ${MAX_ITEM_STACK} unidades.`,
      };
    }
  }

  compactInventorySlotsToCapacity();
  const visibleSlotCount = getVisibleInventorySlotCount();

  grid.replaceChildren();
  for (let index = 0; index < visibleSlotCount; index += 1) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.setAttribute('role', 'gridcell');
    const item = game.player.inventorySlots[index];
    if (item) {
      slot.classList.add('inventory-slot-filled');
      slot.draggable = true;
      slot.tabIndex = 0;
      slot.dataset.slotIndex = String(index);
      const equippedPartIds = [
        game.player.shipParts.center,
        game.player.shipParts.propulsor,
        game.player.shipParts.leftWing,
        game.player.shipParts.rightWing,
        game.player.shipParts.tip,
      ];
      const isEquipped = equippedPartIds.includes(item.id) ||
        isSurfaceItemEquipped(item.id) ||
        (item.id === HOVERBOARD_ITEM_ID && game.player.hoverboardEquipped);
      if (isEquipped) {
        slot.classList.add('inventory-slot-equipped');
      }
      slot.setAttribute('aria-label', `${item.name}: ${item.count}${isEquipped ? ', equipado' : ''}`);
      attachItemTooltip(slot, item, isEquipped);

      const previewSprite = getItemPreviewSprite(item);
      if (previewSprite) {
        const icon = document.createElement('img');
        icon.className = 'inventory-slot-icon-image';
        setItemPreviewSource(icon, previewSprite);
        icon.alt = '';
        icon.draggable = false;
        slot.append(icon);
      } else {
        const icon = document.createElement('span');
        icon.className = 'inventory-slot-icon';
        icon.style.color = item.color;
        icon.textContent = item.icon;
        slot.append(icon);
      }

      const count = document.createElement('span');
      count.className = 'inventory-slot-count';
      count.textContent = String(item.count);
      slot.append(count);
      slot.addEventListener('click', () => {
        if (isSurfaceUsableItem(item.id)) toggleSurfaceEquipment(item.id);
      });
      slot.addEventListener('dblclick', () => {
        if (equipShipPart(item.id)) {
          updateInventoryItemsGrid(grid);
          if (currentInventoryView === 'nave') {
            renderShipWorkshop();
          }
          saveGameState();
        }
      });
    } else {
      slot.setAttribute('aria-label', `Espacio vacío ${index + 1}`);
    }
    slot.dataset.slotIndex = String(index);
    slot.addEventListener('dragstart', (event) => {
      if (!item) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData('text/plain', String(index));
      event.dataTransfer.setData('application/x-spaceheaven-grid', 'player');
      event.dataTransfer.effectAllowed = 'move';
      draggedInventoryItem = { source: 'player', index, item: { ...item } };
      draggedItemDroppedInsideInterface = false;
      slot.classList.add('inventory-slot-dragging');
    });
    slot.addEventListener('dragend', (event) => {
      slot.classList.remove('inventory-slot-dragging');
      const dragged = draggedInventoryItem;
      draggedInventoryItem = null;
      if (dragged && event.dataTransfer?.dropEffect === 'none' && !draggedItemDroppedInsideInterface) {
        askDeleteDraggedItem(dragged);
      }
      draggedItemDroppedInsideInterface = false;
    });
    slot.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    slot.addEventListener('drop', (event) => {
      const source = event.dataTransfer.getData('application/x-spaceheaven-grid') || 'player';
      const fromIndex = Number(event.dataTransfer.getData('text/plain'));
      const toIndex = Number(slot.dataset.slotIndex);
      if (source === 'chest') {
        event.preventDefault();
        moveChestItemToInventory(fromIndex, toIndex);
        event.dataTransfer.dropEffect = 'move';
        return;
      }
      event.preventDefault();
      if (
        !Number.isInteger(fromIndex) ||
        !Number.isInteger(toIndex) ||
        fromIndex < 0 ||
        fromIndex >= game.player.inventorySlots.length ||
        toIndex < 0 ||
        toIndex >= game.player.inventorySlots.length ||
        fromIndex === toIndex ||
        !game.player.inventorySlots[fromIndex]
      ) {
        return;
      }

      const sourceItem = game.player.inventorySlots[fromIndex];
      const destinationItem = game.player.inventorySlots[toIndex];
      if (itemsCanStack(destinationItem, sourceItem)) {
        const moved = Math.min(sourceItem.count, MAX_ITEM_STACK - destinationItem.count);
        destinationItem.count += moved;
        sourceItem.count -= moved;
        if (sourceItem.count <= 0) game.player.inventorySlots[fromIndex] = null;
      } else {
        [game.player.inventorySlots[fromIndex], game.player.inventorySlots[toIndex]] =
          [game.player.inventorySlots[toIndex], game.player.inventorySlots[fromIndex]];
      }
      stackMatchingItems(game.player.inventorySlots, false);
      updateInventoryItemsGrid(grid);
      saveGameState();
    });
    grid.append(slot);
  }
  updateShipStatsDisplay();
}

function itemsCanStack(target, source) {
  if (!target || !source || target.count >= MAX_ITEM_STACK) return false;
  if (target.resourceKey || source.resourceKey) {
    return target.resourceKey === source.resourceKey;
  }
  return target.id === source.id;
}

function stackMatchingItems(slots, includeResources) {
  for (let targetIndex = 0; targetIndex < slots.length; targetIndex += 1) {
    const target = slots[targetIndex];
    if (!target || (!includeResources && target.resourceKey)) continue;
    for (let sourceIndex = targetIndex + 1; sourceIndex < slots.length; sourceIndex += 1) {
      const source = slots[sourceIndex];
      if (!itemsCanStack(target, source)) continue;
      const moved = Math.min(source.count, MAX_ITEM_STACK - target.count);
      if (moved <= 0) continue;
      if (target.resourceKey) {
        mergeResourceStack(target, source, moved);
      } else {
        target.count += moved;
        source.count -= moved;
      }
      if (source.count <= 0) slots[sourceIndex] = null;
      if (target.count >= MAX_ITEM_STACK) break;
    }
  }
}

function findChestDestination(item, preferredIndex) {
  const slots = game.player.chestSlots;
  if (Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < slots.length) {
    if (!slots[preferredIndex] || itemsCanStack(slots[preferredIndex], item)) return preferredIndex;
  }
  const stackIndex = slots.findIndex((target) => itemsCanStack(target, item));
  if (stackIndex >= 0) return stackIndex;
  return slots.findIndex((target) => !target);
}

function findPlayerDestination(item, preferredIndex) {
  const slots = game.player.inventorySlots;
  const capacity = Math.min(slots.length, getEquippedShipStats().inventoryStackCapacity);
  if (Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < capacity) {
    if (!slots[preferredIndex] || itemsCanStack(slots[preferredIndex], item)) return preferredIndex;
  }
  const stackIndex = slots.slice(0, capacity).findIndex((target) => itemsCanStack(target, item));
  if (stackIndex >= 0) return stackIndex;
  return slots.slice(0, capacity).findIndex((target) => !target);
}

function askDeleteDraggedItem(dragged) {
  const slots = dragged.source === 'chest'
    ? game.player.chestSlots
    : game.player.inventorySlots;
  const item = slots[dragged.index];
  if (!item || item.id !== dragged.item.id || item.count !== dragged.item.count) return;
  if (isSurfaceItemEquipped(item.id)) {
    setMessage('Primero quita el objeto de uno de los espacios Q, E o R.');
    return;
  }
  if (item.id === HOVERBOARD_ITEM_ID && game.player.hoverboardEquipped) {
    setMessage('Primero guarda el hoverboard en el inventario antes de quitarlo.');
    return;
  }
  if (dragged.source === 'player' && isShipPartEquipped(item.id) && game.scene !== 'surface') {
    setMessage('Solo puedes quitar una pieza equipada mientras estás en un planeta.');
    return;
  }
  askConfirm(`¿Querés eliminar ${item.name}${item.count > 1 ? ` x${item.count}` : ''}?`, () => {
    const currentItem = slots[dragged.index];
    if (!currentItem || currentItem.id !== dragged.item.id || currentItem.count !== dragged.item.count) return;
    if (dragged.source === 'chest') {
      slots[dragged.index] = null;
      renderChestItemsGrid();
    } else if (currentItem.resourceKey) {
      removePriceLotsFromInventory(currentItem.resourceKey, currentItem.priceLots || [{
        unitPrice: currentItem.unitPrice ?? RESOURCE_SELL_PRICES[currentItem.resourceKey], count: currentItem.count,
      }]);
      if (currentInventoryView === 'market') updateMarketPanel();
      else updateInventoryItemsGrid(currentInventoryView === 'cofre' ? chestPlayerItemsGrid : inventoryItemsGrid);
      if (currentInventoryView === 'cofre') renderChestItemsGrid();
    } else {
      for (const partKey of ['center', 'propulsor', 'leftWing', 'rightWing', 'tip']) {
        if (game.player.shipParts[partKey] === currentItem.id) game.player.shipParts[partKey] = null;
      }
      ensureShipPartHealth();
      slots[dragged.index] = null;
      compactInventorySlotsToCapacity();
      if (currentInventoryView === 'market') updateMarketPanel();
      else updateInventoryItemsGrid(currentInventoryView === 'cofre' ? chestPlayerItemsGrid : inventoryItemsGrid);
      if (currentInventoryView === 'cofre') renderChestItemsGrid();
      if (currentInventoryView === 'nave') renderShipWorkshop();
    }
    saveGameState();
    setMessage(`${currentItem.name} eliminado.`);
  });
}

function movePlayerItemToChest(fromIndex, preferredIndex) {
  const item = game.player.inventorySlots[fromIndex];
  if (!item) return;
  if (isSurfaceItemEquipped(item.id)) {
    setMessage('Primero quita el objeto de uno de los espacios Q, E o R.');
    return;
  }
  if (item.id === HOVERBOARD_ITEM_ID && game.player.hoverboardEquipped) {
    setMessage('Primero guarda el hoverboard en el inventario antes de pasarlo al cofre.');
    return;
  }
  if (isShipPartEquipped(item.id) && game.scene !== 'surface') {
    setMessage('Solo puedes quitar una pieza equipada mientras estás en un planeta.');
    return;
  }
  const destinationIndex = findChestDestination(item, preferredIndex);
  if (destinationIndex < 0) {
    setMessage('El cofre está lleno.');
    return;
  }
  const destination = game.player.chestSlots[destinationIndex];
  const transferCount = destination
    ? Math.min(item.count, MAX_ITEM_STACK - destination.count)
    : item.count;
  if (transferCount <= 0) return;

  let transferredPriceLots = null;
  if (item.resourceKey) {
    const taken = takePriceLots(item.priceLots || [{ unitPrice: item.unitPrice ?? RESOURCE_SELL_PRICES[item.resourceKey], count: item.count }], transferCount);
    const removed = removePriceLotsFromInventory(item.resourceKey, taken.taken);
    if (removed !== transferCount) return;
    transferredPriceLots = taken.taken;
    item.priceLots = taken.remaining;
    item.count -= transferCount;
    if (item.count <= 0) game.player.inventorySlots[fromIndex] = null;
  } else {
    item.count -= transferCount;
    if (item.count <= 0) game.player.inventorySlots[fromIndex] = null;
    if (isShipPartEquipped(item.id)) {
      for (const partKey of ['center', 'propulsor', 'leftWing', 'rightWing', 'tip']) {
        if (game.player.shipParts[partKey] === item.id) game.player.shipParts[partKey] = null;
      }
      ensureShipPartHealth();
    }
  }

  if (item.resourceKey) {
    if (destination) {
      destination.priceLots ||= [{
        unitPrice: destination.unitPrice ?? RESOURCE_SELL_PRICES[destination.resourceKey],
        count: destination.count,
      }];
      addPriceLots(destination.priceLots, transferredPriceLots);
      destination.count += transferCount;
      destination.unitPrice = destination.priceLots.length === 1 ? destination.priceLots[0].unitPrice : null;
    } else game.player.chestSlots[destinationIndex] = { ...item, count: transferCount, priceLots: transferredPriceLots };
  } else if (destination) destination.count += transferCount;
  else game.player.chestSlots[destinationIndex] = { ...item, count: transferCount };
  compactInventorySlotsToCapacity();
  updateInventoryItemsGrid(currentInventoryView === 'cofre' ? chestPlayerItemsGrid : inventoryItemsGrid);
  renderChestItemsGrid();
  saveGameState();
}

function moveChestItemToInventory(fromIndex, preferredIndex) {
  const item = game.player.chestSlots[fromIndex];
  if (!item) return;
  if (item.resourceKey) {
    const available = getAvailableResourceCapacity(item.resourceKey);
    const transferCount = Math.min(item.count, available);
    if (transferCount <= 0) {
      setMessage('No hay capacidad suficiente en el inventario.');
      return;
    }
    const taken = takePriceLots(item.priceLots || [{ unitPrice: item.unitPrice ?? RESOURCE_SELL_PRICES[item.resourceKey], count: item.count }], transferCount);
    for (const lot of taken.taken) addResourceToInventory(item.resourceKey, lot.count, lot.unitPrice);
    item.priceLots = taken.remaining;
    item.count -= transferCount;
  } else {
    compactInventorySlotsToCapacity();
    const destinationIndex = findPlayerDestination(item, preferredIndex);
    if (destinationIndex < 0) {
      setMessage('No hay espacio suficiente en el inventario.');
      return;
    }
    const destination = game.player.inventorySlots[destinationIndex];
    const transferCount = destination
      ? Math.min(item.count, MAX_ITEM_STACK - destination.count)
      : item.count;
    if (transferCount <= 0) return;
    if (destination) destination.count += transferCount;
    else game.player.inventorySlots[destinationIndex] = { ...item, count: transferCount };
    item.count -= transferCount;
  }
  if (item.count <= 0) game.player.chestSlots[fromIndex] = null;
  updateInventoryItemsGrid(currentInventoryView === 'cofre' ? chestPlayerItemsGrid : inventoryItemsGrid);
  renderChestItemsGrid();
  saveGameState();
}

function renderChestItemsGrid() {
  if (!chestItemsGrid) return;
  stackMatchingItems(game.player.chestSlots, true);
  chestItemsGrid.replaceChildren();
  game.player.chestSlots.forEach((item, index) => {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.setAttribute('role', 'gridcell');
    slot.dataset.slotIndex = String(index);
    if (item) {
      slot.classList.add('inventory-slot-filled');
      slot.draggable = true;
      slot.tabIndex = 0;
      slot.setAttribute('aria-label', `${item.name}: ${item.count}`);
      attachItemTooltip(slot, item);
      const previewSprite = getItemPreviewSprite(item);
      if (previewSprite) {
        const icon = document.createElement('img');
        icon.className = 'inventory-slot-icon-image';
        setItemPreviewSource(icon, previewSprite);
        icon.alt = '';
        icon.draggable = false;
        slot.append(icon);
      } else {
        const icon = document.createElement('span');
        icon.className = 'inventory-slot-icon';
        icon.style.color = item.color;
        icon.textContent = item.icon;
        slot.append(icon);
      }
      const count = document.createElement('span');
      count.className = 'inventory-slot-count';
      count.textContent = String(item.count);
      slot.append(count);
      slot.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', String(index));
        event.dataTransfer.setData('application/x-spaceheaven-grid', 'chest');
        event.dataTransfer.effectAllowed = 'move';
        draggedInventoryItem = { source: 'chest', index, item: { ...item } };
        draggedItemDroppedInsideInterface = false;
        slot.classList.add('inventory-slot-dragging');
      });
      slot.addEventListener('dragend', (event) => {
        slot.classList.remove('inventory-slot-dragging');
        const dragged = draggedInventoryItem;
        draggedInventoryItem = null;
        if (dragged && event.dataTransfer?.dropEffect === 'none' && !draggedItemDroppedInsideInterface) askDeleteDraggedItem(dragged);
        draggedItemDroppedInsideInterface = false;
      });
    } else {
      slot.setAttribute('aria-label', `Espacio vacío ${index + 1}`);
    }
    slot.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      const source = event.dataTransfer.getData('application/x-spaceheaven-grid') || 'player';
      const fromIndex = Number(event.dataTransfer.getData('text/plain'));
      if (source === 'player') {
        movePlayerItemToChest(fromIndex, index);
      } else if (fromIndex !== index && game.player.chestSlots[fromIndex]) {
        const sourceItem = game.player.chestSlots[fromIndex];
        const destinationItem = game.player.chestSlots[index];
        if (itemsCanStack(destinationItem, sourceItem)) {
          const moved = Math.min(sourceItem.count, MAX_ITEM_STACK - destinationItem.count);
          if (destinationItem.resourceKey) mergeResourceStack(destinationItem, sourceItem, moved);
          else {
            destinationItem.count += moved;
            sourceItem.count -= moved;
          }
          if (sourceItem.count <= 0) game.player.chestSlots[fromIndex] = null;
        } else {
          [game.player.chestSlots[fromIndex], game.player.chestSlots[index]] =
            [game.player.chestSlots[index], game.player.chestSlots[fromIndex]];
        }
        stackMatchingItems(game.player.chestSlots, true);
        renderChestItemsGrid();
        saveGameState();
      }
      event.dataTransfer.dropEffect = 'move';
    });
    chestItemsGrid.append(slot);
  });
}

function compactInventorySlotsToCapacity() {
  const slots = game.player.inventorySlots;
  stackMatchingItems(slots, false);
  const capacity = Math.min(slots.length, getEquippedShipStats().inventoryStackCapacity);
  let nextAvailableSlot = 0;

  for (let index = capacity; index < slots.length; index += 1) {
    if (!slots[index]) continue;
    while (nextAvailableSlot < capacity && slots[nextAvailableSlot]) {
      nextAvailableSlot += 1;
    }
    if (nextAvailableSlot < capacity) {
      slots[nextAvailableSlot] = slots[index];
      slots[index] = null;
    }
  }

  let nextOverflowSlot = capacity;
  for (let index = capacity; index < slots.length; index += 1) {
    if (!slots[index]) continue;
    if (index > nextOverflowSlot) {
      slots[nextOverflowSlot] = slots[index];
      slots[index] = null;
    }
    nextOverflowSlot += 1;
  }
}

function getVisibleInventorySlotCount() {
  let lastOccupiedSlot = -1;
  for (let index = game.player.inventorySlots.length - 1; index >= 0; index -= 1) {
    if (game.player.inventorySlots[index]) {
      lastOccupiedSlot = index;
      break;
    }
  }
  return Math.min(
    game.player.inventorySlots.length,
    Math.max(getEquippedShipStats().inventoryStackCapacity, lastOccupiedSlot + 1)
  );
}

function getShipPart(itemId) {
  return Object.values(SHIP_PARTS).flat().find((part) => part.id === itemId) ?? null;
}

function getPropulsorAbilityProfile(partId) {
  if (partId === 'thruster-fuel') {
    return {
      peakMultiplier: 3,
      peakDuration: 4,
      decayDuration: 2,
      cooldown: 10,
    };
  }
  if (partId === 'thruster-electric') {
    return { peakMultiplier: 10, peakDuration: 1, decayDuration: 1, cooldown: 2 };
  }
  if (partId === 'thruster-ammonia') {
    return { peakMultiplier: 2.5, peakDuration: 3, decayDuration: 2, cooldown: 8 };
  }
  return null;
}

function getActivePropulsionBoostMultiplier() {
  const boost = game.player.propulsionBoost;
  if (!boost) return 1;
  const elapsed = game.time - boost.startedAt;
  if (elapsed < 0 || elapsed >= boost.peakDuration + boost.decayDuration) return 1;
  if (elapsed <= boost.peakDuration || boost.decayDuration <= 0) return boost.peakMultiplier;
  const decayProgress = (elapsed - boost.peakDuration) / boost.decayDuration;
  return 1 + (boost.peakMultiplier - 1) * (1 - decayProgress);
}

function activatePropulsorAbility() {
  if (game.scene !== 'space' || game.emergencyReturn) return;
  if (!isShipPartOperational('propulsor')) {
    setMessage('El propulsor está roto y no puede activar su habilidad.');
    return;
  }
  const partId = game.player.shipParts.propulsor;
  const profile = getPropulsorAbilityProfile(partId);
  if (!profile) return;
  if (game.time < game.player.propulsionAbilityReadyAt) {
    setMessage(`Propulsor recargando: ${Math.ceil(game.player.propulsionAbilityReadyAt - game.time)} s.`);
    return;
  }
  if (!getEquippedShipStats().canPropel) {
    setMessage('No tienes energía o combustible para activar el propulsor.');
    return;
  }
  game.player.propulsionBoost = { ...profile, startedAt: game.time, partId };
  game.player.propulsionAbilityReadyAt = game.time + profile.cooldown;
  setMessage(partId === 'thruster-fuel'
    ? 'Impulso de combustible: velocidad ×3 durante 4 s.'
    : partId === 'thruster-ammonia'
      ? 'Impulso de amoniaco: velocidad ×2.5 durante 3 s.'
      : 'Sobrecarga eléctrica: velocidad ×10 durante 1 s; desacelerará durante 1 s.');
}

const CENTER_HOMING_DURATION = 3;
const CENTER_HOMING_SHOTS = 3;
const CENTER_HOMING_RADIUS = CHUNK_SIZE * 2;
const CENTER_ABILITY_COOLDOWN = 10;
const HOMING_TURN_RATE = 1.8;

function findNearestHostileDrone(maxDistance, originX = game.player.x, originY = game.player.y) {
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const drone of game.hostileDrones) {
    if (drone.hp <= 0) continue;
    const distance = Math.hypot(drone.x - originX, drone.y - originY);
    if (distance <= nearestDistance) {
      nearest = drone;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function activateCenterAbility() {
  if (game.scene !== 'space' || game.emergencyReturn) return;
  if (!isShipPartOperational('center')) {
    setMessage('El centro de la nave está roto y no puede activar su habilidad.');
    return;
  }
  if (game.time < game.player.centerAbilityReadyAt) {
    setMessage(`Centro recargando: ${Math.ceil(game.player.centerAbilityReadyAt - game.time)} s.`);
    return;
  }
  game.player.centerHoming = {
    expiresAt: Infinity,
    shotsRemaining: CENTER_HOMING_SHOTS,
  };
  game.player.centerAbilityReadyAt = game.time + CENTER_ABILITY_COOLDOWN;
  setMessage('Centro activo: tus próximos 3 misiles buscarán enemigos dentro de un radio de 2 chunks.');
}

const SHIP_PART_BASE_HEALTH = { center: 120, propulsor: 85, leftWing: 60, rightWing: 60, tip: 50 };

function getShipPartMaxHealth(slot, partId = game.player.shipParts[slot]) {
  const part = getShipPart(partId);
  if (!part) return 0;
  return ((part.stats?.health ?? SHIP_PART_BASE_HEALTH[slot] ?? 50) + (part.stats?.maxHealth ?? 0)) * SHIP_HEALTH_SCALE;
}

function ensureShipPartHealth() {
  game.player.shipPartHealth ||= {};
  for (const slot of Object.keys(SHIP_PART_BASE_HEALTH)) {
    const partId = game.player.shipParts[slot];
    if (!partId || !getShipPart(partId)) {
      delete game.player.shipPartHealth[slot];
      continue;
    }
    const maxHealth = getShipPartMaxHealth(slot, partId);
    const saved = game.player.shipPartHealth[slot];
    if (!saved || saved.partId !== partId || !Number.isFinite(saved.hp)) {
      game.player.shipPartHealth[slot] = { partId, hp: maxHealth };
    } else {
      saved.hp = clamp(saved.hp, 0, maxHealth);
    }
  }
  return game.player.shipPartHealth;
}

function isShipPartOperational(slot) {
  const partId = game.player.shipParts[slot];
  if (!partId) return false;
  return (ensureShipPartHealth()[slot]?.hp ?? 0) > 0;
}

// Cápsulas de escape: la primera tiene vida; si la destruyen se activa la segunda, 10 veces más rápida,
// que se lleva todos los stacks del inventario excepto los primeros.
const ESCAPE_CAPSULE_HEALTH = 100;
const SECOND_CAPSULE_SPEED_MULTIPLIER = 10;
const SECOND_CAPSULE_KEPT_SLOTS = 3;

function activateEmergencyCapsule(cause = null) {
  if (game.emergencyReturn) return false;
  cancelEmergencyService('La solicitud de rescate se canceló al activar la cápsula.');
  game.emergencyReturn = true;
  game.emergencyReturnCause = cause;
  game.emergencyCapsule = { stage: 1, hp: ESCAPE_CAPSULE_HEALTH };
  game.pointer.followPlanet = null;
  game.pointer.moveTarget = null;
  return true;
}

// Elimina todos los stacks salvo los primeros espacios; las piezas equipadas en la nave se conservan.
function wipeInventoryAfterFirstSlots(keptSlots = SECOND_CAPSULE_KEPT_SLOTS) {
  const slots = game.player.inventorySlots;
  for (let index = keptSlots; index < slots.length; index += 1) {
    const item = slots[index];
    if (!item) continue;
    if (item.resourceKey) {
      removePriceLotsFromInventory(item.resourceKey, item.priceLots || [{
        unitPrice: item.unitPrice ?? RESOURCE_SELL_PRICES[item.resourceKey],
        count: item.count,
      }]);
      slots[index] = null;
    } else if (!isShipPartEquipped(item.id)) {
      slots[index] = null;
    }
  }
  if (!inventoryPanel.hidden) updateInventoryItemsGrid();
}

function damageEmergencyCapsule(damage) {
  const capsule = game.emergencyCapsule;
  if (!game.emergencyReturn || !capsule || capsule.stage !== 1) return;
  capsule.hp = Math.max(0, capsule.hp - damage);
  game.player.damageHudUntil = game.time + 5;
  markSpaceHudAction();
  if (capsule.hp > 0) {
    setCombatMessage(`¡Impacto en la cápsula! ${Math.ceil(capsule.hp)}/${ESCAPE_CAPSULE_HEALTH} HP.`);
    return;
  }
  capsule.stage = 2;
  capsule.hp = 0;
  wipeInventoryAfterFirstSlots();
  setCombatMessage(`¡Cápsula destruida! Segunda cápsula activada: perdiste el inventario salvo los ${SECOND_CAPSULE_KEPT_SLOTS} primeros espacios.`);
  updateHud();
  saveGameState();
}

function damageShipPart(slot, damage) {
  const health = ensureShipPartHealth()[slot];
  if (!health || health.hp <= 0) return null;
  health.hp = Math.max(0, health.hp - damage);
  game.player.damageHudUntil = game.time + 5;
  markSpaceHudAction();
  const part = getShipPart(health.partId);
  const maxHealth = getShipPartMaxHealth(slot, health.partId);
  if (!inventoryPanel.hidden && currentInventoryView === 'nave') renderShipWorkshop();
  updateShipStatsDisplay();
  saveGameState();
  if (slot === 'center' && health.hp <= 0) {
    if (game.emergencyReturn && game.emergencyReturnCause === 'tow') {
      game.emergencyReturnCause = 'tow-player-destroyed';
      game.emergencyCapsule = { stage: 1, hp: ESCAPE_CAPSULE_HEALTH };
      if (game.emergencyService?.type === 'tow') game.emergencyService.phase = 'returning';
    } else {
      activateEmergencyCapsule();
    }
    setMessage('¡Centro destruido! Regresando a Tierra en cápsula.');
  }
  return { part, hp: health.hp, maxHealth };
}

function damageEmergencyServiceShip(damage) {
  const service = game.emergencyService;
  const ship = service?.ship;
  if (!ship) return;
  ship.hp = Math.max(0, ship.hp - damage);
  if (ship.hp > 0) {
    setCombatMessage(`¡Impacto en la nave de apoyo! ${Math.ceil(ship.hp)}/${ship.stats.maxHealth} HP.`);
    saveGameState();
    return;
  }
  service.pilotCapsule = {
    x: ship.x,
    y: ship.y,
    velocityX: ship.velocityX,
    velocityY: ship.velocityY,
    speed: EMERGENCY_SERVICE_SPEED,
    angle: ship.angle,
    flameBend: 0,
  };
  service.ship = null;
  service.phase = 'pilot-escape';
  if (service.type === 'tow' && game.emergencyReturnCause === 'tow') {
    game.emergencyReturnCause = 'tow-support-destroyed';
    game.emergencyCapsule = { stage: 1, hp: ESCAPE_CAPSULE_HEALTH };
    setCombatMessage('¡Destruyeron la nave de remolque! Su piloto escapó; tu cápsula vuelve a Tierra.');
  } else {
    setCombatMessage('¡Nave de apoyo destruida! Su piloto escapó en una cápsula hacia Tierra.');
  }
  saveGameState();
}

function getItemDescription(item) {
  if (item.description) return item.description;
  if (item.resourceKey && RESOURCE_CATALOG[item.resourceKey]) {
    return `${RESOURCE_CATALOG[item.resourceKey].description} Precio base: ${RESOURCE_SELL_PRICES[item.resourceKey]} créditos. Apilable hasta ${MAX_ITEM_STACK} unidades.`;
  }

  const part = getShipPart(item.id);
  if (!part) return `Apilable hasta ${MAX_ITEM_STACK} unidades.`;

  const stats = part.stats ?? {};
  const effects = [];
  if (stats.inventoryStacks) {
    effects.push(`Capacidad de inventario: ${stats.inventoryStacks > 0 ? '+' : ''}${stats.inventoryStacks} stacks`);
  }
  if (stats.maxHealth) effects.push(`Vida máxima: +${stats.maxHealth}`);
  if (stats.health) effects.push(`Resistencia de la pieza: ${stats.health} HP`);
  if (stats.speedMultiplier && stats.speedMultiplier !== 1) {
    effects.push(`Velocidad: ×${stats.speedMultiplier}`);
  }
  if (stats.fuelConsumptionDistance) {
    effects.push(`Consume 1 combustible cada ${stats.fuelConsumptionDistance.toLocaleString()} unidades`);
  }
  if (stats.energyConsumptionDistance) {
    effects.push(`Consume 1 energía cada ${stats.energyConsumptionDistance.toLocaleString()} unidades`);
  }
  if (stats.weaponDamage) {
    const shots = stats.weaponShots ?? 1;
    effects.push(`Daño: ${stats.weaponDamage}${shots > 1 ? ` ×${shots}` : ''} por disparo · Enfriamiento: ${stats.weaponCooldown} s`);
  }
  if (stats.weaponPierce) effects.push('Los disparos atraviesan a los enemigos');
  if (part.id === 'thruster-fuel') {
    effects.push('Habilidad R: velocidad ×3 durante 4 s, luego disminuye suavemente durante 2 s · Enfriamiento: 10 s');
  } else if (part.id === 'thruster-electric') {
    effects.push('Habilidad R: velocidad ×10 durante 1 s; desacelera gradualmente durante 1 s');
  } else if (part.id === 'thruster-ammonia') {
    effects.push('Habilidad R: velocidad ×2.5 durante 3 s, luego disminuye suavemente durante 2 s · Enfriamiento: 8 s');
  }
  if (stats.solarEnergy) effects.push('Genera 1 stack de energía cada 2 minutos (máximo 3 stacks en el inventario)');
  return effects.length ? effects.join(' · ') : 'Pieza de nave sin efectos adicionales.';
}

function attachItemTooltip(slot, item, isEquipped = false) {
  const show = () => {
    inventoryTooltip.textContent = `${item.name}${item.count > 1 ? ` · ${item.count} unidades` : ''}${isEquipped ? ' · EQUIPADO' : ''}\n${getItemDescription(item)}`;
    inventoryTooltip.hidden = false;
    const rect = slot.getBoundingClientRect();
    const gap = 12;
    const tooltipWidth = inventoryTooltip.getBoundingClientRect().width;
    const preferredLeft = rect.right + tooltipWidth + gap <= window.innerWidth - 12
      ? rect.right + gap
      : rect.left - tooltipWidth - gap;
    const left = clamp(preferredLeft, 12, Math.max(12, window.innerWidth - tooltipWidth - 12));
    const top = clamp(rect.top, 12, Math.max(12, window.innerHeight - inventoryTooltip.offsetHeight - 12));
    inventoryTooltip.style.left = `${left}px`;
    inventoryTooltip.style.top = `${top}px`;
  };
  slot.addEventListener('mouseenter', show);
  slot.addEventListener('focus', show);
  slot.addEventListener('mouseleave', () => { inventoryTooltip.hidden = true; });
  slot.addEventListener('blur', () => { inventoryTooltip.hidden = true; });
}

function getInventoryUsedStackCount() {
  return game.player.inventorySlots.filter(Boolean).length;
}

function getAvailableResourceCapacity(resourceKey, unitPrice = RESOURCE_SELL_PRICES[resourceKey]) {
  normalizeInventoryLots();
  const nonResourceStacks = game.player.inventorySlots.filter(
    (item) => item && !item.resourceKey
  ).length;
  const resourceKeys = Object.keys(RESOURCE_CATALOG);
  const usedResourceStacks = resourceKeys.reduce(
    (total, key) => total + Math.ceil(game.player.inventory[key] / MAX_ITEM_STACK),
    0
  );
  const stackCapacity = getEquippedShipStats().inventoryStackCapacity;
  if (nonResourceStacks + usedResourceStacks > stackCapacity) {
    return 0;
  }
  const freeStacks = Math.max(
    0,
    stackCapacity - nonResourceStacks - usedResourceStacks
  );
  const resourceCount = game.player.inventory[resourceKey];
  const existingStackSpace = resourceCount > 0 ? (MAX_ITEM_STACK - (resourceCount % MAX_ITEM_STACK || MAX_ITEM_STACK)) : 0;
  return existingStackSpace + freeStacks * MAX_ITEM_STACK;
}

const EMERGENCY_DELIVERY_COST = 1000;
const EMERGENCY_TOW_MIN_COST = 500;
const EMERGENCY_TOW_MAX_COST = 5000;
const EMERGENCY_DELIVERY_STACKS = 3;
const EMERGENCY_SERVICE_SPEED = 1400;

function getEmergencyTowCost() {
  const solarPlanets = game.homeStar?.planets ?? [];
  const earth = solarPlanets.find(isHomeworld) ?? game.planets.find(isHomeworld);
  if (!earth) return EMERGENCY_TOW_MIN_COST;
  updatePlanetPositions();
  const moon = solarPlanets.find((planet) => planet.isMoon && planet.parent === earth);
  const outermostPlanet = solarPlanets
    .filter((planet) => !planet.isMoon && planet !== earth)
    .reduce((farthest, planet) => !farthest || planet.orbitRadius > farthest.orbitRadius ? planet : farthest, null);
  const moonDistance = moon ? Math.hypot(moon.x - earth.x, moon.y - earth.y) : 3000;
  const maximumDistance = outermostPlanet
    ? Math.hypot(outermostPlanet.x - earth.x, outermostPlanet.y - earth.y)
    : moonDistance;
  const playerDistance = Math.hypot(game.player.x - earth.x, game.player.y - earth.y);
  const progress = Math.max(0, Math.min(1, (playerDistance - moonDistance) / Math.max(1, maximumDistance - moonDistance)));
  const scaledCost = EMERGENCY_TOW_MIN_COST + progress * (EMERGENCY_TOW_MAX_COST - EMERGENCY_TOW_MIN_COST);
  return Math.round(scaledCost / 100) * 100;
}

function updateEmergencyTowCostLabel() {
  if (emergencyTowCostLabel) emergencyTowCostLabel.textContent = `${getEmergencyTowCost().toLocaleString()} créditos`;
}

function getEmergencyResourceKey() {
  const stats = getEquippedShipStats();
  return stats.isFuelPropulsor ? 'fuel' : stats.isElectricPropulsor ? 'energy' : null;
}

function hasFuelEmergency() {
  const stats = getEquippedShipStats();
  const resourceEmpty = (stats.isFuelPropulsor && game.player.inventory.fuel <= 0) ||
    (stats.isElectricPropulsor && game.player.inventory.energy <= 0);
  return game.scene === 'space' && !game.emergencyReturn && resourceEmpty;
}

function getEmergencyTravelSeconds() {
  const earth = game.homeStar?.planets.find(isHomeworld) ?? game.planets.find(isHomeworld);
  if (!earth) return 60;
  updatePlanetPositions();
  return Math.max(15, Math.ceil(Math.hypot(earth.x - game.player.x, earth.y - game.player.y) / EMERGENCY_SERVICE_SPEED));
}

function createEmergencyServiceShip(earth, targetX, targetY, travelSeconds) {
  const shipParts = {
    center: 'center-classic',
    propulsor: 'thruster-electric',
    leftWing: 'wing-fast',
    rightWing: 'wing-fast',
    tip: null,
  };
  const partStats = Object.fromEntries(
    Object.entries(shipParts).map(([slot, partId]) => [slot, getShipPart(partId)?.stats ?? {}])
  );
  const propulsor = getShipPart(shipParts.propulsor);
  const wingSpeedMultiplier = [partStats.leftWing, partStats.rightWing]
    .reduce((multiplier, stats) => multiplier * (stats.speedMultiplier ?? 1), 1);
  const stats = {
    maxSpeed: EMERGENCY_SERVICE_SPEED * wingSpeedMultiplier * (propulsor?.stats?.speedMultiplier ?? 1),
    acceleration: SHIP_ACCELERATION,
    maxHealth: Object.entries(shipParts).reduce(
      (total, [slot, partId]) => total + getShipPartMaxHealth(slot, partId), 0
    ),
    fuelConsumptionDistance: propulsor?.stats?.fuelConsumptionDistance ?? Infinity,
    energyConsumptionDistance: propulsor?.stats?.energyConsumptionDistance ?? Infinity,
    weaponDamage: 0,
    weaponCooldown: 1.1,
  };
  const ship = {
    x: earth.x + earth.radius + 28,
    y: earth.y,
    velocityX: 0,
    velocityY: 0,
    angle: 0,
    flameBend: 0,
    speed: stats.maxSpeed,
    stats,
    hp: stats.maxHealth,
    propulsionAbilityReadyAt: 0,
    propulsionBoost: null,
    shipParts,
  };
  ship.speed = stats.maxSpeed;
  ship.stats.maxSpeed = ship.speed;
  ship.angle = Math.atan2(targetY - ship.y, targetX - ship.x) + Math.PI / 2;
  return ship;
}

function formatEmergencyEta(seconds) {
  const remaining = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return minutes > 0 ? `${minutes} min ${String(secs).padStart(2, '0')} s` : `${secs} s`;
}

function cancelEmergencyService(message = 'Solicitud de ayuda cancelada.') {
  if (!game.emergencyService) return false;
  game.emergencyService = null;
  if (cancelEmergencyServiceButton) cancelEmergencyServiceButton.hidden = true;
  if (emergencyHelpStatus) emergencyHelpStatus.textContent = message;
  if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
  saveGameState();
  return true;
}

function updateEmergencyHelpPanel() {
  if (!emergencyHelpStatus) return;
  updateEmergencyTowCostLabel();
  const service = game.emergencyService;
  if (!service) {
    emergencyHelpStatus.textContent = 'Elige una opción. Las solicitudes se cobran al confirmarlas.';
    cancelEmergencyServiceButton.hidden = true;
    return;
  }
  if (service.type === 'tow' && service.phase === 'towing') {
    emergencyHelpStatus.textContent = 'La nave de rescate te está remolcando hacia Tierra.';
    cancelEmergencyServiceButton.hidden = true;
    return;
  }
  if (service.phase === 'returning') {
    emergencyHelpStatus.textContent = 'Entrega completada. La nave vuelve a Tierra.';
    cancelEmergencyServiceButton.hidden = true;
    return;
  }
  if (service.phase === 'pilot-escape') {
    emergencyHelpStatus.textContent = 'La nave fue destruida; el piloto escapa en una cápsula hacia Tierra.';
    cancelEmergencyServiceButton.hidden = true;
    return;
  }
  if (service.phase === 'waiting-space') {
    emergencyHelpStatus.textContent = 'La nave llegó. Libera espacio para descargar los 3 stacks.';
    cancelEmergencyServiceButton.hidden = false;
    return;
  }
  emergencyHelpStatus.textContent = `Una nave viene desde Tierra. Tiempo restante: ${formatEmergencyEta(service.arrivalAt - game.time)}.`;
  cancelEmergencyServiceButton.hidden = false;
}

function startEmergencyService(type) {
  if (!hasFuelEmergency()) {
    emergencyHelpStatus.textContent = 'La ayuda solo está disponible cuando te quedas sin combustible en el espacio.';
    return;
  }
  if (game.emergencyService) {
    emergencyHelpStatus.textContent = 'Ya hay una nave de rescate en camino.';
    return;
  }
  const cost = type === 'delivery' ? EMERGENCY_DELIVERY_COST : getEmergencyTowCost();
  if (game.player.credits < cost) {
    emergencyHelpStatus.textContent = `Necesitas ${cost.toLocaleString()} créditos; tienes ${game.player.credits.toLocaleString()}.`;
    return;
  }
  const resourceKey = getEmergencyResourceKey();
  const deliveryCount = EMERGENCY_DELIVERY_STACKS * MAX_ITEM_STACK;
  if (type === 'delivery' && (!resourceKey || getAvailableResourceCapacity(resourceKey) < deliveryCount)) {
    emergencyHelpStatus.textContent = 'Necesitas espacio libre para recibir los 3 stacks.';
    return;
  }
  game.player.credits -= cost;
  const travelSeconds = getEmergencyTravelSeconds();
  const earth = game.homeStar?.planets.find(isHomeworld) ?? game.planets.find(isHomeworld);
  const ship = earth
    ? createEmergencyServiceShip(earth, game.player.x, game.player.y, travelSeconds)
    : null;
  game.emergencyService = {
    type,
    phase: 'inbound',
    resourceKey,
    startedAt: game.time,
    arrivalAt: game.time + travelSeconds,
    originX: earth?.x ?? game.player.x,
    originY: earth?.y ?? game.player.y,
    targetX: game.player.x,
    targetY: game.player.y,
    ship,
  };
  updateHud();
  updateEmergencyHelpPanel();
  saveGameState();
  setMessage(type === 'delivery'
    ? 'Combustible express solicitado. Una nave salió de Tierra.'
    : 'Remolque solicitado. Una nave de rescate salió de Tierra.');
  toggleInventory(false);
}

function activateFuelEscapeCapsule() {
  if (!hasFuelEmergency()) return;
  cancelEmergencyService('La solicitud de combustible se canceló al activar la cápsula.');
  activateEmergencyCapsule('fuel');
  game.emergencyCapsule = { stage: 2, hp: 0 };
  wipeInventoryAfterFirstSlots();
  setCombatMessage(`¡Cápsula de escape activada! Perdiste el inventario salvo los ${SECOND_CAPSULE_KEPT_SLOTS} primeros espacios.`);
  updateEmergencyFuelStatus();
  saveGameState();
  toggleInventory(false);
}

function updateEmergencyFuelStatus() {
  const active = hasFuelEmergency();
  const resourceKey = getEmergencyResourceKey();
  fuelEmergencyNotice.textContent = resourceKey === 'energy'
    ? '¡SIN ENERGÍA! Abre el inventario y entra en ¡Ayuda!'
    : '¡SIN COMBUSTIBLE! Abre el inventario y entra en ¡Ayuda!';
  fuelEmergencyNotice.hidden = !active;
  emergencyHelpOption.hidden = !active;
  if (!active && !inventoryPanel.hidden && currentInventoryView === 'help' && !game.emergencyService) {
    showInventoryView(lastInventoryTab === 'help' ? 'objetos' : lastInventoryTab);
  }
  if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
}

function steerEmergencyServiceShip(ship, targetX, targetY, dt, arrivalDistance = 68, targetVelocity = { x: 0, y: 0 }) {
  if (!ship) return true;
  const dx = targetX - ship.x;
  const dy = targetY - ship.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= arrivalDistance) {
    ship.velocityX = 0;
    ship.velocityY = 0;
    updateShipFlameBend(ship, 0, dt);
    return true;
  }
  const directionX = dx / distance;
  const directionY = dy / distance;
  const profile = getPropulsorAbilityProfile(ship.shipParts?.propulsor);
  if (profile && distance > arrivalDistance + 300 && game.time >= (ship.propulsionAbilityReadyAt || 0) && !ship.propulsionBoost) {
    ship.propulsionBoost = { ...profile, startedAt: game.time };
    ship.propulsionAbilityReadyAt = game.time + profile.cooldown;
  }
  let boostMultiplier = 1;
  if (ship.propulsionBoost) {
    const boost = ship.propulsionBoost;
    const elapsed = game.time - boost.startedAt;
    if (elapsed < boost.peakDuration) {
      boostMultiplier = boost.peakMultiplier;
    } else if (elapsed < boost.peakDuration + boost.decayDuration && boost.decayDuration > 0) {
      boostMultiplier = 1 + (boost.peakMultiplier - 1) * (1 - (elapsed - boost.peakDuration) / boost.decayDuration);
    } else {
      ship.propulsionBoost = null;
    }
  }
  const currentMaxSpeed = (ship.stats?.maxSpeed ?? ship.speed) * boostMultiplier;
  const desiredSpeed = Math.min(currentMaxSpeed, Math.max(30, (distance - arrivalDistance) * 1.5));
  // Keep the service ship's velocity relative to the moving target. Earth
  // orbits the star, so steering toward its position alone can leave the ship
  // matching Earth's orbital speed without ever closing the final distance.
  const desiredVelocityX = targetVelocity.x + directionX * desiredSpeed;
  const desiredVelocityY = targetVelocity.y + directionY * desiredSpeed;
  let changeX = desiredVelocityX - ship.velocityX;
  let changeY = desiredVelocityY - ship.velocityY;
  const changeLength = Math.hypot(changeX, changeY);
  const maxChange = currentMaxSpeed * 2.5 * dt;
  if (changeLength > maxChange) {
    changeX = (changeX / changeLength) * maxChange;
    changeY = (changeY / changeLength) * maxChange;
  }
  ship.velocityX += changeX;
  ship.velocityY += changeY;
  updateShipHeadingFromVelocity(ship, 'angle', dt);
  ship.x += ship.velocityX * dt;
  ship.y += ship.velocityY * dt;
  return Math.hypot(targetX - ship.x, targetY - ship.y) <= arrivalDistance;
}

function updateEmergencyService(dt) {
  const service = game.emergencyService;
  if (!service) return;
  if (game.emergencyReturn && service.type === 'delivery' && !['returning', 'pilot-escape'].includes(service.phase)) {
    cancelEmergencyService('La entrega se canceló porque activaste la cápsula.');
    return;
  }
  const earth = game.homeStar?.planets.find(isHomeworld) ?? game.planets.find(isHomeworld);
  if (!service.ship && service.phase !== 'pilot-escape' && earth) {
    service.ship = createEmergencyServiceShip(earth, game.player.x, game.player.y, Math.max(15, service.arrivalAt - service.startedAt));
  }
  if (service.phase === 'pilot-escape') {
    if (earth && steerEmergencyServiceShip(service.pilotCapsule, earth.x, earth.y, dt, earth.radius + 150)) {
      game.emergencyService = null;
      saveGameState();
      return;
    }
    if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
    return;
  }
  if (service.phase === 'towing') {
    if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
    return;
  }
  if (service.phase === 'returning') {
    if (earth && steerEmergencyServiceShip(service.ship, earth.x, earth.y, dt, earth.radius + 150, getPlanetVelocity(earth))) {
      game.emergencyService = null;
      saveGameState();
      return;
    }
    if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
    return;
  }
  const arrivalDistance = service.type === 'tow' ? 26 : 68;
  const hasReachedPlayer = steerEmergencyServiceShip(service.ship, game.player.x, game.player.y, dt, arrivalDistance);
  if (!hasReachedPlayer) {
    if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
    return;
  }
  if (service.type === 'tow') {
    service.phase = 'towing';
    game.emergencyReturn = true;
    game.emergencyReturnCause = 'tow';
    game.emergencyCapsule = null;
    game.pointer.followPlanet = null;
    game.pointer.moveTarget = null;
    setMessage('¡La nave de rescate te enganchó! Rumbo a Tierra.');
    saveGameState();
    return;
  }
  const deliveryCount = EMERGENCY_DELIVERY_STACKS * MAX_ITEM_STACK;
  if (getAvailableResourceCapacity(service.resourceKey) < deliveryCount) {
    service.phase = 'waiting-space';
    if (!inventoryPanel.hidden && currentInventoryView === 'help') updateEmergencyHelpPanel();
    return;
  }
  addResourceToInventory(service.resourceKey, deliveryCount);
  const deliveredName = RESOURCE_CATALOG[service.resourceKey]?.name ?? 'combustible';
  service.phase = 'returning';
  service.returningAt = game.time;
  updateInventoryItemsGrid();
  updateShipStatsDisplay();
  updateEmergencyFuelStatus();
  setMessage(`¡Entrega recibida! La nave dejó 3 stacks de ${deliveredName} y vuelve a Tierra.`);
  saveGameState();
}

function getAvailableItemCapacity(item) {
  compactInventorySlotsToCapacity();
  const capacity = Math.min(game.player.inventorySlots.length, getEquippedShipStats().inventoryStackCapacity);
  const slots = game.player.inventorySlots.slice(0, capacity);
  const existingStackSpace = slots.reduce((total, target) =>
    itemsCanStack(target, item) ? total + MAX_ITEM_STACK - target.count : total, 0);
  const emptyStacks = slots.filter((target) => !target).length;
  return existingStackSpace + emptyStacks * MAX_ITEM_STACK;
}

function addItemToInventory(item, count) {
  compactInventorySlotsToCapacity();
  const capacity = Math.min(game.player.inventorySlots.length, getEquippedShipStats().inventoryStackCapacity);
  let remaining = count;
  for (let index = 0; index < capacity && remaining > 0; index += 1) {
    const target = game.player.inventorySlots[index];
    if (!itemsCanStack(target, item)) continue;
    const moved = Math.min(remaining, MAX_ITEM_STACK - target.count);
    target.count += moved;
    remaining -= moved;
  }
  for (let index = 0; index < capacity && remaining > 0; index += 1) {
    if (game.player.inventorySlots[index]) continue;
    const moved = Math.min(remaining, MAX_ITEM_STACK);
    game.player.inventorySlots[index] = { ...item, count: moved };
    remaining -= moved;
  }
  return count - remaining;
}

function hasInventoryItem(itemId) {
  return game.player.inventorySlots.some((item) => item?.id === itemId && item.count > 0);
}

function equipHoverboard() {
  if (game.scene !== 'surface' || !game.surface) {
    setMessage('El hoverboard solo se puede equipar en un planeta.');
    return false;
  }
  if (!hasInventoryItem(HOVERBOARD_ITEM_ID)) return false;
  const board = game.surface.hoverboard ?? (game.surface.hoverboard = {
    deployed: false,
    x: game.surface.x,
    y: game.surface.y,
    spawnUntil: 0,
    mountUntil: 0,
  });
  if (game.player.hoverboardEquipped) {
    return putHoverboardOnGround();
  }
  if (board.deployed) {
    return false;
  }
  if (board.spawnUntil > game.time) {
    return false;
  }
  board.spawnUntil = game.time + 3;
  return true;
}

function saveSurfaceHoverboardState() {
  const board = game.surface?.hoverboard;
  if (!board || !game.surface?.planet) return;
  game.player.hoverboardWorldStates[getPlanetResourceStateKey(game.surface.planet)] = {
    deployed: Boolean(board.deployed),
    x: wrapSurfaceCoordinate(board.x),
    y: wrapSurfaceCoordinate(board.y),
  };
}

function putHoverboardOnGround() {
  if (!game.surface || !game.player.hoverboardEquipped) return false;
  const board = game.surface.hoverboard ?? (game.surface.hoverboard = {
    deployed: false,
    x: game.surface.x,
    y: game.surface.y,
    spawnUntil: 0,
    mountUntil: 0,
  });
  board.deployed = true;
  board.x = game.surface.x;
  board.y = game.surface.y;
  board.spawnUntil = 0;
  board.mountUntil = 0;
  game.player.hoverboardEquipped = false;
  saveSurfaceHoverboardState();
  updateInventoryItemsGrid();
  updateSurfaceAbilityBar();
  saveGameState();
  return true;
}

function beginHoverboardMount() {
  const board = game.surface?.hoverboard;
  if (!board?.deployed) return false;
  if (board.mountUntil > game.time) {
    return true;
  }
  board.mountUntil = game.time + 1.5;
  return true;
}

function updateSurfaceHoverboard() {
  if (game.scene !== 'surface' || !game.surface?.hoverboard) return;
  const board = game.surface.hoverboard;
  if (board.spawnUntil > 0 && game.time >= board.spawnUntil) {
    board.spawnUntil = 0;
    const facingOffset = {
      up: { x: 0, y: -1 }, right: { x: 1, y: 0 },
      down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
    }[game.surface.facing] ?? { x: 1, y: 0 };
    const spawnOffsets = [
      facingOffset,
      { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
    ];
    const spawnOffset = spawnOffsets.find((offset) => !isSurfaceTileBlocked(
      wrapSurfaceCoordinate(game.surface.x + offset.x * SURFACE_TILE),
      wrapSurfaceCoordinate(game.surface.y + offset.y * SURFACE_TILE),
      game.surface.x,
      game.surface.y
    )) ?? { x: 1, y: 0 };
    board.deployed = true;
    board.x = wrapSurfaceCoordinate(game.surface.x + spawnOffset.x * SURFACE_TILE);
    board.y = wrapSurfaceCoordinate(game.surface.y + spawnOffset.y * SURFACE_TILE);
    game.player.hoverboardEquipped = false;
    saveSurfaceHoverboardState();
    updateInventoryItemsGrid();
    updateSurfaceAbilityBar();
    saveGameState();
  }
  if (board.mountUntil > 0) {
    if (getSurfaceDistance(game.surface.x, game.surface.y, board.x, board.y) > SURFACE_TILE * 2) {
      board.mountUntil = 0;
      return;
    }
    if (game.time >= board.mountUntil) {
      board.mountUntil = 0;
      board.deployed = false;
      game.player.hoverboardEquipped = true;
      saveSurfaceHoverboardState();
      updateInventoryItemsGrid();
      updateSurfaceAbilityBar();
      saveGameState();
    }
  }
}

function isSurfaceUsableItem(itemId) {
  return itemId === HOVERBOARD_ITEM_ID || itemId === REGOLITO_GUN_ITEM_ID || itemId === COBALTO_KNIFE_ITEM_ID;
}

function getSurfaceUsableItem(itemId) {
  if (itemId === HOVERBOARD_ITEM_ID) return HOVERBOARD_ITEM;
  if (itemId === REGOLITO_GUN_ITEM_ID) return REGOLITO_GUN_ITEM;
  if (itemId === COBALTO_KNIFE_ITEM_ID) return COBALTO_KNIFE_ITEM;
  return null;
}

function getEquippedSurfaceGun() {
  return game.player.surfaceEquipment.includes(REGOLITO_GUN_ITEM_ID)
    ? REGOLITO_GUN_ITEM_ID
    : null;
}

function isSurfaceItemEquipped(itemId) {
  return Array.isArray(game.player.surfaceEquipment) && game.player.surfaceEquipment.includes(itemId);
}

function toggleSurfaceEquipment(itemId) {
  if (!isSurfaceUsableItem(itemId)) return false;
  if (game.scene !== 'surface' || !game.surface) {
    setMessage('Solo puedes equipar objetos utilizables mientras estás en un planeta.');
    return false;
  }
  const slots = game.player.surfaceEquipment;
  const equippedIndex = slots.indexOf(itemId);
  if (equippedIndex >= 0) {
    slots[equippedIndex] = null;
    if (itemId === HOVERBOARD_ITEM_ID && game.player.hoverboardEquipped) {
      putHoverboardOnGround();
    }
    setMessage(`${getSurfaceUsableItem(itemId).name} quitado del equipo.`);
  } else {
    const emptyIndex = slots.findIndex((slot) => !slot);
    if (emptyIndex < 0) {
      setMessage('Los tres espacios de objetos están ocupados. Quita uno antes de equipar otro.');
      return false;
    }
    if (!hasInventoryItem(itemId)) return false;
    slots[emptyIndex] = itemId;
    setMessage(`${getSurfaceUsableItem(itemId).name} equipado en ${SURFACE_ABILITY_KEYS[emptyIndex].toUpperCase()}.`);
  }
  updateInventoryItemsGrid();
  updateSurfaceAbilityBar();
  saveGameState();
  return true;
}

function activateSurfaceAbility(slotIndex) {
  if (game.scene !== 'surface' || !Number.isInteger(slotIndex)) return false;
  const itemId = game.player.surfaceEquipment[slotIndex];
  if (!itemId) return false;
  if (game.player.hoverboardEquipped && itemId !== HOVERBOARD_ITEM_ID) return false;
  if (itemId === HOVERBOARD_ITEM_ID) return equipHoverboard();
  if (itemId === REGOLITO_GUN_ITEM_ID) return fireSurfaceGun();
  if (itemId === COBALTO_KNIFE_ITEM_ID) return useCobaltoKnife();
  return false;
}

function selectSurfaceAbility(slotIndex) {
  if (game.scene !== 'surface' || !Number.isInteger(slotIndex)) return false;
  const itemId = game.player.surfaceEquipment[slotIndex];
  if (!itemId) return false;
  if (game.player.hoverboardEquipped && (itemId === REGOLITO_GUN_ITEM_ID || itemId === COBALTO_KNIFE_ITEM_ID)) {
    selectedSurfaceAbilitySlot = null;
    updateSurfaceAbilityBar();
    setMessage('No puedes seleccionar armas mientras vas montado en el hoverboard.');
    return false;
  }
  if (itemId === REGOLITO_GUN_ITEM_ID || itemId === COBALTO_KNIFE_ITEM_ID) {
    selectedSurfaceAbilitySlot = slotIndex;
    updateSurfaceAbilityBar();
    setMessage(`${getSurfaceUsableItem(itemId).name} seleccionada. Apunta y haz clic para atacar.`);
    return true;
  }
  selectedSurfaceAbilitySlot = null;
  updateSurfaceAbilityBar();
  return activateSurfaceAbility(slotIndex);
}

function getSurfaceFacingTowardScreenPosition(position) {
  const targetX = wrapSurfaceCoordinate(game.surface.x + (position.x - game.width / 2) / playerZoom);
  const targetY = wrapSurfaceCoordinate(game.surface.y + (position.y - game.height / 2) / playerZoom);
  const dx = getSurfaceAxisDelta(targetX, game.surface.x);
  const dy = getSurfaceAxisDelta(targetY, game.surface.y);
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return game.surface.facing;
  return Math.abs(dx) >= Math.abs(dy)
    ? (dx < 0 ? 'left' : 'right')
    : (dy < 0 ? 'up' : 'down');
}

function useCobaltoKnife(facing = game.surface?.facing) {
  if (
    game.scene !== 'surface' || !game.surface || game.player.hoverboardEquipped || !isSurfaceItemEquipped(COBALTO_KNIFE_ITEM_ID) ||
    !inventoryPanel.hidden || confirmState || earthWandererDialogOpen ||
    game.surface.weaponCooldown > 0
  ) return false;

  const directions = {
    up: { x: 0, y: -1 }, right: { x: 1, y: 0 },
    down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
  };
  game.surface.facing = facing;
  const direction = directions[facing] ?? directions.down;
  // El tajo debe usar exclusivamente su pose: no heredar un frame de disparo anterior.
  game.surface.shotUntil = 0;
  game.surface.gunFiredUntil = 0;
  game.surface.knifeSlashUntil = game.time + COBALTO_KNIFE_SWING_DURATION;
  game.surface.knifeSlashFacing = facing;
  game.surface.weaponCooldown = 0.16;

  const target = game.martianEnemies
    .map((enemy) => {
      const dx = getSurfaceAxisDelta(enemy.x, game.surface.x);
      const dy = getSurfaceAxisDelta(enemy.y, game.surface.y);
      const forwardDistance = dx * direction.x + dy * direction.y;
      const sideDistance = Math.abs(dx * direction.y - dy * direction.x);
      return { enemy, forwardDistance, sideDistance };
    })
    .filter(({ forwardDistance, sideDistance }) =>
      forwardDistance > 0 && forwardDistance <= COBALTO_KNIFE_RANGE && sideDistance <= SURFACE_TILE * 0.7
    )
    .sort((first, second) => first.forwardDistance - second.forwardDistance)[0]?.enemy;
  if (target) {
    damageMartianEnemy(target, 1);
  } else if (isHomeworld(game.surface.planet) && game.earthWanderer) {
    const dx = getSurfaceAxisDelta(game.earthWanderer.x, game.surface.x);
    const dy = getSurfaceAxisDelta(game.earthWanderer.y, game.surface.y);
    const forwardDistance = dx * direction.x + dy * direction.y;
    const sideDistance = Math.abs(dx * direction.y - dy * direction.x);
    if (forwardDistance > 0 && forwardDistance <= COBALTO_KNIFE_RANGE && sideDistance <= SURFACE_TILE * 0.7) {
      damageEarthWanderer(game.earthWanderer, 1);
    }
  }
  return true;
}

function fireSurfaceGun(facing = game.surface?.facing) {
  if (
    game.scene !== 'surface' || !game.surface || game.player.hoverboardEquipped || !getEquippedSurfaceGun() ||
    !inventoryPanel.hidden || confirmState || earthWandererDialogOpen
  ) return false;
  if (game.player.regolitoGunAmmo <= 0) return false;
  if (game.surface.weaponCooldown > 0) return false;
  const directions = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };
  game.surface.facing = facing;
  const direction = directions[facing] ?? directions.down;
  const gunPlacement = SURFACE_GUN_PLACEMENTS[facing] ?? SURFACE_GUN_PLACEMENTS.down;
  game.surfaceProjectiles.push({
    owner: 'player',
    damage: 1,
    x: wrapSurfaceCoordinate(game.surface.x + gunPlacement.x + direction.x * 27),
    y: wrapSurfaceCoordinate(game.surface.y + gunPlacement.y + direction.y * 27),
    vx: direction.x * 1440,
    vy: direction.y * 1440,
    remainingDistance: CHUNK_SIZE * 4,
  });
  game.player.regolitoGunAmmo -= 1;
  game.surface.weaponCooldown = 0.22;
  game.surface.shotUntil = game.time + 0.18;
  game.surface.gunFiredUntil = game.time + 0.18;
  game.surface.ammoHudActiveUntil = game.time + 5;
  saveGameState();
  return true;
}

function consumeRegolitoGunHalfUnit() {
  if (game.player.regolitoGunHalfCredit === 1) {
    game.player.regolitoGunHalfCredit = 0;
    return true;
  }
  if ((game.player.inventory.regolith ?? 0) < 1) return false;
  if (removeResourceFromInventory('regolith', 1) !== 1) return false;
  // Un regolito pagado deja medio punto reservado para la siguiente bala.
  game.player.regolitoGunHalfCredit = 1;
  return true;
}

function reloadRegolitoGun() {
  if (
    game.scene !== 'surface' || !game.surface || game.player.hoverboardEquipped || !getEquippedSurfaceGun() ||
    game.player.regolitoGunReloadUntil > game.time
  ) return false;
  if (game.player.regolitoGunAmmo >= REGOLITO_GUN_MAGAZINE_SIZE) return false;
  const missingAmmo = REGOLITO_GUN_MAGAZINE_SIZE - game.player.regolitoGunAmmo;
  const availableHalfUnits = (game.player.inventory.regolith ?? 0) * 2 + game.player.regolitoGunHalfCredit;
  const ammoToLoad = Math.min(missingAmmo, Math.floor(availableHalfUnits));
  if (ammoToLoad <= 0) {
    setMessage('Necesitas regolito para recargar.');
    return false;
  }
  for (let bullet = 0; bullet < ammoToLoad; bullet += 1) {
    if (!consumeRegolitoGunHalfUnit()) break;
  }
  game.player.regolitoGunReloadAmmo = ammoToLoad;
  game.player.regolitoGunReloadStartedAt = game.time;
  game.player.regolitoGunReloadUntil = game.time + REGOLITO_GUN_RELOAD_SECONDS;
  setMessage('Recargando pistola de regolito…');
  saveGameState();
  return true;
}

function updateRegolitoGunReload() {
  if (!game.player.regolitoGunReloadUntil) return;
  if (game.time < game.player.regolitoGunReloadUntil) {
    if (game.surface) {
      const elapsed = Math.max(0, game.time - game.player.regolitoGunReloadStartedAt);
      const phase = elapsed % 1;
      game.surface.shotUntil = phase < 0.25 ? game.time + (0.25 - phase) : 0;
    }
    return;
  }
  game.player.regolitoGunAmmo = Math.min(
    REGOLITO_GUN_MAGAZINE_SIZE,
    game.player.regolitoGunAmmo + game.player.regolitoGunReloadAmmo
  );
  game.player.regolitoGunReloadUntil = 0;
  game.player.regolitoGunReloadAmmo = 0;
  game.player.regolitoGunReloadStartedAt = 0;
  setMessage('Pistola recargada.');
  saveGameState();
}

function getEquippedShipStats() {
  ensureShipPartHealth();
  const { center, propulsor, leftWing, rightWing } = game.player.shipParts;
  const equippedCenter = isShipPartOperational('center') ? getShipPart(center) : null;
  const equippedPropulsor = isShipPartOperational('propulsor') ? getShipPart(propulsor) : null;
  const equippedTip = isShipPartOperational('tip') ? getShipPart(game.player.shipParts.tip) : null;
  const equippedWings = [
    isShipPartOperational('leftWing') ? getShipPart(leftWing) : null,
    isShipPartOperational('rightWing') ? getShipPart(rightWing) : null,
  ].filter(Boolean);
  const equippedParts = [equippedCenter, equippedPropulsor, ...equippedWings, equippedTip].filter(Boolean);
  const hasSolarPanels = equippedWings.some(
    (part) => part.stats?.solarEnergy
  );
  const isFuelPropulsor = Boolean(equippedPropulsor?.stats?.fuelConsumptionDistance);
  const isElectricPropulsor = Boolean(equippedPropulsor?.stats?.energyConsumptionDistance);
  const wingSpeedMultiplier = equippedWings.reduce(
    (multiplier, part) => multiplier * (part.stats?.speedMultiplier ?? 1),
    1
  );

  return {
    maxSpeed: equippedPropulsor
      ? game.player.speed * wingSpeedMultiplier * (equippedPropulsor.stats?.speedMultiplier ?? 1) * getActivePropulsionBoostMultiplier()
      : 0,
    inventoryStackCapacity: Math.max(
      1,
      BASE_INVENTORY_STACK_CAPACITY +
        equippedParts.reduce((capacity, part) => capacity + (part.stats?.inventoryStacks ?? 0), 0)
    ),
    maxHealth: Object.keys(SHIP_PART_BASE_HEALTH).reduce(
      (total, slot) => total + getShipPartMaxHealth(slot), 0
    ),
    currentHealth: Object.keys(SHIP_PART_BASE_HEALTH).reduce(
      (total, slot) => total + (game.player.shipPartHealth[slot]?.hp ?? 0), 0
    ),
    fuelConsumptionDistance:
      equippedPropulsor?.stats?.fuelConsumptionDistance ?? Infinity,
    energyConsumptionDistance:
      equippedPropulsor?.stats?.energyConsumptionDistance ?? Infinity,
    hasSolarPanels,
    isFuelPropulsor,
    isElectricPropulsor,
    canPropel: Boolean(
      equippedPropulsor &&
      (isFuelPropulsor
        ? game.player.inventory.fuel > 0
        : !isElectricPropulsor || game.player.inventory.energy > 0)
    ),
  };
}

function updateShipStatsDisplay() {
  const stats = getEquippedShipStats();
  shipStats.textContent = [
    `Velocidad máxima: ${Math.round(stats.maxSpeed)}`,
    `Integridad de la nave: ${stats.currentHealth}/${stats.maxHealth} HP`,
    `Combustible: ${game.player.inventory.fuel}`,
    `Capacidad de stacks: ${getInventoryUsedStackCount()}/${stats.inventoryStackCapacity}`,
  ].join('\n');
}

function updateSolarPanels(dt) {
  if (!getEquippedShipStats().hasSolarPanels) return;
  // Con 3 stacks de energía el panel deja de cargar; el progreso queda donde estaba.
  if (game.player.inventory.energy >= SOLAR_PANEL_MAX_ENERGY) return;
  game.player.solarCharge = Math.min(SOLAR_PANEL_INTERVAL, game.player.solarCharge + dt);
  if (game.player.solarCharge < SOLAR_PANEL_INTERVAL) return;
  const amount = Math.min(
    MAX_ITEM_STACK,
    SOLAR_PANEL_MAX_ENERGY - game.player.inventory.energy,
    getAvailableResourceCapacity('energy')
  );
  // Sin espacio en el inventario la carga espera completa hasta que se libere un stack.
  if (amount < 1) return;
  addResourceToInventory('energy', amount);
  game.player.solarCharge = 0;
  updateInventoryItemsGrid();
  updateShipStatsDisplay();
  setMessage(`Paneles solares: +${amount} de energía`);
}

function consumePropulsionForDistance(distance) {
  const stats = getEquippedShipStats();
  const consumptionDistance = stats.isFuelPropulsor
    ? stats.fuelConsumptionDistance
    : stats.isElectricPropulsor
      ? stats.energyConsumptionDistance
      : Infinity;
  if (!Number.isFinite(consumptionDistance) || distance <= 0) {
    return;
  }

  game.player.propulsionDistance += distance;
  let resourcesConsumed = false;
  while (game.player.propulsionDistance >= consumptionDistance) {
    game.player.propulsionDistance -= consumptionDistance;
    const resourceKey = stats.isFuelPropulsor ? 'fuel' : 'energy';
    if (game.player.inventory[resourceKey] <= 0) {
      game.player.propulsionDistance = 0;
      break;
    }
    removeResourceFromInventory(resourceKey, 1);
    resourcesConsumed = true;
  }

  if (resourcesConsumed) {
    updateInventoryItemsGrid();
    updateShipStatsDisplay();
  }
}

function equipShipPart(partId) {
  if (game.scene !== 'surface') {
    setMessage('Solo puedes cambiar piezas mientras estás en un planeta.');
    return false;
  }
  if (!hasInventoryItem(partId)) {
    return false;
  }

  const group = Object.entries(SHIP_PARTS).find(([, parts]) =>
    parts.some((part) => part.id === partId)
  );
  if (!group) {
    return false;
  }

  const [groupKey] = group;
  if (groupKey === 'wing') {
    game.player.shipParts.leftWing = partId;
    game.player.shipParts.rightWing = partId;
  } else {
    game.player.shipParts[groupKey] = partId;
  }
  ensureShipPartHealth();
  return true;
}

function renderShipWorkshop() {
  shipPartsList.replaceChildren();
  const groups = [
    { key: 'center', title: 'Centro' },
    { key: 'propulsor', title: 'Propulsor' },
    { key: 'wing', title: 'Alas (par)' },
    { key: 'tip', title: 'Punta' },
  ];

  for (const group of groups) {
    const section = document.createElement('section');
    section.className = 'ship-part-group';
    const heading = document.createElement('h2');
    heading.className = 'ship-part-title';
    heading.textContent = group.title;
    section.append(heading);

    for (const part of SHIP_PARTS[group.key]) {
      const equippedIds = group.key === 'wing'
        ? [game.player.shipParts.leftWing, game.player.shipParts.rightWing]
        : [game.player.shipParts[group.key]];
      const isEquipped = equippedIds.includes(part.id);
      const isOwned = hasInventoryItem(part.id);
      if (!isOwned) continue;
      const button = document.createElement('button');
      button.className = 'ship-part-option';
      button.type = 'button';
      let healthLabel = '';
      if (isEquipped && group.key === 'wing') {
        const health = ensureShipPartHealth();
        healthLabel = ` · Izq. ${Math.ceil(health.leftWing?.hp ?? 0)}/${getShipPartMaxHealth('leftWing')} · Der. ${Math.ceil(health.rightWing?.hp ?? 0)}/${getShipPartMaxHealth('rightWing')} HP`;
      } else if (isEquipped) {
        const health = ensureShipPartHealth()[group.key];
        healthLabel = ` · ${Math.ceil(health?.hp ?? 0)}/${getShipPartMaxHealth(group.key)} HP`;
      }
      button.textContent = isEquipped
        ? `${part.name} · EQUIPADO${healthLabel}`
        : game.scene === 'surface' ? part.name : `${part.name} · ATERRIZA PARA CAMBIAR`;
      button.setAttribute('aria-pressed', String(isEquipped));
      button.disabled = isEquipped || !isOwned || game.scene !== 'surface';
      button.addEventListener('click', () => {
        equipShipPart(part.id);
        updateInventoryItemsGrid();
        renderShipWorkshop();
        saveGameState();
      });
      section.append(button);
    }

    const equippedKey = group.key === 'wing' ? 'leftWing' : group.key;
    if (game.player.shipParts[equippedKey]) {
      const removeButton = document.createElement('button');
      removeButton.className = 'ship-remove-part';
      removeButton.type = 'button';
      removeButton.textContent = `Quitar ${group.title.toLowerCase()}`;
      removeButton.disabled = game.scene !== 'surface';
      removeButton.addEventListener('click', () => {
        if (game.scene !== 'surface') {
          setMessage('Solo puedes cambiar piezas mientras estás en un planeta.');
          return;
        }
        if (group.key === 'wing') {
          game.player.shipParts.leftWing = null;
          game.player.shipParts.rightWing = null;
        } else {
          game.player.shipParts[group.key] = null;
        }
        ensureShipPartHealth();
        renderShipWorkshop();
        saveGameState();
      });
      section.append(removeButton);
    }
    shipPartsList.append(section);
  }

  const colorSection = document.createElement('section');
  colorSection.className = 'ship-part-group';
  const colorTitle = document.createElement('h2');
  colorTitle.className = 'ship-part-title';
  colorTitle.textContent = 'Player Color';
  const colorRow = document.createElement('div');
  colorRow.className = 'player-color-row';
  const swatch = document.createElement('span');
  swatch.className = 'player-color-swatch';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '359';
  slider.step = '1';
  slider.className = 'player-color-slider';
  slider.setAttribute('aria-label', 'Player Color');
  slider.value = String(game.player.hue);
  const paintSwatch = () => {
    swatch.style.background = `hsl(${slider.value}, 100%, 54%)`;
  };
  paintSwatch();
  slider.addEventListener('input', () => {
    game.player.hue = Number(slider.value);
    paintSwatch();
  });
  slider.addEventListener('change', saveGameState);
  colorRow.append(swatch, slider);
  colorSection.append(colorTitle, colorRow);
  shipPartsList.append(colorSection);

  updateInventoryItemsGrid();
  drawShipPreview();
}

function getCustomRadioStations() {
  try {
    const saved = JSON.parse(localStorage.getItem(RADIO_STATIONS_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((station) => station && typeof station.id === 'string' &&
      typeof station.name === 'string' && typeof station.url === 'string' &&
      isValidRadioStreamUrl(station.url));
  } catch {
    return [];
  }
}

function isValidRadioStreamUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function playRadioStation(station) {
  if (!isValidRadioStreamUrl(station.url)) {
    radioStatus.textContent = 'El enlace no parece ser una URL de streaming válida.';
    return;
  }
  radioAudio.pause();
  radioAudio.src = station.url;
  radioAudio.dataset.stationId = station.id;
  radioAudio.load();
  radioStatus.textContent = `Conectando con ${station.name}…`;
  radioAudio.play().then(() => {
    radioStatus.textContent = `En directo: ${station.name}`;
  }).catch(() => {
    radioStatus.textContent = `No se pudo iniciar ${station.name}. Comprueba el enlace o vuelve a intentar.`;
  });
}

function renderRadioStations() {
  radioStationsList.replaceChildren();
  const stations = [
    ...PRESET_RADIO_STATIONS.map((station) => ({ ...station, preset: true })),
    ...getCustomRadioStations().map((station) => ({ ...station, preset: false })),
  ];
  for (const station of stations) {
    const row = document.createElement('div');
    row.className = 'radio-station-row';
    const playButton = document.createElement('button');
    playButton.className = 'radio-station-button';
    playButton.type = 'button';
    playButton.textContent = `▶  ${station.name}`;
    playButton.setAttribute('aria-label', `Reproducir ${station.name}`);
    playButton.addEventListener('click', () => playRadioStation(station));
    row.append(playButton);
    if (!station.preset) {
      const removeButton = document.createElement('button');
      removeButton.className = 'radio-remove-button';
      removeButton.type = 'button';
      removeButton.textContent = '×';
      removeButton.setAttribute('aria-label', `Eliminar ${station.name}`);
      removeButton.addEventListener('click', () => {
        if (radioAudio.dataset.stationId === station.id) {
          radioAudio.pause();
          radioAudio.removeAttribute('src');
          radioAudio.load();
          radioStatus.textContent = 'Emisora eliminada.';
        }
        const updated = getCustomRadioStations().filter((item) => item.id !== station.id);
        try {
          localStorage.setItem(RADIO_STATIONS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          radioStatus.textContent = 'No se pudo guardar el cambio en este navegador.';
        }
        renderRadioStations();
      });
      row.append(removeButton);
    }
    radioStationsList.append(row);
  }
}

function addCustomRadioStation(event) {
  event.preventDefault();
  const nameInput = document.getElementById('radioStationName');
  const urlInput = document.getElementById('radioStationUrl');
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  if (!name || !isValidRadioStreamUrl(url)) {
    radioStatus.textContent = 'Escribe un nombre y un enlace de streaming HTTP o HTTPS válido.';
    return;
  }
  const stations = getCustomRadioStations();
  if ([...PRESET_RADIO_STATIONS, ...stations].some((station) => station.url === url)) {
    radioStatus.textContent = 'Ese enlace ya está en la lista.';
    return;
  }
  stations.push({ id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, url });
  try {
    localStorage.setItem(RADIO_STATIONS_STORAGE_KEY, JSON.stringify(stations));
    radioStatus.textContent = `Se agregó ${name}.`;
    nameInput.value = '';
    urlInput.value = '';
    renderRadioStations();
  } catch {
    radioStatus.textContent = 'No se pudo guardar la emisora en este navegador.';
  }
}

function renderMissionPanel() {
  if (!missionsList) return;
  missionsList.replaceChildren();
  const card = document.createElement('article');
  card.className = 'mission-card';
  const active = earthMissionStatus === 'active';
  const ready = isEarthMissionReadyToClaim();
  const title = document.createElement('h2');
  title.className = 'mission-title';
  title.textContent = active ? 'Misión activa · Jorge' : 'Próxima misión · Jorge';
  const description = document.createElement('p');
  description.className = 'mission-description';
  description.textContent = getEarthMissionDescription();
  card.append(title, description);

  if (active && (earthMission.type === 'destroy' || earthMission.type === 'kill_surface')) {
    const objective = document.createElement('p');
    objective.className = `mission-objective${ready ? ' mission-objective-complete' : ''}`;
    objective.textContent = ready
      ? `✓ Objetivo completo · ${earthMissionKillProgress}/${earthMission.targetKills}`
      : `○ Progreso · ${earthMissionKillProgress}/${earthMission.targetKills}`;
    card.append(objective);
  } else if (active && earthMission.type === 'resources') {
    const objectives = document.createElement('ul');
    objectives.className = 'mission-objectives';
    for (const [key, count] of Object.entries(earthMission.need)) {
      const have = Math.min(game.player.inventory[key] || 0, count);
      const complete = have >= count;
      const item = document.createElement('li');
      item.className = `mission-objective${complete ? ' mission-objective-complete' : ''}`;
      item.textContent = `${complete ? '✓' : '○'} ${RESOURCE_CATALOG[key].name} · ${have}/${count}`;
      objectives.append(item);
    }
    card.append(objectives);
  } else {
    const prompt = document.createElement('p');
    prompt.className = 'mission-description';
    prompt.textContent = 'Habla con Jorge en Tierra para aceptar esta misión.';
    card.append(prompt);
  }

  const status = document.createElement('p');
  status.className = `mission-status${ready ? ' mission-status-complete' : ''}`;
  status.textContent = ready
    ? `COMPLETA · vuelve con Jorge para cobrar ${earthMission.rewardCredits} créditos.`
    : `Recompensa · ${earthMission.rewardCredits} créditos`;
  card.append(status);
  missionsList.append(card);
}

function showInventoryView(view) {
  captureInventoryScrollPositions();
  currentInventoryView = view;
  if (['menu', 'objetos', 'mapa', 'nave', 'radio', 'misiones'].includes(view)) {
    lastInventoryTab = view;
  }
  inventoryTitle.textContent = view === 'market'
    ? 'Comerciante de Tierra'
    : view === 'cofre' ? 'Cofre de Tierra'
      : view === 'repair' ? 'Taller de reparaciones'
        : view === 'craft' ? 'Mesa de trabajo'
          : view === 'radio' ? 'Radio'
          : view === 'misiones' ? 'Misiones'
          : view === 'help' ? '¡Ayuda!'
            : 'Inventario';
  inventoryOptionsNav.hidden = ['market', 'cofre', 'repair', 'craft'].includes(view);
  inventoryOptions.forEach((option) => {
    option.setAttribute('aria-pressed', String(option.dataset.command === view));
  });

  if (view === 'objetos') {
    inventoryItemsGrid.hidden = false;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    updateInventoryItemsGrid();
  } else if (view === 'mapa') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = false;
    inventoryMapTooltip.hidden = true;
  } else if (view === 'nave') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = false;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = true;
    renderShipWorkshop();
  } else if (view === 'radio') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = true;
    radioPanel.hidden = false;
    renderRadioStations();
  } else if (view === 'misiones') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = true;
    missionPanel.hidden = false;
    renderMissionPanel();
  } else if (view === 'menu') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = true;
  } else if (view === 'cofre') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = true;
    chestPanel.hidden = false;
    updateInventoryItemsGrid(chestPlayerItemsGrid);
    renderChestItemsGrid();
  } else if (view === 'market') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    inventoryMapContainer.hidden = true;
    marketPanel.hidden = false;
    updateMarketPanel();
  } else if (view === 'repair') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    inventoryMapContainer.hidden = true;
    marketPanel.hidden = true;
    repairPanel.hidden = false;
    renderRepairPanel();
  } else if (view === 'craft') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    inventoryMapContainer.hidden = true;
    marketPanel.hidden = true;
    craftPanel.hidden = false;
    renderCraftPanel();
  } else if (view === 'help') {
    inventoryItemsGrid.hidden = true;
    shipWorkshop.hidden = true;
    marketPanel.hidden = true;
    inventoryMapContainer.hidden = true;
    emergencyHelpPanel.hidden = false;
    updateEmergencyHelpPanel();
  }
  if (view !== 'mapa') {
    inventoryMapContainer.hidden = true;
    inventoryMapTooltip.hidden = true;
  }
  if (view !== 'objetos') {
    inventoryItemsGrid.hidden = true;
  }
  if (view !== 'nave') {
    shipWorkshop.hidden = true;
  }
  if (view !== 'market') {
    marketPanel.hidden = true;
  }
  if (view !== 'cofre') {
    chestPanel.hidden = true;
  }
  if (view !== 'repair') {
    repairPanel.hidden = true;
  }
  if (view !== 'craft') {
    craftPanel.hidden = true;
  }
  if (view !== 'radio') {
    radioPanel.hidden = true;
  }
  if (view !== 'misiones') {
    missionPanel.hidden = true;
  }
  if (view !== 'help') {
    emergencyHelpPanel.hidden = true;
  }
  applyInventoryScrollPositions();
  saveGameState();
}

let confirmState = null;
const confirmOverlay = document.createElement('div');
confirmOverlay.className = 'confirm-overlay';
confirmOverlay.hidden = true;
confirmOverlay.innerHTML = `
  <div class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirmText">
    <p class="confirm-text" id="confirmText"></p>
    <div class="confirm-actions">
      <button type="button" class="confirm-button" data-confirm="yes">Sí (E)</button>
      <button type="button" class="confirm-button" data-confirm="no">No (Esc)</button>
    </div>
  </div>`;
document.querySelector('.game-shell').append(confirmOverlay);
const confirmText = confirmOverlay.querySelector('.confirm-text');

function askConfirm(text, onYes) {
  if (confirmState) return;
  confirmState = { onYes };
  game.keys = {};
  game.pointer.isDown = false;
  confirmText.textContent = text;
  confirmOverlay.hidden = false;
}

function resolveConfirm(accepted) {
  if (!confirmState) return;
  const { onYes } = confirmState;
  confirmState = null;
  confirmOverlay.hidden = true;
  if (accepted) onYes();
}

confirmOverlay.addEventListener('click', (event) => {
  const button = event.target.closest('[data-confirm]');
  if (button) {
    button.blur();
    resolveConfirm(button.dataset.confirm === 'yes');
  }
});
confirmOverlay.addEventListener('pointerdown', (event) => event.stopPropagation());

function setMessage(text, type = 'normal') {
  if (messageTimeout !== null) {
    window.clearTimeout(messageTimeout);
    messageTimeout = null;
  }
  messageEl.textContent = text;
  messageEl.classList.remove('message-combat');
  messageEl.classList.remove('message-player-damage');
  messageEl.style.removeProperty('border-color');
  messageEl.style.removeProperty('background');
  messageEl.style.removeProperty('color');
  messageEl.style.removeProperty('text-shadow');
  if (type === 'combat') {
    messageEl.classList.add('message-combat');
    messageEl.style.borderColor = 'rgba(255, 67, 82, 0.82)';
    messageEl.style.background = 'rgba(20, 2, 5, 0.95)';
    messageEl.style.color = '#ffd5d8';
    messageEl.style.textShadow = '0 0 6px rgba(255, 52, 68, 0.62)';
  } else if (type === 'player-damage') {
    messageEl.classList.add('message-player-damage');
    messageEl.style.borderColor = 'rgba(70, 158, 255, 0.9)';
    messageEl.style.background = 'rgba(2, 8, 24, 0.96)';
    messageEl.style.color = '#d4eaff';
    messageEl.style.textShadow = '0 0 6px rgba(52, 142, 255, 0.7)';
  }
  messageEl.classList.add('message-visible');
  const displayDuration = clamp(text.length * 60, 3000, 10000);
  messageTimeout = window.setTimeout(() => {
    messageEl.classList.remove('message-visible');
    messageTimeout = null;
  }, displayDuration);
}

function setCombatMessage(text) {
  setMessage(text, 'combat');
}

function setPlayerDamageMessage(text) {
  setMessage(text, 'player-damage');
}

function toggleInventory(forceOpen) {
  const shouldOpen = forceOpen === undefined ? inventoryPanel.hidden : forceOpen;
  if (!shouldOpen && !inventoryPanel.hidden) {
    getInventoryWindowGeometry();
    inventoryMapPan = { x: 0, y: 0 };
    inventoryMapDrag = null;
    inventoryMap.style.cursor = '';
  }
  inventoryPanel.hidden = !shouldOpen;
  game.keys = {};
  game.pointer.isDown = false;
  game.pointer.clickTarget = null;

  if (shouldOpen) {
    applyInventoryWindowGeometry();
    updateHud();
    showInventoryView(lastInventoryTab);
  }
  saveGameState();
}

function getNearestPlanet() {
  let closest = null;
  let closestDistance = Infinity;

  for (const planet of game.planets) {
    const dx = game.player.x - planet.x;
    const dy = game.player.y - planet.y;
    const dist = Math.hypot(dx, dy);

    if (dist < planet.radius + 24 && dist < closestDistance) {
      closest = planet;
      closestDistance = dist;
    }
  }

  return closest;
}

function getPlanetResourceStateKey(planet) {
  return `${planet.star.chunkX},${planet.star.chunkY},${planet.seed}`;
}

function getPlanetResourceSellPrice(planet, resourceKey) {
  if (planet.isMoon) return RESOURCE_SELL_PRICES[resourceKey];
  const nominalOrbitRadius = Number.isFinite(planet.orbitRadius)
    ? planet.orbitRadius / ORBIT_DISTANCE_SCALE
    : 0;
  const distanceTier = Math.floor(Math.max(0, nominalOrbitRadius - 250) / 100);
  return Math.round(RESOURCE_SELL_PRICES[resourceKey] * (1 + distanceTier * 0.2));
}

function getPlanetResourceTier(planet) {
  const nominalOrbitRadius = Number.isFinite(planet.orbitRadius)
    ? planet.orbitRadius / ORBIT_DISTANCE_SCALE
    : 0;
  return Math.floor(Math.max(0, nominalOrbitRadius - 100) / 150);
}

function getPlanetAvailableResources(planet) {
  if (planet.isMoon) return ['regolith'];
  if (isHomeworld(planet)) return ['metal', 'crystal'];
  const tier = getPlanetResourceTier(planet);
  return Object.keys(RESOURCE_CATALOG).filter((key) => {
    const resource = RESOURCE_CATALOG[key];
    if (!resource.minTier) return ['metal', 'crystal'].includes(key);
    return tier >= resource.minTier && (resource.environment === 'gas') === planet.gas;
  });
}

function getPlanetPickupCapacity(planet) {
  return isHomeworld(planet) ? HOMEWORLD_PICKUP_CAPACITY : PLANET_PICKUP_CAPACITY;
}

function generatePlanetPickupBatch(planet, count, generation, existingPickups = [], avoidCameraCenter = null) {
  const random = createRandom(coordinateSeed(
    planet.seed ^ generation,
    planet.star.chunkX,
    planet.star.chunkY ^ 0x51f15e
  ));
  const positions = [];
  const normalizedDistance = (first, second) =>
    getSurfaceDistance(
      first.x * SURFACE_WORLD_SIZE,
      first.y * SURFACE_WORLD_SIZE,
      second.x * SURFACE_WORLD_SIZE,
      second.y * SURFACE_WORLD_SIZE
    ) / SURFACE_WORLD_SIZE;

  const cameraMargin = SURFACE_TILE * 2;
  const halfViewWidth = game.width / Math.max(0.1, playerZoom) / 2 + cameraMargin;
  const halfViewHeight = game.height / Math.max(0.1, playerZoom) / 2 + cameraMargin;
  const homeLand = isHomeworld(planet) ? getHomeLandBounds() : null;
  for (let attempt = 0; positions.length < count && attempt < count * 30; attempt += 1) {
    const point = snapSurfacePoint(
      homeLand ? homeLand.x + random() * homeLand.width : random() * SURFACE_WORLD_SIZE,
      homeLand ? homeLand.y + random() * homeLand.height : random() * SURFACE_WORLD_SIZE,
    );
    const position = { x: point.x / SURFACE_WORLD_SIZE, y: point.y / SURFACE_WORLD_SIZE };
    const relativeX = avoidCameraCenter
      ? Math.abs(getSurfaceAxisDelta(point.x, avoidCameraCenter.x))
      : Infinity;
    const relativeY = avoidCameraCenter
      ? Math.abs(getSurfaceAxisDelta(point.y, avoidCameraCenter.y))
      : Infinity;
    if (
      (relativeX <= halfViewWidth && relativeY <= halfViewHeight) ||
      (isHomeworld(planet) && isNearHomeFloor(point.x, point.y)) ||
      existingPickups.some((pickup) => normalizedDistance(position, pickup) < SURFACE_TILE / SURFACE_WORLD_SIZE)
    ) continue;
    positions.push(position);
  }

  for (let index = positions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [positions[index], positions[swapIndex]] = [positions[swapIndex], positions[index]];
  }

  const availableResources = getPlanetAvailableResources(planet);
  return positions.slice(0, count).map((position, index) => {
    const resourceKey = availableResources[index % availableResources.length];
    const item = RESOURCE_CATALOG[resourceKey];
    return {
      id: `${getPlanetResourceStateKey(planet)}:${generation}:${index}`,
      resourceKey,
      name: item.name,
      icon: item.icon,
      color: item.color,
      count: (1 + Math.floor(random() * 3)) * (resourceKey === 'regolith' ? 3 : 1),
      ...position,
    };
  });
}

function getPlanetResourceState(planet, now = Date.now()) {
  const key = getPlanetResourceStateKey(planet);
  let state = game.player.planetResourceStates[key];
  if (!state || !Array.isArray(state.pickups)) {
    state = {
      pickups: [],
      generation: 0,
      lastRegeneratedAt: now,
      resourceCatalogVersion: 6,
      regolithGenerationVersion: planet.isMoon ? 1 : 0,
    };
    game.player.planetResourceStates[key] = state;
    state.pickups = generatePlanetPickupBatch(
      planet,
      getPlanetPickupCapacity(planet),
      state.generation
    );
    return state;
  }

  if (!Number.isFinite(state.generation)) state.generation = 0;
  if (!Number.isFinite(state.lastRegeneratedAt)) state.lastRegeneratedAt = now;
  if (state.resourceCatalogVersion !== 6) {
    state.generation += 1;
    state.pickups = generatePlanetPickupBatch(
      planet,
      getPlanetPickupCapacity(planet),
      state.generation
    );
    state.resourceCatalogVersion = 6;
    if (planet.isMoon) state.regolithGenerationVersion = 1;
  }
  if (planet.isMoon && state.regolithGenerationVersion !== 1) {
    for (const pickup of state.pickups) {
      if (pickup.resourceKey === 'regolith') pickup.count = Math.min(MAX_ITEM_STACK, pickup.count * 3);
    }
    state.regolithGenerationVersion = 1;
  }
  if (isHomeworld(planet) && state.pickups.some((pickup) =>
    !isWithinHomeLand(pickup.x * SURFACE_WORLD_SIZE, pickup.y * SURFACE_WORLD_SIZE)
  )) {
    state.generation += 1;
    state.pickups = generatePlanetPickupBatch(planet, getPlanetPickupCapacity(planet), state.generation);
  }
  state.pickups = state.pickups.slice(0, getPlanetPickupCapacity(planet));
  return state;
}

function replenishPlanetPickups(planet, now = Date.now()) {
  const state = getPlanetResourceState(planet, now);
  if (now - state.lastRegeneratedAt < PLANET_PICKUP_REGEN_INTERVAL) {
    return false;
  }

  const intervalsElapsed = Math.floor(
    (now - state.lastRegeneratedAt) / PLANET_PICKUP_REGEN_INTERVAL
  );
  state.lastRegeneratedAt += intervalsElapsed * PLANET_PICKUP_REGEN_INTERVAL;
  const missingCount = Math.max(
    0,
    getPlanetPickupCapacity(planet) - state.pickups.length
  );
  if (missingCount > 0) {
    state.generation += 1;
    const avoidCameraCenter = game.scene === 'surface' && game.surface?.planet?.name === planet.name
      ? { x: game.surface.x, y: game.surface.y }
      : null;
    state.pickups.push(...generatePlanetPickupBatch(
      planet,
      missingCount,
      state.generation,
      state.pickups,
      avoidCameraCenter
    ));
  }
  return missingCount > 0;
}

function createPlanetPickups(planet) {
  replenishPlanetPickups(planet);
  const state = getPlanetResourceState(planet);
  if (isHomeworld(planet)) {
    state.pickups = state.pickups.filter((pickup) =>
      !isNearHomeFloor(pickup.x * SURFACE_WORLD_SIZE, pickup.y * SURFACE_WORLD_SIZE)
    );
  }
  return state.pickups.map((pickup) => ({
    ...pickup,
    ...snapSurfacePoint(pickup.x * SURFACE_WORLD_SIZE, pickup.y * SURFACE_WORLD_SIZE),
  }));
}

function restorePlanetResourceStates(savedStates) {
  if (!savedStates || typeof savedStates !== 'object') return;
  const validResources = new Set(Object.keys(RESOURCE_CATALOG).filter((key) => key !== 'energy'));
  for (const [key, savedState] of Object.entries(savedStates)) {
    if (!savedState || !Array.isArray(savedState.pickups)) continue;
    const pickups = savedState.pickups.filter((pickup) =>
      pickup &&
      typeof pickup.id === 'string' &&
      validResources.has(pickup.resourceKey) &&
      Number.isInteger(pickup.count) &&
      pickup.count > 0 &&
      pickup.count <= MAX_ITEM_STACK &&
      Number.isFinite(pickup.x) &&
      pickup.x >= 0 &&
      pickup.x <= 1 &&
      Number.isFinite(pickup.y) &&
      pickup.y >= 0 &&
      pickup.y <= 1
    ).slice(0, PLANET_PICKUP_CAPACITY).map((pickup) => ({
      id: pickup.id,
      resourceKey: pickup.resourceKey,
      name: RESOURCE_CATALOG[pickup.resourceKey].name,
      icon: RESOURCE_CATALOG[pickup.resourceKey].icon,
      color: RESOURCE_CATALOG[pickup.resourceKey].color,
      count: pickup.count,
      x: pickup.x,
      y: pickup.y,
    }));
    game.player.planetResourceStates[key] = {
      pickups,
      ...(savedState.resourceCatalogVersion === 6 ? { resourceCatalogVersion: 6 } : {}),
      regolithGenerationVersion: savedState.regolithGenerationVersion === 1 ? 1 : 0,
      generation: Number.isInteger(savedState.generation) && savedState.generation >= 0
        ? savedState.generation
        : 0,
      lastRegeneratedAt: Number.isFinite(savedState.lastRegeneratedAt)
        ? savedState.lastRegeneratedAt
        : Date.now(),
    };
  }
}

function updateMerchantStock(now = Date.now()) {
  if (now < nextMerchantRestockAt) return false;

  merchantStock.forEach((item, index) => {
    item.count = merchantInitialStock[index];
  });
  nextMerchantRestockAt = now + MERCHANT_RESTOCK_INTERVAL;
  if (!marketPanel.hidden) updateMarketPanel();
  saveGameState();
  return true;
}

function enterPlanet(planet) {
  const shipX = SURFACE_WORLD_SIZE * 0.58125;
  const shipY = SURFACE_WORLD_SIZE * 0.6;
  game.scene = 'surface';
  game.surfaceProjectiles.length = 0;
  game.earthWanderer = null;
  game.martianNpcs = null;
  game.martianConversation = null;
  game.martianChatTimer = 0;
  // En la superficie se conserva el campo de visión base, sin zoom manual.
  playerZoom = SURFACE_PLAYER_ZOOM;
  game.surface = {
    planet,
    pickups: createPlanetPickups(planet),
    x: shipX,
    y: shipY,
    facing: 'down',
    isMoving: false,
    animationFrame: 1,
    animationTimer: 0,
    weaponCooldown: 0,
    shotUntil: 0,
    shipX,
    shipY,
    baseViewportWidth: game.width,
    baseViewportHeight: game.height,
    hoverboard: {
      ...(game.player.hoverboardWorldStates[getPlanetResourceStateKey(planet)] ?? {
        deployed: false,
        x: shipX,
        y: shipY + SURFACE_TILE * 2,
      }),
      spawnUntil: 0,
      mountUntil: 0,
    },
  };
  // El jugador aparece justo debajo de la nave, fuera de su hitbox.
  const landedShip = getSurfaceShipPosition();
  game.surface.x = landedShip.x;
  game.surface.y = landedShip.y + SURFACE_TILE * 2;
  game.pointer.moveTarget = null;
  game.pointer.followPlanet = null;
  if (game.emergencyService?.type === 'tow') game.emergencyService = null;
  game.player.velocityX = 0;
  game.player.velocityY = 0;
  game.selectedPlanet = planet;
  setMessage(planet.name);
  updateHud();
  saveGameState();
}

function isHomeworld(planet) {
  return Boolean(planet?.isHomeworld || planet?.name?.toLowerCase() === 'tierra');
}

function isMars(planet) {
  return ['martis', 'marte', 'mars'].includes(planet?.name?.toLowerCase());
}

function isLuna(planet) {
  return Boolean(planet?.isMoon || ['luna', 'moon'].includes(planet?.name?.toLowerCase()));
}

function getMerchantPosition() {
  return getHomeNpcPosition('merchant');
}

// El detector ya no se vende: solo se fabrica en la mesa de trabajo.
const ENEMY_DETECTOR_ITEM = {
  id: 'enemy-detector',
  name: 'Detector de enemigos',
  icon: '◎',
  color: '#ff5252',
  description: 'Mientras esté en tu inventario, muestra con puntos rojos los enemigos cercanos en el mapa.',
};

// El comerciante vende consumibles y el radar de exploración.
const merchantStock = [
  { id: 'merchant-fuel', name: 'Combustible', icon: 'F', color: '#ffbd69', resourceKey: 'fuel', count: 99, price: 30 },
  {
    id: 'merchant-energy',
    name: RESOURCE_CATALOG.energy.name,
    icon: RESOURCE_CATALOG.energy.icon,
    color: RESOURCE_CATALOG.energy.color,
    resourceKey: 'energy',
    count: 99,
    price: 10,
  },
  {
    id: 'radar',
    name: 'Radar',
    icon: '◉',
    color: '#42eaff',
    description: 'En el espacio muestra un minimapa circular con un alcance de 20 chunks.',
    count: 1,
    price: 750,
  },
  { ...REGOLITO_GUN_ITEM, count: 1, price: 400 },
];
const merchantInitialStock = merchantStock.map((item) => item.count);
let nextMerchantRestockAt = Date.now() + MERCHANT_RESTOCK_INTERVAL;

// El comerciante paga las materias primas a la mitad de su valor.
const MERCHANT_RESOURCE_BUY_FACTOR = 0.5;

const itemSellPrices = { [REGOLITO_GUN_ITEM_ID]: 100, [HOVERBOARD_ITEM_ID]: 2000 };

function getItemSellPrice(item) {
  if (RESOURCE_SELL_PRICES[item.resourceKey]) {
    if (Array.isArray(item.priceLots) && item.priceLots.length > 0) {
      const count = item.priceLots.reduce((total, lot) => total + lot.count, 0);
      if (count > 0) {
        return item.priceLots.reduce((total, lot) => total + lot.unitPrice * lot.count, 0) / count
          * MERCHANT_RESOURCE_BUY_FACTOR;
      }
    }
    return (Number.isFinite(item.unitPrice)
      ? item.unitPrice
      : RESOURCE_SELL_PRICES[item.resourceKey]) * MERCHANT_RESOURCE_BUY_FACTOR;
  }
  if (item.id === 'enemy-detector') return 125;
  const shipPart = getShipPart(item.id);
  if (shipPart) return Math.max(1, Math.round(shipPart.price * 0.5));
  return itemSellPrices[item.id] ?? null;
}

function isShipPartEquipped(itemId) {
  return [
    game.player.shipParts.center,
    game.player.shipParts.propulsor,
    game.player.shipParts.leftWing,
    game.player.shipParts.rightWing,
    game.player.shipParts.tip,
  ].includes(itemId) || isSurfaceItemEquipped(itemId);
}

function renderMarketSlot(container, item, index, side) {
  const slot = document.createElement('button');
  slot.type = 'button';
  slot.className = 'inventory-slot';
  slot.setAttribute('role', 'gridcell');
  slot.dataset.slotIndex = String(index);
  slot.dataset.marketSide = side;

  if (item) {
    slot.classList.add('inventory-slot-filled');
    const count = Math.max(0, item.count);
    const isEquipped = side === 'player' && isShipPartEquipped(item.id);
    if (isEquipped) slot.classList.add('inventory-slot-equipped');
    slot.setAttribute('aria-label', `${item.name}: ${count}${isEquipped ? ', equipado, no se puede vender' : ''}`);
    if (side === 'player') {
      slot.draggable = true;
      slot.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', String(index));
        event.dataTransfer.setData('application/x-spaceheaven-grid', 'player');
        event.dataTransfer.effectAllowed = 'move';
        draggedInventoryItem = { source: 'player', index, item: { ...item } };
        draggedItemDroppedInsideInterface = false;
        slot.classList.add('inventory-slot-dragging');
      });
      slot.addEventListener('dragend', (event) => {
        slot.classList.remove('inventory-slot-dragging');
        const dragged = draggedInventoryItem;
        draggedInventoryItem = null;
        if (dragged && event.dataTransfer?.dropEffect === 'none' && !draggedItemDroppedInsideInterface) askDeleteDraggedItem(dragged);
        draggedItemDroppedInsideInterface = false;
      });
      slot.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      });
      slot.addEventListener('drop', (event) => {
        event.preventDefault();
        const fromIndex = Number(event.dataTransfer.getData('text/plain'));
        if (Number.isInteger(fromIndex) && fromIndex >= 0 && fromIndex < game.player.inventorySlots.length && fromIndex !== index) {
          [game.player.inventorySlots[fromIndex], game.player.inventorySlots[index]] =
            [game.player.inventorySlots[index], game.player.inventorySlots[fromIndex]];
          updateMarketPanel();
          saveGameState();
        }
        event.dataTransfer.dropEffect = 'move';
      });
    }
    attachItemTooltip(slot, item, isEquipped);

    const previewSprite = getItemPreviewSprite(item);
    if (previewSprite) {
      const icon = document.createElement('img');
      icon.className = 'inventory-slot-icon-image';
      setItemPreviewSource(icon, previewSprite);
      icon.alt = '';
      icon.draggable = false;
      slot.append(icon);
    } else {
      const icon = document.createElement('span');
      icon.className = 'inventory-slot-icon';
      icon.style.color = item.color;
      icon.textContent = item.icon;
      slot.append(icon);
    }

    const countLabel = document.createElement('span');
    countLabel.className = 'inventory-slot-count';
    countLabel.textContent = String(count);
    slot.append(countLabel);
    slot.addEventListener('click', () => {
      if (side === 'merchant') {
        marketStatus.textContent = `${item.name}: ${item.price} créditos por unidad. Doble clic para elegir cantidad y comprar.`;
      } else {
        const price = getItemSellPrice(item);
        marketStatus.textContent = isEquipped
          ? `${item.name} está equipado y no se puede vender.`
          : price === null
            ? `${item.name}: el comerciante no compra este objeto.`
            : `${item.name}: ${Math.round(price * 10) / 10} créditos por unidad. Doble clic para elegir cantidad y vender.`;
      }
    });
    slot.addEventListener('dblclick', () => {
      if (side === 'merchant') {
        buyMarketItem(index);
      } else {
        sellMarketItem(index);
      }
    });
  } else {
    slot.setAttribute('aria-label', `Espacio vacío ${index + 1}`);
    slot.disabled = true;
  }
  container.append(slot);
}

function renderMarketGrid(container, items, side) {
  container.replaceChildren();
  const visibleSlotCount = side === 'player'
    ? getVisibleInventorySlotCount()
    : 100;
  for (let index = 0; index < visibleSlotCount; index += 1) {
    renderMarketSlot(container, items[index] ?? null, index, side);
  }
}

function buyMarketItem(index) {
  const item = merchantStock[index];
  if (!item || item.count <= 0) {
    marketStatus.textContent = 'El comerciante no tiene más existencias.';
    return;
  }
  const maxByCredits = Math.floor(game.player.credits / item.price);
  const maxByCapacity = item.resourceKey
    ? getAvailableResourceCapacity(item.resourceKey)
    : getAvailableItemCapacity(item);
  const maxQuantity = Math.min(item.count, maxByCredits, maxByCapacity);
  if (maxQuantity < 1) {
    marketStatus.textContent = maxByCredits < 1
      ? 'No tienes créditos suficientes.'
      : 'El inventario está lleno. Libera un stack antes de comprar.';
    return;
  }
  const quantity = requestTradeQuantity('comprar', item.name, maxQuantity);
  if (quantity === null) return;

  game.player.credits -= item.price * quantity;
  if (item.resourceKey) {
    addResourceToInventory(item.resourceKey, quantity, RESOURCE_SELL_PRICES[item.resourceKey]);
  } else {
    const added = addItemToInventory(item, quantity);
    if (added !== quantity) {
      game.player.credits += item.price * (quantity - added);
      item.count += quantity - added;
      marketStatus.textContent = 'No se pudo guardar toda la compra en el inventario.';
      updateInventoryItemsGrid();
      updateMarketPanel();
      updateHud();
      return;
    }
  }
  item.count -= quantity;
  updateInventoryItemsGrid();
  updateMarketPanel();
  updateHud();
  saveGameState();
  marketStatus.textContent = `Compraste ${quantity} ${item.name.toLowerCase()} por ${item.price * quantity} créditos.`;
}

function sellMarketItem(index) {
  const item = game.player.inventorySlots[index];
  if (!item) return;
  if (isShipPartEquipped(item.id)) {
    marketStatus.textContent = `${item.name} está equipado y no se puede vender.`;
    return;
  }
  const unitPrice = getItemSellPrice(item);
  if (unitPrice === null) {
    marketStatus.textContent = `${item.name}: el comerciante no compra este objeto.`;
    return;
  }

  const quantity = requestTradeQuantity('vender', item.name, item.count);
  if (quantity === null) return;

  let earned = unitPrice * quantity;
  if (item.resourceKey) {
    const selection = takePriceLots(item.priceLots || [{
      unitPrice: item.unitPrice ?? RESOURCE_SELL_PRICES[item.resourceKey], count: item.count,
    }], quantity);
    const removedCount = removePriceLotsFromInventory(item.resourceKey, selection.taken);
    if (removedCount !== quantity) {
      marketStatus.textContent = 'No se pudo actualizar la pila seleccionada. Inténtalo de nuevo.';
      updateInventoryItemsGrid();
      updateMarketPanel();
      return;
    }
    earned = Math.round(
      selection.taken.reduce((total, lot) => total + lot.unitPrice * lot.count, 0) * MERCHANT_RESOURCE_BUY_FACTOR
    );
    item.priceLots = selection.remaining;
  }
  item.count -= quantity;
  if (item.count <= 0) {
    game.player.inventorySlots[index] = null;
  }
  game.player.credits += earned;
  updateInventoryItemsGrid();
  updateMarketPanel();
  updateHud();
  saveGameState();
  marketStatus.textContent = `Vendiste ${quantity} ${item.name.toLowerCase()} por ${earned} créditos.`;
}

function requestTradeQuantity(action, itemName, maxQuantity) {
  const response = window.prompt(
    `¿Cuántas unidades de ${itemName} quieres ${action}? (1-${maxQuantity})`,
    '1'
  );
  if (response === null) return null;

  const quantity = Number(response.trim());
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
    marketStatus.textContent = `Cantidad inválida. Ingresa un número entero entre 1 y ${maxQuantity}.`;
    return null;
  }
  return quantity;
}

const EARTH_MISSION_GIVER = 'Jorge';
let earthMissionIndex = 0;
let earthMissionStatus = 'available'; // 'available' | 'active'
let earthMissionKillProgress = 0;
let earthKillMissionPending = true;
let earthMission = createEarthMission(earthMissionIndex);

function getEarthMissionReward(need, completedMissions) {
  const rewardMultiplier = Math.min(10, 3 + completedMissions * 0.5);
  const requestedMarketValue = Object.entries(need).reduce(
    (total, [key, count]) => total + count * RESOURCE_SELL_PRICES[key],
    0
  );
  return {
    rewardCredits: Math.ceil(requestedMarketValue * rewardMultiplier),
    rewardMultiplier,
  };
}

function createEarthMission(completedMissions) {
  if (completedMissions === 1) {
    return { type: 'kill_surface', targetEnemyType: 'martian', targetKills: 5, rewardCredits: 1000 };
  }
  if (completedMissions === 2) {
    return { type: 'kill_surface', targetEnemyType: 'lunatic', targetKills: 5, rewardCredits: 2500 };
  }
  if (earthKillMissionPending || completedMissions % 5 === 0) {
    earthKillMissionPending = false;
    return { type: 'destroy', targetKills: 3, rewardCredits: 2000 };
  }
  const random = createRandom(coordinateSeed(completedMissions + 0x4a6f7267, 0x6d697373, 0x696f6e));
  const scale = Math.min(10, 1 + completedMissions * 0.5);
  const unlockedTier = Math.min(4, 1 + Math.floor(completedMissions / 3));
  const basic = ['metal', 'crystal'];
  const rocky = Object.keys(RESOURCE_CATALOG).filter((key) => RESOURCE_CATALOG[key].environment === 'rocky' && RESOURCE_CATALOG[key].minTier <= unlockedTier);
  const gas = Object.keys(RESOURCE_CATALOG).filter((key) => RESOURCE_CATALOG[key].environment === 'gas' && RESOURCE_CATALOG[key].minTier <= unlockedTier);
  const picks = [];
  const pickOne = (pool) => {
    const choices = pool.filter((key) => !picks.includes(key));
    if (choices.length) picks.push(choices[Math.floor(random() * choices.length)]);
  };

  pickOne(basic);
  pickOne(rocky);
  if (completedMissions >= 1) pickOne(gas);
  const targetCount = Math.min(4, 2 + Math.floor(completedMissions / 3));
  const remainingPool = [...basic, ...rocky, ...gas];
  while (picks.length < targetCount) {
    const before = picks.length;
    pickOne(remainingPool);
    if (picks.length === before) break;
  }

  const need = Object.fromEntries(picks.map((key) => [key, Math.ceil((2 + Math.floor(random() * 3)) * scale)]));
  const { rewardCredits, rewardMultiplier } = getEarthMissionReward(need, completedMissions);
  return {
    type: 'resources',
    need,
    rewardCredits,
    scale,
    rewardMultiplier,
  };
}

function getEarthMissionDescription(mission = earthMission) {
  if (mission.type === 'destroy') return `destruir ${mission.targetKills} naves enemigas`;
  if (mission.type === 'kill_surface') {
    return mission.targetEnemyType === 'lunatic'
      ? `eliminar ${mission.targetKills} alienígenas lunáticos en Luna`
      : `eliminar ${mission.targetKills} marcianos en Marte`;
  }
  return `traer ${formatEarthMissionNeeds(mission)}`;
}

function isEarthMissionReadyToClaim() {
  if (earthMissionStatus !== 'active') return false;
  if (earthMission.type === 'destroy' || earthMission.type === 'kill_surface') {
    return earthMissionKillProgress >= earthMission.targetKills;
  }
  return Object.entries(earthMission.need).every(([key, count]) => (game.player.inventory[key] || 0) >= count);
}

function getEarthMissionMarker() {
  if (earthMissionStatus !== 'active') return { text: 'JORGE !', color: '#ffe45b' };
  if (isEarthMissionReadyToClaim()) return { text: 'JORGE ✓', color: '#55c8ff' };
  if (earthMission.type === 'destroy' || earthMission.type === 'kill_surface') {
    return { text: `JORGE ${earthMissionKillProgress}/${earthMission.targetKills}`, color: '#ffe45b' };
  }
  const needs = Object.entries(earthMission.need);
  const completedItems = needs.filter(([key, count]) => (game.player.inventory[key] || 0) >= count).length;
  return { text: `JORGE ${completedItems}/${needs.length}`, color: '#ffe45b' };
}

function handleSurfaceEnemyMissionKill(enemy) {
  if (
    earthMissionStatus !== 'active' ||
    earthMission.type !== 'kill_surface' ||
    enemy.type !== earthMission.targetEnemyType ||
    earthMissionKillProgress >= earthMission.targetKills
  ) return null;
  earthMissionKillProgress = Math.min(earthMission.targetKills, earthMissionKillProgress + 1);
  const objective = earthMission.targetEnemyType === 'lunatic' ? 'alienígenas de Luna' : 'marcianos de Marte';
  return earthMissionKillProgress >= earthMission.targetKills
    ? `Misión completa: ${earthMissionKillProgress}/${earthMission.targetKills} ${objective}. Vuelve con Jorge para cobrar ${earthMission.rewardCredits} $.`
    : `Misión de Jorge: ${earthMissionKillProgress}/${earthMission.targetKills} ${objective}.`;
}

function handleEnemyDestroyed() {
  let text = '¡Nave enemiga destruida!';
  if (earthMissionStatus === 'active' && earthMission.type === 'destroy') {
    earthMissionKillProgress = Math.min(earthMission.targetKills, earthMissionKillProgress + 1);
    if (earthMissionKillProgress < earthMission.targetKills) {
      game.hostileSpawnTimer = Math.min(game.hostileSpawnTimer, 3);
    }
    text += earthMissionKillProgress >= earthMission.targetKills
      ? ` Contrato completo: vuelve con Jorge para cobrar ${earthMission.rewardCredits} $.`
      : ` Contrato de Jorge: ${earthMissionKillProgress}/${earthMission.targetKills} naves.`;
    saveGameState();
  }
  setPlayerDamageMessage(text);
}

function getMissionResourceSource(resourceKey) {
  const resource = RESOURCE_CATALOG[resourceKey];
  if (!resource?.environment) return 'Tierra';
  return resource.environment === 'gas' ? 'gigantes gaseosos' : 'planetas rocosos';
}

function formatEarthMissionNeeds(mission = earthMission) {
  return Object.entries(mission.need).map(([key, count]) =>
    `${count} ${RESOURCE_CATALOG[key].name} (${getMissionResourceSource(key)})`
  ).join(', ');
}

function getQuestGiverPosition() {
  return getHomeNpcPosition('questGiver');
}

function isNearQuestGiver() {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet)) {
    return false;
  }
  const giver = getQuestGiverPosition();
  return getSurfaceDistance(game.surface.x, game.surface.y, giver.x, giver.y) <= 64;
}

function talkToQuestGiver() {
  const { need, rewardCredits } = earthMission;
  if (earthMissionStatus === 'available') {
    earthMissionStatus = 'active';
    earthMissionKillProgress = 0;
    saveGameState();
    setMessage(`${EARTH_MISSION_GIVER}: ${getEarthMissionDescription()} y te pagaré ${rewardCredits} $.`);
    return;
  }
  if (earthMissionStatus === 'active') {
    if (earthMission.type === 'destroy' || earthMission.type === 'kill_surface') {
      if (earthMissionKillProgress < earthMission.targetKills) {
        setMessage(`${EARTH_MISSION_GIVER}: Llevas ${earthMissionKillProgress}/${earthMission.targetKills}. Sigue así.`);
        return;
      }
      game.player.credits += rewardCredits;
      earthMissionIndex += 1;
      earthMission = createEarthMission(earthMissionIndex);
      earthMissionStatus = 'available';
      earthMissionKillProgress = 0;
      updateHud();
      saveGameState();
      setMessage(`¡Misión completada! ${EARTH_MISSION_GIVER} te pagó ${rewardCredits} $. Ya tiene otro encargo: ${getEarthMissionDescription()} por ${earthMission.rewardCredits} $.`);
      return;
    }
    const missing = Object.entries(need).filter(([key, count]) => (game.player.inventory[key] || 0) < count);
    if (missing.length) {
      const progress = Object.entries(need).map(([key, count]) =>
        `${RESOURCE_CATALOG[key].name} ${Math.min(game.player.inventory[key] || 0, count)}/${count}`
      ).join(', ');
      setMessage(`${EARTH_MISSION_GIVER}: Aún faltan materiales. ${progress}.`);
      return;
    }
    for (const [key, count] of Object.entries(need)) removeResourceFromInventory(key, count);
    game.player.credits += rewardCredits;
    earthMissionIndex += 1;
    earthMission = createEarthMission(earthMissionIndex);
    earthMissionStatus = 'available';
    earthMissionKillProgress = 0;
    updateInventoryItemsGrid();
    updateHud();
    saveGameState();
    setMessage(`¡Misión completada! ${EARTH_MISSION_GIVER} te pagó ${rewardCredits} $. Ya tiene otro encargo: ${getEarthMissionDescription()} por ${earthMission.rewardCredits} $.`);
    return;
  }
  setMessage(`${EARTH_MISSION_GIVER}: Siempre tengo otro trabajo si puedes traer materiales de otros planetas.`);
}

function isNearMerchant() {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet)) {
    return false;
  }
  const merchant = getMerchantPosition();
  return getSurfaceDistance(game.surface.x, game.surface.y, merchant.x, merchant.y) <= 64;
}

function getRepairerPosition() {
  return getHomeNpcPosition('repairer');
}

function isNearRepairer() {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet)) return false;
  const repairer = getRepairerPosition();
  return getSurfaceDistance(game.surface.x, game.surface.y, repairer.x, repairer.y) <= 64;
}

function getShipPartRepairCost(slot) {
  const health = ensureShipPartHealth()[slot];
  if (!health || health.hp >= getShipPartMaxHealth(slot, health.partId)) return 0;
  const part = getShipPart(health.partId);
  const maxHealth = getShipPartMaxHealth(slot, health.partId);
  if (!part || maxHealth <= 0) return 0;
  return Math.max(1, Math.ceil(part.price * (maxHealth - health.hp) / maxHealth));
}

function renderRepairPanel() {
  repairOptions.replaceChildren();
  const health = ensureShipPartHealth();
  const slotNames = {
    center: 'Centro', propulsor: 'Propulsor', leftWing: 'Ala izquierda',
    rightWing: 'Ala derecha', tip: 'Punta',
  };
  const damagedSlots = Object.keys(SHIP_PART_BASE_HEALTH).filter((slot) =>
    game.player.shipParts[slot] && health[slot] && health[slot].hp < getShipPartMaxHealth(slot, health[slot].partId)
  );
  for (const slot of [...repairSelectedSlots]) {
    if (!damagedSlots.includes(slot)) repairSelectedSlots.delete(slot);
  }

  if (!damagedSlots.length) {
    repairStatus.textContent = 'Todas las piezas equipadas están en buen estado.';
    repairSelectedButton.disabled = true;
    repairAllButton.disabled = true;
    return;
  }

  repairSelectedButton.disabled = false;
  repairAllButton.disabled = false;
  for (const slot of damagedSlots) {
    const partId = game.player.shipParts[slot];
    const part = getShipPart(partId);
    const maxHealth = getShipPartMaxHealth(slot, partId);
    const itemHealth = health[slot];
    const label = document.createElement('label');
    label.className = 'repair-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = slot;
    checkbox.checked = repairSelectedSlots.has(slot);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) repairSelectedSlots.add(slot);
      else repairSelectedSlots.delete(slot);
      const selectedCost = [...repairSelectedSlots].reduce(
        (total, selectedSlot) => total + getShipPartRepairCost(selectedSlot), 0
      );
      repairStatus.textContent = `Costo de la selección: ${selectedCost} créditos.`;
    });
    const text = document.createElement('span');
    text.textContent = `${slotNames[slot]} · ${part?.name ?? 'Pieza'} · ${Math.ceil(itemHealth.hp)}/${maxHealth} HP · $${getShipPartRepairCost(slot)}`;
    label.append(checkbox, text);
    repairOptions.append(label);
  }
  const selectedCost = [...repairSelectedSlots].reduce(
    (total, slot) => total + getShipPartRepairCost(slot), 0
  );
  repairStatus.textContent = `Créditos: ${game.player.credits} $ · Selección: ${selectedCost} $.`;
}

function repairShipParts(slots) {
  const health = ensureShipPartHealth();
  const repairableSlots = [...new Set(slots)].filter((slot) => getShipPartRepairCost(slot) > 0);
  if (!repairableSlots.length) {
    repairStatus.textContent = 'Selecciona al menos una pieza dañada para reparar.';
    return;
  }
  const totalCost = repairableSlots.reduce((total, slot) => total + getShipPartRepairCost(slot), 0);
  if (game.player.credits < totalCost) {
    repairStatus.textContent = `Te faltan créditos: necesitas ${totalCost} $ y tienes ${game.player.credits} $.`;
    return;
  }
  game.player.credits -= totalCost;
  for (const slot of repairableSlots) {
    health[slot].hp = getShipPartMaxHealth(slot, health[slot].partId);
    repairSelectedSlots.delete(slot);
  }
  updateShipStatsDisplay();
  updateHud();
  saveGameState();
  renderRepairPanel();
  repairStatus.textContent = `Piezas reparadas por ${totalCost} $.`;
}

function openRepairShop() {
  repairSelectedSlots.clear();
  toggleInventory(true);
  showInventoryView('repair');
}

repairSelectedButton.addEventListener('click', () => {
  repairShipParts([...repairSelectedSlots]);
});

repairAllButton.addEventListener('click', () => {
  repairShipParts(Object.keys(SHIP_PART_BASE_HEALTH));
});

function isNearHomeChest() {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet)) return false;
  const chest = getHomeChestPosition();
  return getSurfaceDistance(game.surface.x, game.surface.y, chest.x, chest.y) <= 64;
}

// ---------------------------------------------------------------- Mesa de trabajo (crafteo)
const CRAFT_GROUPS = [
  { key: 'center', title: 'Centro' },
  { key: 'propulsor', title: 'Propulsor' },
  { key: 'wing', title: 'Alas (par)' },
  { key: 'tip', title: 'Punta' },
  { key: 'gear', title: 'Equipo' },
];
const CRAFT_RECIPES = [
  { itemId: 'center-classic', group: 'center', cost: { metal: 6, crystal: 3 } },
  { itemId: 'center-reinforced', group: 'center', cost: { titanium: 15, cobalt: 8 } },
  { itemId: 'thruster-electric', group: 'propulsor', cost: { metal: 6, crystal: 5, energy: 20 } },
  { itemId: 'thruster-fuel', group: 'propulsor', cost: { metal: 10, crystal: 7, fuel: 6 } },
  { itemId: 'thruster-ammonia', group: 'propulsor', cost: { ammonia: 12, titanium: 8 } },
  { itemId: 'wing-fast', group: 'wing', cost: { metal: 8, crystal: 3 } },
  { itemId: 'wing-solar', group: 'wing', cost: { metal: 6, crystal: 7, energy: 20 } },
  { itemId: 'wing-titanium', group: 'wing', cost: { titanium: 10, metal: 10 } },
  { itemId: 'wing-graphene', group: 'wing', cost: { graphene: 12, iridium: 6 } },
  { itemId: 'tip-rudimentaria', group: 'tip', cost: { metal: 7, crystal: 1 } },
  { itemId: 'tip-sonic', group: 'tip', cost: { metal: 4, crystal: 3 } },
  { itemId: 'tip-cobalt', group: 'tip', cost: { cobalt: 8, crystal: 6 } },
  { itemId: 'tip-plasma', group: 'tip', cost: { xenon: 10, lithium: 8 } },
  { itemId: 'enemy-detector', group: 'gear', cost: { metal: 5, crystal: 5, energy: 10 } },
  { itemId: COBALTO_KNIFE_ITEM_ID, group: 'gear', cost: { cobalt: 12 } },
];

const craftPanel = document.createElement('section');
craftPanel.className = 'repair-panel';
craftPanel.hidden = true;
const craftIntro = document.createElement('p');
craftIntro.className = 'repair-intro';
craftIntro.textContent = 'Fabrica piezas y equipo con los recursos de tu inventario. Se gastan primero las unidades más baratas.';
const craftStatus = document.createElement('p');
craftStatus.className = 'repair-status';
const craftList = document.createElement('div');
craftList.className = 'repair-options';
craftPanel.append(craftIntro, craftStatus, craftList);
repairPanel.after(craftPanel);

function getHomeWorkbenchPosition() {
  return getHomeNpcPosition('workbench');
}

function isNearWorkbench() {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet)) return false;
  const bench = getHomeWorkbenchPosition();
  return getSurfaceDistance(game.surface.x, game.surface.y, bench.x, bench.y) <= 64;
}

function getCraftItemTemplate(itemId) {
  const part = getShipPart(itemId);
  if (part) {
    return { id: part.id, name: part.name, icon: '◆', color: '#8dffa9', sprite: part.src };
  }
  if (itemId === ENEMY_DETECTOR_ITEM.id) return { ...ENEMY_DETECTOR_ITEM };
  if (itemId === COBALTO_KNIFE_ITEM_ID) return { ...COBALTO_KNIFE_ITEM };
  return null;
}

function countInventoryItem(itemId) {
  return game.player.inventorySlots.reduce(
    (total, item) => (item?.id === itemId ? total + item.count : total), 0
  );
}

function createCraftRow(recipe) {
  const template = getCraftItemTemplate(recipe.itemId);
  if (!template) return document.createDocumentFragment();
  const row = document.createElement('div');
  row.className = 'craft-option';

  let icon;
  const previewSprite = getItemPreviewSprite(template);
  if (previewSprite) {
    icon = document.createElement('img');
    icon.className = 'craft-option-icon';
    setItemPreviewSource(icon, previewSprite);
    icon.alt = '';
  } else {
    icon = document.createElement('span');
    icon.className = 'craft-option-glyph';
    icon.style.color = template.color;
    icon.textContent = template.icon;
  }

  const info = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'craft-option-name';
  name.textContent = `${template.name} · En inventario: ${countInventoryItem(template.id)}`;
  const detail = document.createElement('div');
  detail.className = 'craft-option-detail';
  detail.textContent = getItemDescription(template);
  const cost = document.createElement('div');
  cost.className = 'craft-option-cost';
  let canCraft = freeCraftingMode;
  if (freeCraftingMode) {
    cost.textContent = 'GRATIS · modo /craft activado';
  } else {
    canCraft = true;
    Object.entries(recipe.cost).forEach(([key, need], index) => {
      const have = game.player.inventory[key] || 0;
      const enough = have >= need;
      if (!enough) canCraft = false;
      const resource = RESOURCE_CATALOG[key];
      const piece = document.createElement('span');
      piece.className = enough ? 'craft-need-ok' : 'craft-need-missing';
      piece.textContent = `${resource.name} ${have}/${need}${resource.environment ? ` (${getMissionResourceSource(key)})` : ''}`;
      if (index > 0) cost.append(' · ');
      cost.append(piece);
    });
  }
  info.append(name, detail, cost);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'craft-button';
  button.textContent = 'Fabricar';
  button.disabled = !canCraft;
  button.addEventListener('click', () => craftItem(recipe));

  row.append(icon, info, button);
  return row;
}

function renderCraftPanel() {
  const previousScroll = craftPanel.scrollTop;
  craftList.replaceChildren();
  for (const group of CRAFT_GROUPS) {
    const recipes = CRAFT_RECIPES.filter((recipe) => recipe.group === group.key);
    if (!recipes.length) continue;
    const heading = document.createElement('h2');
    heading.className = 'ship-part-title';
    heading.textContent = group.title;
    craftList.append(heading);
    for (const recipe of recipes) craftList.append(createCraftRow(recipe));
  }
  craftPanel.scrollTop = previousScroll;
}

function craftItem(recipe) {
  const template = getCraftItemTemplate(recipe.itemId);
  if (!template) return;
  normalizeInventoryLots();
  const missing = !freeCraftingMode && Object.entries(recipe.cost).some(
    ([key, need]) => (game.player.inventory[key] || 0) < need
  );
  if (missing) {
    craftStatus.textContent = 'Te faltan materiales.';
    renderCraftPanel();
    return;
  }

  // Sincroniza las ranuras con los recursos antes de gastarlos; si no cabe la pieza se devuelven.
  updateInventoryItemsGrid();
  const snapshot = {
    inventory: { ...game.player.inventory },
    lots: JSON.parse(JSON.stringify(game.player.inventoryLots)),
  };
  if (!freeCraftingMode) {
    for (const [key, need] of Object.entries(recipe.cost)) {
      game.player.inventoryLots[key].sort((a, b) => a.unitPrice - b.unitPrice);
      removeResourceFromInventory(key, need);
    }
  }
  updateInventoryItemsGrid();
  const added = addItemToInventory(template, 1);
  if (added < 1) {
    game.player.inventory = snapshot.inventory;
    game.player.inventoryLots = snapshot.lots;
    updateInventoryItemsGrid();
    craftStatus.textContent = 'No hay espacio en el inventario. Libera un stack e inténtalo de nuevo.';
    renderCraftPanel();
    return;
  }
  updateInventoryItemsGrid();
  saveGameState();
  craftStatus.textContent = `${template.name} fabricado y guardado en tu inventario.`;
  renderCraftPanel();
}

function openWorkbench() {
  toggleInventory(true);
  showInventoryView('craft');
  craftStatus.textContent = 'Elige qué fabricar. Los recursos se toman de tu inventario.';
}

function isNearEarthWanderer() {
  if (game.scene !== 'surface' || !isHomeworld(game.surface.planet) || !game.earthWanderer) return false;
  return getSurfaceDistance(game.surface.x, game.surface.y, game.earthWanderer.x, game.earthWanderer.y) <= 64;
}

function getEarthWandererGreetingFacing(npcKey, x, y) {
  const wanderer = game.earthWanderer;
  if (wanderer?.greetingTarget !== npcKey || wanderer.greetingPhase !== 'reply') return null;
  const dx = wanderer.x - x;
  const dy = wanderer.y - y;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}

function talkToEarthWanderer() {
  if (!game.earthWanderer) return;
  earthWandererDialogOpen = true;
  game.earthWanderer.talking = true;
  game.pointer.isDown = false;
  game.pointer.moveTarget = null;
  game.pointer.followPlanet = null;
  const tip = EARTH_WANDERER_TIPS[earthWandererTipIndex];
  earthWandererDialogText = tip;
  earthWandererTipIndex = (earthWandererTipIndex + 1) % EARTH_WANDERER_TIPS.length;
  if (messageTimeout !== null) {
    window.clearTimeout(messageTimeout);
    messageTimeout = null;
  }
  messageEl.classList.remove('message-visible');
  messageEl.textContent = '';
}

function closeEarthWandererDialog() {
  if (!earthWandererDialogOpen) return;
  earthWandererDialogOpen = false;
  if (game.earthWanderer) {
    game.earthWanderer.talking = false;
    game.earthWanderer.wait = 0.7;
  }
  if (messageTimeout !== null) {
    window.clearTimeout(messageTimeout);
    messageTimeout = null;
  }
  messageEl.classList.remove('message-visible');
  messageEl.textContent = '';
  earthWandererDialogText = '';
}

function openMerchantShop() {
  toggleInventory(true);
  currentMarketView = 'merchant';
  showInventoryView('market');
  marketStatus.textContent = 'Selecciona un objeto para ver su precio; haz doble clic para comerciar.';
}

function openHomeChest() {
  toggleInventory(true);
  showInventoryView('cofre');
}

function updateMarketPanel() {
  updateInventoryItemsGrid();
  marketInventory.textContent =
    `Créditos: ${game.player.credits} $ · Combustible: ${game.player.inventory.fuel}`;
  renderMarketGrid(merchantItemsGrid, merchantStock, 'merchant');
  renderMarketGrid(marketPlayerItemsGrid, game.player.inventorySlots, 'player');
  merchantItemsGrid.hidden = currentMarketView !== 'merchant';
  marketPlayerItemsGrid.hidden = currentMarketView !== 'player';
  marketPanel.querySelectorAll('[data-market-view]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.marketView === currentMarketView));
  });
}

function loadGameState() {
  if (!GAME_SAVE_KEY) return null;
  let serializedState;
  try {
    serializedState = localStorage.getItem(GAME_SAVE_KEY);
  } catch (error) {
    console.error('No se pudo leer la partida guardada.', error);
    return null;
  }
  if (!serializedState) {
    return null;
  }

  try {
    const savedState = JSON.parse(serializedState);
    const player = savedState?.player;
    if (
      !player ||
      !Number.isFinite(player.x) ||
      !Number.isFinite(player.y) ||
      !Number.isFinite(savedState.time) ||
      !Number.isFinite(savedState.savedAt)
    ) {
      console.error('La partida guardada tiene un formato no válido.');
      return null;
    }
    return savedState;
  } catch (error) {
    console.error('No se pudo interpretar la partida guardada.', error);
    return null;
  }
}

function getInventoryWindowGeometry() {
  if (!inventoryPanel.hidden) {
    const shellBounds = document.querySelector('.game-shell').getBoundingClientRect();
    const panelBounds = inventoryPanel.getBoundingClientRect();
    if (panelBounds.width > 0 && panelBounds.height > 0) {
      inventoryWindowGeometry = {
        left: panelBounds.left - shellBounds.left,
        top: panelBounds.top - shellBounds.top,
        width: panelBounds.width,
        height: panelBounds.height,
      };
    }
  }
  return inventoryWindowGeometry ? { ...inventoryWindowGeometry } : null;
}

function captureInventoryScrollPositions() {
  inventoryScrollPositions = {
    objects: inventoryItemsGrid.scrollTop,
    ship: shipPartsList.scrollTop,
    market: marketPanel.scrollTop,
    merchantItems: merchantItemsGrid.scrollTop,
    playerItems: marketPlayerItemsGrid.scrollTop,
  };
}

function applyInventoryScrollPositions() {
  inventoryItemsGrid.scrollTop = inventoryScrollPositions.objects;
  shipPartsList.scrollTop = inventoryScrollPositions.ship;
  marketPanel.scrollTop = inventoryScrollPositions.market;
  merchantItemsGrid.scrollTop = inventoryScrollPositions.merchantItems;
  marketPlayerItemsGrid.scrollTop = inventoryScrollPositions.playerItems;
}

function restoreInterfaceState(savedInterface) {
  if (!savedInterface || typeof savedInterface !== 'object') return;

  const validViews = ['menu', 'objetos', 'mapa', 'nave', 'market', 'help', 'radio', 'misiones'];
  if (validViews.includes(savedInterface.inventoryView)) {
    currentInventoryView = savedInterface.inventoryView;
  }
  if (['menu', 'objetos', 'mapa', 'nave', 'radio', 'misiones'].includes(savedInterface.lastInventoryTab)) {
    lastInventoryTab = savedInterface.lastInventoryTab;
  }
  if (['merchant', 'player'].includes(savedInterface.marketView)) {
    currentMarketView = savedInterface.marketView;
  }
  const scrollPositions = savedInterface.scrollPositions;
  if (scrollPositions && typeof scrollPositions === 'object') {
    for (const key of Object.keys(inventoryScrollPositions)) {
      if (Number.isFinite(scrollPositions[key]) && scrollPositions[key] >= 0) {
        inventoryScrollPositions[key] = scrollPositions[key];
      }
    }
  }
  if (typeof savedInterface.inventoryOpen === 'boolean') {
    inventoryPanel.hidden = !savedInterface.inventoryOpen;
  }
  const geometry = savedInterface.inventoryWindow;
  if (
    geometry &&
    Number.isFinite(geometry.left) &&
    Number.isFinite(geometry.top) &&
    Number.isFinite(geometry.width) &&
    Number.isFinite(geometry.height) &&
    geometry.width > 0 &&
    geometry.height > 0
  ) {
    inventoryWindowGeometry = {
      left: geometry.left,
      top: geometry.top,
      width: geometry.width,
      height: geometry.height,
    };
  }
}

function applyInventoryWindowGeometry() {
  if (!inventoryWindowGeometry) return;
  inventoryPanel.style.left = `${inventoryWindowGeometry.left}px`;
  inventoryPanel.style.top = `${inventoryWindowGeometry.top}px`;
  inventoryPanel.style.width = `${inventoryWindowGeometry.width}px`;
  inventoryPanel.style.height = `${inventoryWindowGeometry.height}px`;
  inventoryPanel.style.right = 'auto';
  inventoryPanel.style.bottom = 'auto';
  if (inventoryPanel.hidden) return;

  const shellBounds = document.querySelector('.game-shell').getBoundingClientRect();
  const panelBounds = inventoryPanel.getBoundingClientRect();
  const maxLeft = Math.max(0, shellBounds.width - panelBounds.width);
  const maxTop = Math.max(0, shellBounds.height - panelBounds.height);
  inventoryWindowGeometry.left = clamp(inventoryWindowGeometry.left, 0, maxLeft);
  inventoryWindowGeometry.top = clamp(inventoryWindowGeometry.top, 0, maxTop);
  inventoryPanel.style.left = `${inventoryWindowGeometry.left}px`;
  inventoryPanel.style.top = `${inventoryWindowGeometry.top}px`;
}

function serializePlanetReference(planet) {
  if (!planet?.star) return null;
  return {
    seed: planet.seed,
    chunkX: planet.star.chunkX,
    chunkY: planet.star.chunkY,
  };
}

function restoreNavigationState(savedNavigation) {
  if (!savedNavigation || typeof savedNavigation !== 'object') return;
  const moveTarget = savedNavigation.moveTarget;
  game.pointer.moveTarget = Number.isFinite(moveTarget?.x) && Number.isFinite(moveTarget?.y)
    ? { x: moveTarget.x, y: moveTarget.y }
    : null;
  game.pointer.followPlanet = null;

  const reference = savedNavigation.followPlanet;
  if (
    !Number.isFinite(reference?.seed) ||
    !Number.isFinite(reference?.chunkX) ||
    !Number.isFinite(reference?.chunkY)
  ) {
    return;
  }
  let planet = [...game.chunks.values()]
    .flatMap((chunk) => chunk.systems)
    .filter((star) => star.chunkX === reference.chunkX && star.chunkY === reference.chunkY)
    .flatMap((star) => star.planets)
    .find((candidate) => candidate.seed === reference.seed);
  if (!planet) {
    planet = createChunk(reference.chunkX, reference.chunkY).systems
      .flatMap((star) => star.planets)
      .find((candidate) => candidate.seed === reference.seed);
  }
  if (planet) {
    updatePlanetPosition(planet);
    game.pointer.moveTarget = null;
    game.pointer.followPlanet = planet;
  }
}

function saveGameState() {
  if (savingDisabled || !GAME_SAVE_KEY || (multiplayerEndpoint && !accountReady)) return;
  stackMatchingItems(game.player.inventorySlots, false);
  stackMatchingItems(game.player.chestSlots, true);
  captureInventoryScrollPositions();
  const savedAt = Date.now();
  const savedState = {
    player: {
      x: game.player.x,
      y: game.player.y,
      rotation: game.player.rotation,
      velocityX: game.player.velocityX,
      velocityY: game.player.velocityY,
      propulsionDistance: game.player.propulsionDistance,
      solarCharge: game.player.solarCharge,
      inventory: { ...game.player.inventory },
      inventoryLots: game.player.inventoryLots,
      hoverboardEquipped: game.player.hoverboardEquipped,
      hoverboardWorldStates: game.player.hoverboardWorldStates,
      surfaceHealth: game.player.surfaceHealth,
      surfaceEquipment: [...game.player.surfaceEquipment],
      regolitoGunAmmo: game.player.regolitoGunAmmo,
      regolitoGunHalfCredit: game.player.regolitoGunHalfCredit,
      regolitoGunReloadUntil: game.player.regolitoGunReloadUntil,
      regolitoGunReloadAmmo: game.player.regolitoGunReloadAmmo,
      regolitoGunReloadStartedAt: game.player.regolitoGunReloadStartedAt,
      credits: game.player.credits,
      inventorySlots: game.player.inventorySlots,
      chestSlots: game.player.chestSlots,
      shipParts: { ...game.player.shipParts },
      shipPartHealth: { ...ensureShipPartHealth() },
      hue: game.player.hue,
    },
    merchantStock: merchantStock.map((item) => item.count),
    nextMerchantRestockAt,
    earthMissionStatus,
    earthMissionIndex,
    earthMission,
    earthMissionKillProgress,
    earthKillMissionPending,
    planetResourceStates: game.player.planetResourceStates,
    emergencyService: game.emergencyService,
    emergencyReturn: game.emergencyReturn,
    emergencyReturnCause: game.emergencyReturnCause,
    emergencyCapsule: game.emergencyCapsule,
    fuelBonusGranted: true,
    shipHealthScale: SHIP_HEALTH_SCALE,
    time: game.time,
    playerZoom,
    inventoryMapZoom,
    interface: {
      inventoryOpen: !inventoryPanel.hidden,
      inventoryView: currentInventoryView,
      lastInventoryTab,
      marketView: currentMarketView,
      inventoryWindow: getInventoryWindowGeometry(),
      scrollPositions: { ...inventoryScrollPositions },
    },
    navigation: {
      moveTarget: game.pointer.moveTarget,
      followPlanet: serializePlanetReference(game.pointer.followPlanet),
    },
    savedAt,
    scene: game.scene,
  };
  if (game.scene === 'surface' && game.surface) {
    savedState.surface = {
      worldVersion: 2,
      planetSeed: game.surface.planet.seed,
      starChunkX: game.surface.planet.star.chunkX,
      starChunkY: game.surface.planet.star.chunkY,
      x: game.surface.x / SURFACE_WORLD_SIZE,
      y: game.surface.y / SURFACE_WORLD_SIZE,
      baseViewportWidth: game.surface.baseViewportWidth,
      baseViewportHeight: game.surface.baseViewportHeight,
      facing: game.surface.facing,
    };
  }

  try {
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(savedState));
    lastGameSaveAt = savedAt;
  } catch (error) {
    console.error('No se pudo guardar la partida.', error);
  }
}

function saveGameStateIfDue() {
  if (Date.now() - lastGameSaveAt >= 1000) {
    saveGameState();
  }
}

function restoreGameState(savedState) {
  game.time = savedState.time + Math.max(0, (Date.now() - savedState.savedAt) / 1000);
  game.player.regolitoGunAmmo = clamp(
    Number.isInteger(savedState.player.regolitoGunAmmo) ? savedState.player.regolitoGunAmmo : REGOLITO_GUN_MAGAZINE_SIZE,
    0,
    REGOLITO_GUN_MAGAZINE_SIZE
  );
  game.player.regolitoGunHalfCredit = savedState.player.regolitoGunHalfCredit === 1 ? 1 : 0;
  game.player.regolitoGunReloadUntil = Number.isFinite(savedState.player.regolitoGunReloadUntil)
    ? Math.max(0, savedState.player.regolitoGunReloadUntil)
    : 0;
  game.player.regolitoGunReloadAmmo = clamp(
    Number.isInteger(savedState.player.regolitoGunReloadAmmo) ? savedState.player.regolitoGunReloadAmmo : 0,
    0,
    REGOLITO_GUN_MAGAZINE_SIZE
  );
  game.player.regolitoGunReloadStartedAt = Number.isFinite(savedState.player.regolitoGunReloadStartedAt)
    ? savedState.player.regolitoGunReloadStartedAt
    : 0;
  game.emergencyReturn = Boolean(savedState.emergencyReturn);
  game.emergencyReturnCause = savedState.emergencyReturnCause ?? null;
  game.emergencyCapsule = savedState.emergencyCapsule ?? null;
  const savedService = savedState.emergencyService;
  if (
    savedService && ['delivery', 'tow'].includes(savedService.type) &&
    ['inbound', 'waiting-space', 'towing', 'returning', 'pilot-escape'].includes(savedService.phase) &&
    Number.isFinite(savedService.arrivalAt)
  ) {
    const serviceEarth = game.homeStar?.planets.find(isHomeworld) ?? game.planets.find(isHomeworld);
    const restoredShip = serviceEarth && savedService.phase !== 'pilot-escape'
      ? createEmergencyServiceShip(serviceEarth, savedState.player.x, savedState.player.y, Math.max(15, savedService.arrivalAt - (savedService.startedAt ?? savedState.time)))
      : null;
    const savedShip = savedService.ship;
    if (restoredShip && savedShip && Number.isFinite(savedShip.x) && Number.isFinite(savedShip.y)) {
      restoredShip.x = savedShip.x;
      restoredShip.y = savedShip.y;
      restoredShip.velocityX = Number.isFinite(savedShip.velocityX) ? savedShip.velocityX : 0;
      restoredShip.velocityY = Number.isFinite(savedShip.velocityY) ? savedShip.velocityY : 0;
      restoredShip.angle = Number.isFinite(savedShip.angle) ? savedShip.angle : restoredShip.angle;
      restoredShip.flameBend = Number.isFinite(savedShip.flameBend) ? savedShip.flameBend : 0;
      restoredShip.speed = Number.isFinite(savedShip.speed)
        ? Math.max(EMERGENCY_SERVICE_SPEED, clamp(savedShip.speed, 50, restoredShip.stats.maxSpeed))
        : restoredShip.speed;
      restoredShip.stats.maxSpeed = restoredShip.speed;
      restoredShip.hp = Number.isFinite(savedShip.hp)
        ? clamp(savedShip.hp, 0, restoredShip.stats.maxHealth)
        : restoredShip.stats.maxHealth;
      restoredShip.propulsionAbilityReadyAt = Number.isFinite(savedShip.propulsionAbilityReadyAt)
        ? savedShip.propulsionAbilityReadyAt
        : 0;
      restoredShip.propulsionBoost = savedShip.propulsionBoost ?? null;
    }
    game.emergencyService = {
      type: savedService.type,
      phase: savedService.phase,
      resourceKey: Object.hasOwn(RESOURCE_CATALOG, savedService.resourceKey) ? savedService.resourceKey : null,
      arrivalAt: savedService.arrivalAt,
      startedAt: Number.isFinite(savedService.startedAt) ? savedService.startedAt : savedService.arrivalAt - 15,
      originX: Number.isFinite(savedService.originX) ? savedService.originX : null,
      originY: Number.isFinite(savedService.originY) ? savedService.originY : null,
      targetX: Number.isFinite(savedService.targetX) ? savedService.targetX : null,
      targetY: Number.isFinite(savedService.targetY) ? savedService.targetY : null,
      ship: restoredShip,
      pilotCapsule: savedService.phase === 'pilot-escape' && savedService.pilotCapsule
        ? { ...savedService.pilotCapsule }
        : null,
    };
    if (savedService.type === 'tow' && savedService.phase === 'towing') {
      game.emergencyReturn = true;
      game.emergencyReturnCause = 'tow';
    }
  }
  playerZoom = clamp(
    Number.isFinite(savedState.playerZoom) ? savedState.playerZoom : 1,
    savedState.scene === 'surface' ? MIN_PLAYER_ZOOM : MIN_SPACE_PLAYER_ZOOM,
    MAX_PLAYER_ZOOM
  );
  if (savedState.scene === 'surface') playerZoom = SURFACE_PLAYER_ZOOM;
  game.player.x = savedState.player.x;
  game.player.y = savedState.player.y;
  game.player.rotation = Number.isFinite(savedState.player.rotation)
    ? savedState.player.rotation
    : 0;
  game.player.velocityX = Number.isFinite(savedState.player.velocityX)
    ? savedState.player.velocityX
    : 0;
  game.player.velocityY = Number.isFinite(savedState.player.velocityY)
    ? savedState.player.velocityY
    : 0;
  game.player.solarCharge = Number.isFinite(savedState.player.solarCharge)
    ? clamp(savedState.player.solarCharge, 0, SOLAR_PANEL_INTERVAL)
    : 0;
  game.player.surfaceHealth = Number.isFinite(savedState.player.surfaceHealth)
    ? clamp(Math.round(savedState.player.surfaceHealth), 0, 3)
    : 3;
  game.player.propulsionDistance = Number.isFinite(savedState.player.propulsionDistance)
    ? Math.max(0, savedState.player.propulsionDistance)
    : 0;
  inventoryMapZoom = clamp(
    Number.isFinite(savedState.inventoryMapZoom) ? savedState.inventoryMapZoom : 1,
    MIN_INVENTORY_MAP_ZOOM,
    MAX_INVENTORY_MAP_ZOOM
  );
  restoreInterfaceState(savedState.interface);
  const savedInventory = savedState.player.inventory;
  if (savedInventory && typeof savedInventory === 'object') {
    for (const resource of Object.keys(RESOURCE_CATALOG)) {
      if (Number.isFinite(savedInventory[resource]) && savedInventory[resource] >= 0) {
        game.player.inventory[resource] = savedInventory[resource];
      }
    }
    const savedInventoryLots = savedState.player.inventoryLots;
    if (savedInventoryLots && typeof savedInventoryLots === 'object') {
      game.player.inventoryLots = savedInventoryLots;
    }
  }
  if (Number.isFinite(savedState.player.credits) && savedState.player.credits >= 0) {
    game.player.credits = savedState.player.credits;
  }
  if (Array.isArray(savedState.player.inventorySlots) && savedState.player.inventorySlots.length === 100) {
    game.player.inventorySlots = savedState.player.inventorySlots.map((item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        item.id.startsWith('test-') ||
        !Number.isFinite(item.count) ||
        item.count <= 0
      ) {
        return null;
      }
      return {
        id: item.id,
        name: item.name,
        icon: typeof item.icon === 'string' ? item.icon : '?',
        color: typeof item.color === 'string' ? item.color : '#ffffff',
        count: item.count,
        ...(typeof item.sprite === 'string' ? { sprite: item.sprite } : {}),
        ...(typeof item.description === 'string' ? { description: item.description } : {}),
        ...(Array.isArray(item.priceLots)
          ? { priceLots: item.priceLots.map((lot) => ({ unitPrice: lot.unitPrice, count: lot.count })) }
          : {}),
        ...(Number.isFinite(item.unitPrice) && item.unitPrice >= 0
          ? { unitPrice: item.unitPrice }
          : {}),
        ...(Object.hasOwn(RESOURCE_CATALOG, item.resourceKey)
          ? { resourceKey: item.resourceKey }
          : {}),
      };
    });
  }
  if (Array.isArray(savedState.player.chestSlots) && savedState.player.chestSlots.length === 100) {
    game.player.chestSlots = savedState.player.chestSlots.map((item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        item.id.startsWith('test-') ||
        !Number.isInteger(item.count) ||
        item.count <= 0 ||
        item.count > MAX_ITEM_STACK
      ) {
        return null;
      }
      return {
        id: item.id,
        name: item.name,
        icon: typeof item.icon === 'string' ? item.icon : '?',
        color: typeof item.color === 'string' ? item.color : '#ffffff',
        count: item.count,
        ...(typeof item.sprite === 'string' ? { sprite: item.sprite } : {}),
        ...(Object.hasOwn(RESOURCE_CATALOG, item.resourceKey)
          ? { resourceKey: item.resourceKey } : {}),
        ...(Number.isFinite(item.unitPrice) && item.unitPrice >= 0
          ? { unitPrice: item.unitPrice } : {}),
        ...(Array.isArray(item.priceLots)
          ? { priceLots: item.priceLots.filter((lot) => Number.isFinite(lot.unitPrice) && Number.isInteger(lot.count) && lot.count > 0).map((lot) => ({ unitPrice: lot.unitPrice, count: lot.count })) }
          : (item.resourceKey ? { priceLots: [{ unitPrice: item.unitPrice ?? RESOURCE_SELL_PRICES[item.resourceKey], count: item.count }] } : {})),
        ...(typeof item.description === 'string' ? { description: item.description } : {}),
      };
    });
  }
  ensureHoverboardInventoryItem();
  if (Array.isArray(savedState.player.collectedPickupIds)) {
    game.player.collectedPickupIds = new Set(
      savedState.player.collectedPickupIds.filter((id) => typeof id === 'string')
    );
  }
  restorePlanetResourceStates(savedState.planetResourceStates);
  if (Array.isArray(savedState.merchantStock)) {
    const savedStock = savedState.merchantStock;
    merchantStock.forEach((item, index) => {
      const count = savedStock[index];
      if (Number.isInteger(count) && count >= 0 && count <= 99) {
        item.count = count;
      }
    });
  }
  earthMissionIndex = Number.isSafeInteger(savedState.earthMissionIndex) && savedState.earthMissionIndex >= 0
    ? savedState.earthMissionIndex
    : savedState.earthMissionStatus === 'done' ? 1 : 0;
  const savedMission = savedState.earthMission;
  earthKillMissionPending = typeof savedState.earthKillMissionPending === 'boolean'
    ? savedState.earthKillMissionPending
    : earthMissionIndex > 0 && !['destroy', 'kill_surface'].includes(savedMission?.type);
  const validMissionNeeds = savedMission?.need && typeof savedMission.need === 'object'
    ? Object.entries(savedMission.need).filter(([key, count]) =>
      Object.hasOwn(RESOURCE_CATALOG, key) && key !== 'energy' && key !== 'fuel' &&
      Number.isInteger(count) && count > 0
    )
    : [];
  if (
    savedMission?.type === 'destroy' &&
    Number.isInteger(savedMission.targetKills) && savedMission.targetKills > 0 &&
    Number.isFinite(savedMission.rewardCredits)
  ) {
    earthMission = {
      type: 'destroy',
      targetKills: savedMission.targetKills,
      rewardCredits: savedMission.rewardCredits,
    };
  } else if (
    savedMission?.type === 'kill_surface' &&
    ['martian', 'lunatic'].includes(savedMission.targetEnemyType) &&
    Number.isInteger(savedMission.targetKills) && savedMission.targetKills > 0 &&
    Number.isFinite(savedMission.rewardCredits)
  ) {
    earthMission = {
      type: 'kill_surface',
      targetEnemyType: savedMission.targetEnemyType,
      targetKills: savedMission.targetKills,
      rewardCredits: savedMission.targetEnemyType === 'lunatic' ? 2500 : 1000,
    };
  } else if (earthMissionIndex === 0) {
    // Introduce el contrato de combate a partidas antiguas antes de la primera misión.
    earthMission = createEarthMission(earthMissionIndex);
  } else if (validMissionNeeds.length > 0 && Number.isFinite(savedMission.rewardCredits)) {
    const need = Object.fromEntries(validMissionNeeds);
    const { rewardCredits, rewardMultiplier } = getEarthMissionReward(need, earthMissionIndex);
    earthMission = {
      type: 'resources',
      need,
      rewardCredits: Math.max(savedMission.rewardCredits, rewardCredits),
      scale: savedMission.scale,
      rewardMultiplier,
    };
  } else {
    earthMission = createEarthMission(earthMissionIndex);
  }
  earthMissionStatus = ['available', 'active'].includes(savedState.earthMissionStatus)
    ? savedState.earthMissionStatus
    : 'available';
  earthMissionKillProgress = ['destroy', 'kill_surface'].includes(earthMission.type) && earthMissionStatus === 'active'
    ? clamp(Math.floor(savedState.earthMissionKillProgress || 0), 0, earthMission.targetKills)
    : 0;
  if (Number.isFinite(savedState.nextMerchantRestockAt)) {
    nextMerchantRestockAt = savedState.nextMerchantRestockAt;
  }
  game.player.hoverboardEquipped = Boolean(savedState.player.hoverboardEquipped);
  game.player.hoverboardWorldStates = savedState.player.hoverboardWorldStates &&
    typeof savedState.player.hoverboardWorldStates === 'object'
    ? Object.fromEntries(Object.entries(savedState.player.hoverboardWorldStates)
      .filter(([, state]) => state && typeof state.deployed === 'boolean' &&
        Number.isFinite(state.x) && Number.isFinite(state.y))
      .map(([key, state]) => [key, {
        deployed: state.deployed,
        x: wrapSurfaceCoordinate(state.x),
        y: wrapSurfaceCoordinate(state.y),
      }]))
    : {};
  const savedSurfaceEquipment = Array.isArray(savedState.player.surfaceEquipment)
    ? savedState.player.surfaceEquipment
    : (game.player.hoverboardEquipped ? [HOVERBOARD_ITEM_ID] : []);
  game.player.surfaceEquipment = [null, null, null];
  for (const itemId of savedSurfaceEquipment) {
    if (
      isSurfaceUsableItem(itemId) &&
      hasInventoryItem(itemId) &&
      !game.player.surfaceEquipment.includes(itemId)
    ) {
      const emptyIndex = game.player.surfaceEquipment.findIndex((slot) => !slot);
      if (emptyIndex >= 0) game.player.surfaceEquipment[emptyIndex] = itemId;
    }
  }
  if (Number.isFinite(savedState.player.hue)) {
    game.player.hue = ((Math.round(savedState.player.hue) % 360) + 360) % 360;
  }
  const savedShipParts = savedState.player.shipParts;
  if (savedShipParts && typeof savedShipParts === 'object') {
    for (const [group, parts] of Object.entries(SHIP_PARTS)) {
      const allowedIds = parts.map((part) => part.id);
      if (group === 'wing') {
        for (const wingKey of ['leftWing', 'rightWing']) {
          const savedId = savedShipParts[wingKey];
          if (savedId === null || allowedIds.includes(savedId)) {
            game.player.shipParts[wingKey] = savedId;
          }
        }
      } else {
        const savedId = savedShipParts[group];
        if (savedId === null || allowedIds.includes(savedId)) {
          game.player.shipParts[group] = savedId;
        }
      }
    }
  }
  if (savedState.player.shipPartHealth && typeof savedState.player.shipPartHealth === 'object') {
    const oldHealthScale = Number.isFinite(savedState.shipHealthScale) && savedState.shipHealthScale > 0
      ? savedState.shipHealthScale
      : 1;
    const healthMigrationFactor = SHIP_HEALTH_SCALE / oldHealthScale;
    game.player.shipPartHealth = Object.fromEntries(
      Object.entries(savedState.player.shipPartHealth)
        .filter(([slot, health]) =>
          Object.hasOwn(SHIP_PART_BASE_HEALTH, slot) && health &&
          typeof health.partId === 'string' && Number.isFinite(health.hp) && health.hp >= 0
        )
        .map(([slot, health]) => [slot, {
          partId: health.partId,
          hp: health.hp * healthMigrationFactor,
        }])
    );
  }
  ensureShipPartHealth();
  stackMatchingItems(game.player.inventorySlots, false);
  stackMatchingItems(game.player.chestSlots, true);
  game.scene = 'space';
  game.surface = null;
  updateVisibleChunks();
  updatePlanetPositions();
  restoreNavigationState(savedState.navigation);

  if (savedState.scene !== 'surface') {
    return true;
  }
  if (
    !Number.isFinite(savedState.surface?.planetSeed) ||
    !Number.isFinite(savedState.surface?.starChunkX) ||
    !Number.isFinite(savedState.surface?.starChunkY) ||
    !Number.isFinite(savedState.surface?.x) ||
    !Number.isFinite(savedState.surface?.y)
  ) {
    return false;
  }

  const { planetSeed, starChunkX, starChunkY } = savedState.surface;
  let planet = game.planets.find((candidate) =>
    candidate.seed === planetSeed &&
    candidate.star.chunkX === starChunkX &&
    candidate.star.chunkY === starChunkY
  );
  if (!planet) {
    const planetChunk = createChunk(starChunkX, starChunkY);
    planet = planetChunk.systems
      .flatMap((star) => star.planets)
      .find((candidate) => candidate.seed === planetSeed);
  }
  if (!planet) {
    console.error('No se encontró el planeta de la última partida.');
    return true;
  }

  game.selectedPlanet = planet;
  updatePlanetPositions();
  game.scene = 'surface';
  const hasExpandedSurfaceCoordinates = savedState.surface.worldVersion === 2;
  const legacySurfaceX = savedState.surface.x * game.width;
  const legacySurfaceY = savedState.surface.y * game.height;
  const shipX = SURFACE_WORLD_SIZE * 0.58125;
  const shipY = SURFACE_WORLD_SIZE * 0.6;
  game.surface = {
    planet,
    pickups: createPlanetPickups(planet),
    x: hasExpandedSurfaceCoordinates
      ? wrapSurfaceCoordinate(savedState.surface.x * SURFACE_WORLD_SIZE)
      : wrapSurfaceCoordinate(shipX + legacySurfaceX - game.width * 0.58125),
    y: hasExpandedSurfaceCoordinates
      ? wrapSurfaceCoordinate(savedState.surface.y * SURFACE_WORLD_SIZE)
      : wrapSurfaceCoordinate(shipY + legacySurfaceY - game.height * 0.6),
    facing: ['up', 'down', 'left', 'right'].includes(savedState.surface.facing)
      ? savedState.surface.facing
      : 'down',
    isMoving: false,
    animationFrame: 1,
    animationTimer: 0,
    weaponCooldown: 0,
    shotUntil: 0,
    shipX,
    shipY,
    baseViewportWidth: Number.isFinite(savedState.surface.baseViewportWidth)
      ? savedState.surface.baseViewportWidth
      : game.width,
    baseViewportHeight: Number.isFinite(savedState.surface.baseViewportHeight)
      ? savedState.surface.baseViewportHeight
      : game.height,
  };
  Object.assign(game.surface, snapSurfacePoint(game.surface.x, game.surface.y));
  return true;
}

// Distancia máxima a la nave para subir (la misma que usa Enter).
const AUTO_BOARD_DISTANCE = 100;

// Despega del planeta actual; con `navigation` ({ planet } o { target }) deja el piloto automático puesto.
function launchFromSurface(navigation = null) {
  if (game.scene !== 'surface') return;
  const planet = game.surface.planet;
  const orbitalVelocity = getPlanetVelocity(planet);
  game.player.x = planet.x + planet.radius + game.player.radius + 4;
  game.player.y = planet.y;
  // Pequeño tirón al despegar: impulso hacia afuera del planeta.
  game.player.velocityX = orbitalVelocity.x + TAKEOFF_KICK_SPEED;
  game.player.velocityY = orbitalVelocity.y;
  if (Math.hypot(game.player.velocityX, game.player.velocityY) > 1) {
    game.player.rotation =
      Math.atan2(game.player.velocityY, game.player.velocityX) + Math.PI / 2;
  }
  game.scene = 'space';
  game.surfaceProjectiles.length = 0;
  game.surface = null;
  if (navigation?.planet) {
    game.pointer.moveTarget = null;
    game.pointer.followPlanet = navigation.planet;
  } else if (navigation?.target) {
    game.pointer.moveTarget = { x: navigation.target.x, y: navigation.target.y };
    game.pointer.followPlanet = null;
  }
  updateVisibleChunks();
  setMessage(navigation?.planet ? `Rumbo a ${navigation.planet.name}` : navigation?.target ? 'Rumbo al destino' : 'Espacio');
  updateHud();
  saveGameState();
}

// Camino más corto (por casillas libres) hasta quedar a distancia de abordaje de la nave.
// Devuelve { x, y } con el primer paso, null si ya está cerca, o undefined si no hay camino.
function findSurfacePathToShip(surf, searchRadiusTiles = 32) {
  const ship = getSurfaceShipPosition();
  const deltaX = getSurfaceAxisDelta(ship.x, surf.x);
  const deltaY = getSurfaceAxisDelta(ship.y, surf.y);
  // En trayectos largos avanza por el eje principal; al bloquearse, usa el buscador local.
  if (Math.hypot(deltaX, deltaY) > SURFACE_TILE * 24) {
    const directions = Math.abs(deltaX) >= Math.abs(deltaY)
      ? [[Math.sign(deltaX), 0], [0, Math.sign(deltaY)]]
      : [[0, Math.sign(deltaY)], [Math.sign(deltaX), 0]];
    for (const [dx, dy] of directions) {
      if (!dx && !dy) continue;
      const nextX = wrapSurfaceCoordinate(surf.x + dx * SURFACE_TILE);
      const nextY = wrapSurfaceCoordinate(surf.y + dy * SURFACE_TILE);
      const avoidTile = surf.autoPathAvoidTile;
      const isTemporarilyAvoided = avoidTile?.until > game.time &&
        wrapCell(Math.floor(avoidTile.x / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) ===
          Math.floor(nextX / SURFACE_TILE) &&
        wrapCell(Math.floor(avoidTile.y / SURFACE_TILE), SURFACE_WORLD_SIZE / SURFACE_TILE) ===
          Math.floor(nextY / SURFACE_TILE);
      if (!isTemporarilyAvoided && !isSurfaceTileBlocked(nextX, nextY, surf.x, surf.y)) {
        return { x: dx, y: dy };
      }
    }
  }
  const columnCount = SURFACE_WORLD_SIZE / SURFACE_TILE;
  const toPosition = (col, row) => ({
    x: wrapCell(col, columnCount) * SURFACE_TILE + SURFACE_TILE / 2,
    y: wrapCell(row, columnCount) * SURFACE_TILE + SURFACE_TILE / 2,
  });
  const startCol = wrapCell(Math.round((surf.x - SURFACE_TILE / 2) / SURFACE_TILE), columnCount);
  const startRow = wrapCell(Math.round((surf.y - SURFACE_TILE / 2) / SURFACE_TILE), columnCount);
  const searchOrigin = { x: surf.x, y: surf.y };
  const queue = [{ col: startCol, row: startRow, first: null }];
  const visited = new Set([`${startCol},${startRow}`]);
  for (let head = 0; head < queue.length; head += 1) {
    const node = queue[head];
    const position = toPosition(node.col, node.row);
    if (getSurfaceDistance(position.x, position.y, ship.x, ship.y) <= AUTO_BOARD_DISTANCE) {
      return node.first;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const col = wrapCell(node.col + dx, columnCount);
      const row = wrapCell(node.row + dy, columnCount);
      const key = `${col},${row}`;
      if (visited.has(key)) continue;
      const next = toPosition(col, row);
      if (getSurfaceDistance(next.x, next.y, searchOrigin.x, searchOrigin.y) > SURFACE_TILE * searchRadiusTiles) continue;
      const avoidTile = surf.autoPathAvoidTile;
      if (avoidTile?.until > game.time &&
        wrapCell(Math.floor(avoidTile.x / SURFACE_TILE), columnCount) === col &&
        wrapCell(Math.floor(avoidTile.y / SURFACE_TILE), columnCount) === row) continue;
      if (isSurfaceTileBlocked(next.x, next.y, position.x, position.y)) continue;
      visited.add(key);
      queue.push({ col, row, first: node.first ?? { x: dx, y: dy } });
    }
  }
  return undefined;
}

function handleEnter() {
  if (game.scene === 'surface') {
    const shipPosition = getSurfaceShipPosition();
    const distanceToShip = getSurfaceDistance(game.surface.x, game.surface.y, shipPosition.x, shipPosition.y);

    if (distanceToShip <= 110) {
      askConfirm('¿Subir a la nave y despegar?', () => launchFromSurface());
    }
    return;
  }

  const planet = getNearestPlanet();
  if (!planet) return;

  askConfirm(`¿Aterrizar en ${planet.name}?`, () => {
    if (game.scene === 'space') enterPlanet(planet);
  });
}

function interactWithSurface() {
  if (game.scene !== 'surface') {
    setMessage('Los recursos se recogen en la superficie de los planetas.');
    return;
  }

  const board = game.surface.hoverboard;
  const boardDistance = board?.deployed
    ? getSurfaceDistance(game.surface.x, game.surface.y, board.x, board.y)
    : Infinity;
  const nearbyPickup = getSurfacePickupCandidates(
    game.surface.x,
    game.surface.y,
    56,
    56
  )
    .map((pickup) => ({
      pickup,
      distance: getSurfaceDistance(pickup.x, pickup.y, game.surface.x, game.surface.y),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (nearbyPickup?.distance <= 56 && nearbyPickup.distance < boardDistance) {
    const { pickup } = nearbyPickup;
    const pickupCount = pickup.count;
    const unitPrice = getPlanetResourceSellPrice(game.surface.planet, pickup.resourceKey);
    const availableResourceCapacity = getAvailableResourceCapacity(
      pickup.resourceKey,
      unitPrice
    );
    if (availableResourceCapacity < pickupCount) {
      setMessage('No hay espacio suficiente en el inventario para recoger este objeto.');
      return;
    }

    addResourceToInventory(
      pickup.resourceKey,
      pickupCount,
      unitPrice
    );
    game.player.collectedPickupIds.add(pickup.id);
    const planetState = getPlanetResourceState(game.surface.planet);
    planetState.pickups = planetState.pickups.filter((item) => item.id !== pickup.id);
    game.surface.pickups = game.surface.pickups.filter((item) => item.id !== pickup.id);
    updateInventoryItemsGrid();
    updateHud();
    saveGameState();
    setMessage(`Recogiste ${pickupCount} ${pickup.name.toLowerCase()}.`);
    return;
  }

  if (boardDistance <= SURFACE_TILE * 4) {
    beginHoverboardMount();
    return;
  }

  if (isNearRepairer()) {
    openRepairShop();
  } else if (isNearQuestGiver()) {
    talkToQuestGiver();
  } else if (isNearMerchant()) {
    openMerchantShop();
  } else if (isNearEarthWanderer()) {
    talkToEarthWanderer();
  } else if (isNearHomeChest()) {
    openHomeChest();
  } else if (isNearWorkbench()) {
    openWorkbench();
  } else if (!nearbyPickup) {
    setMessage('No quedan objetos cerca para recoger.');
  }
}

function interactWithWorld() {
  if (game.scene === 'surface') {
    const shipPosition = getSurfaceShipPosition();
    const distanceToShip = getSurfaceDistance(game.surface.x, game.surface.y, shipPosition.x, shipPosition.y);
    if (distanceToShip <= 110) {
      handleEnter();
      return;
    }
    interactWithSurface();
    return;
  }
  handleEnter();
}

function spawnHostileDrone() {
  const angle = Math.random() * Math.PI * 2;
  const distance = CHUNK_SIZE * 4;
  const choosePart = (group) => {
    const parts = SHIP_PARTS[group].filter((part) => !part.craftOnly);
    return parts[Math.floor(Math.random() * parts.length)].id;
  };
  const shipParts = {
    center: choosePart('center'),
    propulsor: choosePart('propulsor'),
    leftWing: choosePart('wing'),
    rightWing: choosePart('wing'),
    tip: choosePart('tip'),
  };
  const partStats = Object.fromEntries(
    Object.entries(shipParts).map(([slot, partId]) => [slot, getShipPart(partId)?.stats ?? {}])
  );
  const wingSpeedMultiplier = [partStats.leftWing, partStats.rightWing]
    .reduce((multiplier, stats) => multiplier * (stats.speedMultiplier ?? 1), 1);
  const maxHealth = Object.entries(shipParts).reduce(
    (total, [slot, partId]) => total + getShipPartMaxHealth(slot, partId),
    0
  );
  const propulsor = getShipPart(shipParts.propulsor);
  const tipStats = partStats.tip;
  const stats = {
    maxSpeed: game.player.speed * wingSpeedMultiplier * (propulsor?.stats?.speedMultiplier ?? 1),
    acceleration: SHIP_ACCELERATION,
    maxHealth,
    fuelConsumptionDistance: propulsor?.stats?.fuelConsumptionDistance ?? Infinity,
    isFuelPropulsor: shipParts.propulsor === 'thruster-fuel',
    weaponDamage: tipStats.weaponDamage ?? 8,
    weaponCooldown: tipStats.weaponCooldown ?? 1.1,
    weaponProjectileSpeed: tipStats.weaponProjectileSpeed ?? 520,
    weaponShots: tipStats.weaponShots ?? 1,
  };
  game.hostileDrones.push({
    x: game.player.x + Math.cos(angle) * distance,
    y: game.player.y + Math.sin(angle) * distance,
    velocityX: 0,
    velocityY: 0,
    stats,
    hp: stats.maxHealth,
    fuel: MAX_ITEM_STACK * 2,
    fuelStacks: 2,
    propulsionDistance: 0,
    abilityDecisionTimer: 0.8 + Math.random() * 1.8,
    propulsionAbilityReadyAt: 0,
    propulsionBoost: null,
    centerAbilityReadyAt: 0,
    centerHomingUntil: 0,
    centerHomingAttacks: 0,
    fireTimer: Math.random() * stats.weaponCooldown,
    angle: angle + Math.PI / 2,
    shipParts,
  });
}

function getShipPartSlotAtImpact(x, y) {
  const dx = x - game.player.x;
  const dy = y - game.player.y;
  const cosine = Math.cos(game.player.rotation);
  const sine = Math.sin(game.player.rotation);
  const localX = dx * cosine + dy * sine;
  const localY = -dx * sine + dy * cosine;
  const locations = [
    ['center', 0, 0],
    ['propulsor', 0, 6],
    ['leftWing', -6, 0],
    ['rightWing', 6, 0],
    ['tip', 0, -6],
  ].filter(([slot]) => isShipPartOperational(slot));
  if (!locations.length) return null;
  locations.sort((a, b) =>
    Math.hypot(localX - a[1], localY - a[2]) - Math.hypot(localX - b[1], localY - b[2])
  );
  return locations[0][0];
}

function playShipShotSound(sourceX, sourceY) {
  const distance = Math.hypot(sourceX - game.player.x, sourceY - game.player.y);
  const chunksAway = distance / CHUNK_SIZE;
  const volume = clamp(0.25 * (1 - chunksAway / 5), 0, 0.25);
  if (volume <= 0) return;
  if (!shipShotSound) {
    shipShotSound = new Audio('sound/laserShoot.wav');
    shipShotSound.preload = 'auto';
  }
  const shot = shipShotSound.cloneNode();
  shot.volume = volume;
  shot.play().catch(() => {});
}

function updateHostileCombat(dt, controlsEnabled) {
  if (game.scene !== 'space') return;
  game.hostileSpawnTimer -= dt;
  if (game.hostileSpawnTimer <= 0) {
    if (game.hostileDrones.length < 1) spawnHostileDrone();
    game.hostileSpawnTimer = 42;
  }
  for (let index = game.hostileDrones.length - 1; index >= 0; index -= 1) {
    const drone = game.hostileDrones[index];
    const dx = game.player.x - drone.x;
    const dy = game.player.y - drone.y;
    const distance = Math.hypot(dx, dy);
    if (distance > CHUNK_SIZE * HOSTILE_LIFETIME_RANGE_CHUNKS) {
      game.hostileDrones.splice(index, 1);
      continue;
    }
    const isPursuing = distance <= CHUNK_SIZE * HOSTILE_PURSUIT_RANGE_CHUNKS;
    drone.abilityDecisionTimer -= dt;
    if (drone.abilityDecisionTimer <= 0) {
      drone.abilityDecisionTimer = 0.8 + Math.random() * 1.8;
      if (isPursuing && game.time >= drone.centerAbilityReadyAt && distance <= CHUNK_SIZE * 3 && Math.random() < 0.38) {
        drone.centerHomingUntil = game.time + CENTER_HOMING_DURATION;
        drone.centerHomingAttacks = CENTER_HOMING_SHOTS;
        drone.centerAbilityReadyAt = game.time + CENTER_ABILITY_COOLDOWN;
      }
      const propulsorProfile = getPropulsorAbilityProfile(drone.shipParts.propulsor);
      if (
        isPursuing && propulsorProfile && game.time >= drone.propulsionAbilityReadyAt &&
        (!drone.stats.isFuelPropulsor || drone.fuel > 0) && Math.random() < 0.32
      ) {
        drone.propulsionBoost = { ...propulsorProfile, startedAt: game.time };
        drone.propulsionAbilityReadyAt = game.time + propulsorProfile.cooldown;
      }
    }
    const boost = drone.propulsionBoost;
    let boostMultiplier = 1;
    if (boost) {
      const elapsed = game.time - boost.startedAt;
      if (elapsed < boost.peakDuration) {
        boostMultiplier = boost.peakMultiplier;
      } else if (elapsed < boost.peakDuration + boost.decayDuration && boost.decayDuration > 0) {
        const decayProgress = (elapsed - boost.peakDuration) / boost.decayDuration;
        boostMultiplier = 1 + (boost.peakMultiplier - 1) * (1 - decayProgress);
      } else {
        drone.propulsionBoost = null;
      }
    }
    const currentMaxSpeed = drone.stats.maxSpeed * boostMultiplier;
    // Calculan una trayectoria de persecución y aceleran en línea recta hacia ella, como el jugador.
    const leadTime = isPursuing
      ? clamp(distance / Math.max(currentMaxSpeed, 1), 0, 0.9)
      : 0;
    const targetX = game.player.x + game.player.velocityX * leadTime;
    const targetY = game.player.y + game.player.velocityY * leadTime;
    const targetDx = targetX - drone.x;
    const targetDy = targetY - drone.y;
    const targetDistance = Math.hypot(targetDx, targetDy);
    const targetDirectionX = targetDistance > 0 ? targetDx / targetDistance : 0;
    const targetDirectionY = targetDistance > 0 ? targetDy / targetDistance : 0;
    const desiredSpeed = isPursuing && distance > 115
      ? Math.min(currentMaxSpeed, (distance - 115) * 1.5)
      : 0;
    let desiredVelocityX = targetDirectionX * desiredSpeed;
    let desiredVelocityY = targetDirectionY * desiredSpeed;
    const hasFuel = !drone.stats.isFuelPropulsor || drone.fuel > 0;
    if (!hasFuel) {
      desiredVelocityX = 0;
      desiredVelocityY = 0;
    }
    let changeX = desiredVelocityX - drone.velocityX;
    let changeY = desiredVelocityY - drone.velocityY;
    const changeLength = Math.hypot(changeX, changeY);
    const maxChange = drone.stats.acceleration * dt;
    if (changeLength > maxChange) {
      changeX = (changeX / changeLength) * maxChange;
      changeY = (changeY / changeLength) * maxChange;
    }
    drone.velocityX += changeX;
    drone.velocityY += changeY;
    const speed = Math.hypot(drone.velocityX, drone.velocityY);
    if (speed > currentMaxSpeed) {
      drone.velocityX *= currentMaxSpeed / speed;
      drone.velocityY *= currentMaxSpeed / speed;
    }
    updateShipHeadingFromVelocity(drone, 'angle', dt);
    drone.x += drone.velocityX * dt;
    drone.y += drone.velocityY * dt;
    const travelSpeed = Math.hypot(drone.velocityX, drone.velocityY);
    if (drone.stats.isFuelPropulsor && drone.stats.fuelConsumptionDistance > 0) {
      drone.propulsionDistance += travelSpeed * dt;
      while (drone.fuel > 0 && drone.propulsionDistance >= drone.stats.fuelConsumptionDistance) {
        drone.propulsionDistance -= drone.stats.fuelConsumptionDistance;
        drone.fuel -= 1;
      }
      drone.fuelStacks = Math.ceil(drone.fuel / MAX_ITEM_STACK);
    }
    const aimAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const angleDelta = ((aimAngle - drone.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    drone.fireTimer -= dt;
    if (drone.fireTimer <= 0 && distance <= CHUNK_SIZE * HOSTILE_ATTACK_RANGE_CHUNKS && Math.abs(angleDelta) < 0.24) {
      const projectileSpeed = drone.stats.weaponProjectileSpeed * PROJECTILE_SPEED_MULTIPLIER;
      const usesHomingVolley = drone.centerHomingUntil > game.time && drone.centerHomingAttacks > 0;
      drone.muzzleFlashUntil = Date.now() + 65;
      drone.muzzleFlashShape = createMuzzleFlashShape();
      // La punta apunta hacia el frente de la nave: el rayo sigue esa dirección recta.
      const shotAngle = drone.angle - Math.PI / 2;
      const sideX = -Math.sin(shotAngle) * 3;
      const sideY = Math.cos(shotAngle) * 3;
      for (let shot = 0; shot < drone.stats.weaponShots; shot += 1) {
        const side = drone.stats.weaponShots > 1 ? (shot === 0 ? -1 : 1) : 0;
        game.hostileProjectiles.push({
          x: drone.x + Math.sin(drone.angle) * 6 + sideX * side,
          y: drone.y - Math.cos(drone.angle) * 6 + sideY * side,
          vx: Math.cos(shotAngle) * projectileSpeed,
          vy: Math.sin(shotAngle) * projectileSpeed,
          damage: drone.stats.weaponDamage,
          life: 5.2,
          homingTarget: usesHomingVolley ? game.player : null,
          homingUntil: drone.centerHomingUntil,
        });
      }
      playShipShotSound(drone.x, drone.y);
      if (usesHomingVolley) drone.centerHomingAttacks -= 1;
      drone.fireTimer = drone.stats.weaponCooldown;
    }
  }

  for (let index = game.hostileProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = game.hostileProjectiles[index];
    if (projectile.homingTarget === game.player && game.time < projectile.homingUntil) {
      const speed = Math.hypot(projectile.vx, projectile.vy);
      if (speed > 0) {
        const targetAngle = Math.atan2(
          game.player.y + game.player.velocityY * 0.25 - projectile.y,
          game.player.x + game.player.velocityX * 0.25 - projectile.x
        );
        const currentAngle = Math.atan2(projectile.vy, projectile.vx);
        const angleDelta = ((targetAngle - currentAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const nextAngle = currentAngle + clamp(angleDelta, -HOMING_TURN_RATE * dt, HOMING_TURN_RATE * dt);
        projectile.vx = Math.cos(nextAngle) * speed;
        projectile.vy = Math.sin(nextAngle) * speed;
      }
    }
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.life <= 0) {
      game.hostileProjectiles.splice(index, 1);
      continue;
    }
    const supportShip = game.emergencyService?.ship;
    if (supportShip && Math.hypot(projectile.x - supportShip.x, projectile.y - supportShip.y) <= 14) {
      damageEmergencyServiceShip(projectile.damage ?? 12);
      game.hostileProjectiles.splice(index, 1);
      continue;
    }
    if (Math.hypot(projectile.x - game.player.x, projectile.y - game.player.y) <= 13) {
      if (game.emergencyReturn && game.emergencyReturnCause !== 'tow') {
        damageEmergencyCapsule(projectile.damage ?? 12);
        game.hostileProjectiles.splice(index, 1);
        continue;
      }
      const slot = getShipPartSlotAtImpact(projectile.x, projectile.y);
      if (slot) {
        const result = damageShipPart(slot, projectile.damage ?? 12);
        if (result) {
          const slotName = slot === 'leftWing' ? 'ala izquierda'
            : slot === 'rightWing' ? 'ala derecha'
              : slot === 'center' ? 'centro' : slot === 'propulsor' ? 'propulsor' : 'punta';
          setCombatMessage(result.hp <= 0
            ? slot === 'center'
              ? '¡Centro destruido! Regresando a Tierra en cápsula.'
              : `¡Impacto! Se destruyó la pieza ${slotName}. Aterriza para cambiarla.`
            : `¡Impacto en ${slotName}! ${result.hp}/${result.maxHealth} HP.`);
        }
      }
      game.hostileProjectiles.splice(index, 1);
    }
  }
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared > 0
    ? clamp(((px - x1) * dx + (py - y1) * dy) / lengthSquared, 0, 1)
    : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function updatePlayerWeapon(dt, controlsEnabled) {
  if (game.scene !== 'space') return;
  game.player.weaponCooldown = Math.max(0, game.player.weaponCooldown - dt);
  const centerHoming = game.player.centerHoming;
  if (centerHoming && (centerHoming.expiresAt <= game.time || centerHoming.shotsRemaining <= 0)) {
    game.player.centerHoming = null;
  }
  const tipId = game.player.shipParts.tip;
  const tip = getShipPart(tipId);
  if (controlsEnabled && game.keys['1'] && isShipPartOperational('tip') && tip && game.player.weaponCooldown <= 0) {
    const directionX = Math.sin(game.player.rotation);
    const directionY = -Math.cos(game.player.rotation);
    const muzzleDistance = 8;
    const shotCount = tip.stats?.weaponShots ?? 1;
    const sideX = directionY * 3;
    const sideY = -directionX * 3;
    const projectileSpeed = Math.max(
      (tip.stats?.weaponProjectileSpeed ?? 520) * PROJECTILE_SPEED_MULTIPLIER,
      Math.hypot(game.player.velocityX, game.player.velocityY) * 1.05
    );
    const centerHomingActive = game.player.centerHoming?.expiresAt > game.time &&
      game.player.centerHoming.shotsRemaining > 0;
    for (let shot = 0; shot < shotCount; shot += 1) {
      const side = shotCount > 1 ? (shot === 0 ? -1 : 1) : 0;
      const isHomingShot = centerHomingActive && game.player.centerHoming.shotsRemaining > 0;
      game.playerProjectiles.push({
        x: game.player.x + directionX * muzzleDistance + sideX * side,
        y: game.player.y + directionY * muzzleDistance + sideY * side,
        vx: directionX * projectileSpeed,
        vy: directionY * projectileSpeed,
        damage: tip.stats?.weaponDamage ?? 8,
        life: isHomingShot ? CENTER_HOMING_DURATION : 2.5,
        homingEnabled: isHomingShot,
        homingTarget: null,
        homingUntil: game.time + CENTER_HOMING_DURATION,
        pierce: Boolean(tip.stats?.weaponPierce),
        hitDrones: tip.stats?.weaponPierce ? new Set() : null,
      });
      if (isHomingShot) game.player.centerHoming.shotsRemaining -= 1;
    }
    playShipShotSound(game.player.x, game.player.y);
    markSpaceHudAction();
    game.player.muzzleFlashUntil = Date.now() + 65;
    game.player.muzzleFlashShape = createMuzzleFlashShape();
    game.player.weaponCooldown = tip.stats?.weaponCooldown ?? 1.1;
  }

  for (let index = game.playerProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = game.playerProjectiles[index];
    if (projectile.homingEnabled && game.time < projectile.homingUntil) {
      const currentTarget = projectile.homingTarget;
      if (!currentTarget || currentTarget.hp <= 0 || !game.hostileDrones.includes(currentTarget)) {
        projectile.homingTarget = findNearestHostileDrone(CENTER_HOMING_RADIUS, projectile.x, projectile.y);
      }
    }
    const target = projectile.homingTarget;
    if (
      target && game.time < projectile.homingUntil && target.hp > 0 &&
      game.hostileDrones.includes(target)
    ) {
      const speed = Math.hypot(projectile.vx, projectile.vy);
      if (speed > 0) {
        const dx = target.x - projectile.x;
        const dy = target.y - projectile.y;
        const distance = Math.hypot(dx, dy);
        const leadTime = clamp(distance / speed, 0, 0.8);
        const targetAngle = Math.atan2(
          target.y + target.velocityY * leadTime - projectile.y,
          target.x + target.velocityX * leadTime - projectile.x
        );
        const currentAngle = Math.atan2(projectile.vy, projectile.vx);
        const angleDelta = ((targetAngle - currentAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const nextAngle = currentAngle + clamp(angleDelta, -HOMING_TURN_RATE * dt, HOMING_TURN_RATE * dt);
        projectile.vx = Math.cos(nextAngle) * speed;
        projectile.vy = Math.sin(nextAngle) * speed;
      }
    }
    const previousX = projectile.x;
    const previousY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    let hitIndex = -1;
    for (let droneIndex = game.hostileDrones.length - 1; droneIndex >= 0; droneIndex -= 1) {
      const drone = game.hostileDrones[droneIndex];
      if (projectile.hitDrones?.has(drone)) continue;
      if (distanceToSegment(drone.x, drone.y, previousX, previousY, projectile.x, projectile.y) <= 13) {
        drone.hp -= projectile.damage;
        projectile.hitDrones?.add(drone);
        hitIndex = droneIndex;
        break;
      }
    }
    if (hitIndex >= 0) {
      if (!projectile.pierce || projectile.life <= 0) game.playerProjectiles.splice(index, 1);
      const hitDrone = game.hostileDrones[hitIndex];
      if (hitDrone.hp <= 0) {
        game.hostileDrones.splice(hitIndex, 1);
        handleEnemyDestroyed();
      } else {
        setPlayerDamageMessage(`¡Impacto! ${projectile.damage} de daño a la nave enemiga · ${Math.ceil(hitDrone.hp)}/${hitDrone.stats.maxHealth} HP.`);
      }
    } else if (projectile.life <= 0) {
      game.playerProjectiles.splice(index, 1);
    }
  }
}

function drawProjectileHalo(screenX, screenY, projectile, color, offset) {
  const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
  const haloX = screenX - (projectile.vx / speed) * offset;
  const haloY = screenY - (projectile.vy / speed) * offset;
  const gradient = ctx.createRadialGradient(haloX, haloY, 0, haloX, haloY, 5);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(haloX, haloY, 5, 0, Math.PI * 2);
  ctx.fill();
}

function createMuzzleFlashShape() {
  const spikes = 4 + Math.floor(Math.random() * 3);
  const rotation = Math.random() * Math.PI * 2;
  return Array.from({ length: spikes * 2 }, (_, index) => ({
    angle: rotation + (index * Math.PI) / spikes,
    radius: index % 2 === 0
      ? 1.8 + Math.random() * 1.2
      : 0.45 + Math.random() * 0.5,
  }));
}

function drawMuzzleFlash(context, x, y, shape) {
  if (!shape?.length) return;
  context.save();
  context.globalAlpha = 1;
  context.shadowColor = '#ffffff';
  context.shadowBlur = 4;
  context.beginPath();
  shape.forEach((point, index) => {
    const pointX = x + Math.cos(point.angle) * point.radius;
    const pointY = y + Math.sin(point.angle) * point.radius;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  });
  context.closePath();
  context.fillStyle = '#ffffff';
  context.fill();
  const core = context.createRadialGradient(x, y, 0, x, y, 1.35);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.45, 'rgba(255, 255, 255, 0.95)');
  core.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = core;
  context.beginPath();
  context.arc(x, y, 1.35, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawFlexibleThrusterFlame(context, length, color, opacity, bend = 0) {
  const tipX = clamp(bend, -4.5, 4.5);
  context.save();
  context.globalAlpha = opacity;
  context.shadowColor = color;
  context.shadowBlur = 5 * opacity;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-1, 10);
  context.quadraticCurveTo(tipX * 0.35 - 0.6, 10 + length * 0.45, tipX, 10 + length);
  context.quadraticCurveTo(tipX * 0.35 + 0.6, 10 + length * 0.45, 1, 10);
  context.closePath();
  context.fill();
  context.restore();
}

function updateShipFlameBend(ship, turnDelta, dt) {
  let desiredBend = 0;
  // La estela queda detrás de la nave: al girar, se curva hacia el rumbo anterior.
  const turnRate = turnDelta / Math.max(dt, 0.001);
  desiredBend = Math.abs(turnRate) < 0.2
    ? 0
    : clamp(turnRate * 1.6, -4.5, 4.5);
  const follow = 1 - Math.exp(-dt * 4);
  ship.flameBend = (ship.flameBend || 0) + (desiredBend - (ship.flameBend || 0)) * follow;
}

function updateShipHeadingFromVelocity(ship, angleKey, dt) {
  const speed = Math.hypot(ship.velocityX, ship.velocityY);
  let turnDelta = 0;
  if (speed > 1) {
    const previousAngle = ship[angleKey];
    const nextAngle = Math.atan2(ship.velocityY, ship.velocityX) + Math.PI / 2;
    turnDelta = ((nextAngle - previousAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    ship[angleKey] = nextAngle;
  }
  updateShipFlameBend(ship, turnDelta, dt);
}

function drawHostileCombat() {
  for (const drone of game.hostileDrones) {
    ctx.save();
    ctx.translate(
      drone.x - game.player.x + game.width / 2,
      drone.y - game.player.y + game.height / 2
    );
    ctx.rotate(drone.angle);
    const velocity = Math.hypot(drone.velocityX, drone.velocityY);
    if (drone.shipParts.propulsor && velocity > 0.5) {
      const flameLength = clamp(4 + velocity * 0.02, 4, 56);
      const speedRatio = clamp(velocity / drone.stats.maxSpeed, 0, 1);
      const flameColor = blendHexColors('#ff9b42', '#70eaff', speedRatio);
      const flameOpacity = clamp(velocity / 18, 0, 1);
      drawFlexibleThrusterFlame(ctx, flameLength, flameColor, flameOpacity, drone.flameBend);
    }
    ctx.shadowColor = '#ff416f';
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.9;
    drawShipParts(ctx, 0, 0, 6, drone.shipParts);
    if (drone === selectedHostileDrone) {
      ctx.strokeStyle = '#58ff83';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#58ff83';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (drone.muzzleFlashUntil > Date.now()) {
      drawMuzzleFlash(ctx, 0, -12, drone.muzzleFlashShape);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff416f';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.lineCap = 'round';
  for (const projectile of game.hostileProjectiles) {
    const screenX = projectile.x - game.player.x + game.width / 2;
    const screenY = projectile.y - game.player.y + game.height / 2;
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    ctx.save();
    drawProjectileHalo(screenX, screenY, projectile, 'rgba(95, 232, 255, 0.48)', 8);
    ctx.strokeStyle = '#baf7ff';
    ctx.shadowColor = '#55dfff';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screenX - (projectile.vx / speed) * 7, screenY - (projectile.vy / speed) * 7);
    ctx.lineTo(screenX, screenY);
    ctx.stroke();
    ctx.restore();
  }
  for (const projectile of game.playerProjectiles) {
    const screenX = projectile.x - game.player.x + game.width / 2;
    const screenY = projectile.y - game.player.y + game.height / 2;
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    ctx.save();
    drawProjectileHalo(screenX, screenY, projectile, 'rgba(255, 194, 71, 0.5)', 10);
    ctx.strokeStyle = '#fff4a3';
    ctx.shadowColor = '#ffc247';
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX - (projectile.vx / speed) * 10, screenY - (projectile.vy / speed) * 10);
    ctx.lineTo(screenX, screenY);
    ctx.stroke();
    ctx.restore();
  }
}

function drawRemotePlayersSpace() {
  if (!multiplayerReady) return;
  for (const remote of multiplayerPlayers) {
    if (remote.scene !== 'space') continue;
    const screenX = remote.drawX - game.player.x + game.width / 2;
    const screenY = remote.drawY - game.player.y + game.height / 2;
    if (screenX < -100 || screenX > game.width + 100 || screenY < -100 || screenY > game.height + 100) continue;
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(remote.rotation || 0);
    const speed = Math.hypot(remote.velocityX || 0, remote.velocityY || 0);
    if (remote.shipParts?.propulsor && speed > 1) {
      const flameLength = clamp(4 + speed * 0.02, 4, 48);
      drawFlexibleThrusterFlame(ctx, flameLength, '#70eaff', clamp(speed / 18, 0, 1), 0);
    }
    ctx.shadowColor = '#65eaff';
    ctx.shadowBlur = 8;
    drawShipParts(ctx, 0, 0, 6, remote.shipParts);
    ctx.restore();
  }
}

function drawRemotePlayersSurface(planetName) {
  if (!multiplayerReady) return;
  for (const remote of multiplayerPlayers) {
    if (remote.scene !== 'surface' || remote.planet?.toLowerCase() !== planetName.toLowerCase()) continue;
    const surfaceX = (Number.isFinite(remote.drawSurfaceX) ? remote.drawSurfaceX : 0.5) * SURFACE_WORLD_SIZE;
    const surfaceY = (Number.isFinite(remote.drawSurfaceY) ? remote.drawSurfaceY : 0.5) * SURFACE_WORLD_SIZE;
    const hasSprite = drawNpcSprite(surfaceX, surfaceY, remote.hue || 120, remote.facing, remote.animationFrame || 1);
    if (!hasSprite) {
      const surfacePoint = getSurfaceRenderPoint(surfaceX, surfaceY);
      ctx.fillStyle = '#73eaff';
      ctx.beginPath();
      ctx.arc(surfacePoint.x, surfacePoint.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    drawWorldText(remote.name || 'PILOTO', surfaceX, surfaceY - PLAYER_SPRITE_SIZE / 2 - 8, '#9df4ff', false, WORLD_FONT_SIZE / 1.5);
    if (remote.chat) drawSpeechBubble(remote.chat, surfaceX, surfaceY - PLAYER_SPRITE_SIZE / 2 - 14, '#72eaff', '#e3fbff');
  }
}

function drawRemoteSpaceLabels() {
  if (!multiplayerReady) return;
  const zoom = CAMERA_ZOOM * playerZoom;
  for (const remote of multiplayerPlayers) {
    if (remote.scene !== 'space') continue;
    const screenX = game.width / 2 + (remote.drawX - game.player.x) * zoom;
    const screenY = game.height / 2 + (remote.drawY - game.player.y) * zoom;
    if (screenX < -120 || screenX > game.width + 120 || screenY < -100 || screenY > game.height + 100) continue;
    drawWorldText(remote.name || 'PILOTO', screenX, screenY - 24, '#9df4ff', false, WORLD_FONT_SIZE / 1.5);
    if (remote.chat) drawSpeechBubble(remote.chat, screenX, screenY - 32, '#72eaff', '#e3fbff');
  }
}

function drawEnemyEdgeIndicators() {
  const maxRange = CHUNK_SIZE * HOSTILE_INDICATOR_RANGE_CHUNKS;
  const cameraScale = CAMERA_ZOOM * playerZoom;
  const centerX = game.width / 2;
  const centerY = game.height / 2;
  const margin = 14;

  for (const drone of game.hostileDrones) {
    const dx = drone.x - game.player.x;
    const dy = drone.y - game.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0 || distance > maxRange) continue;

    const screenX = centerX + dx * cameraScale;
    const screenY = centerY + dy * cameraScale;
    if (screenX >= 0 && screenX <= game.width && screenY >= 0 && screenY <= game.height) {
      continue;
    }

    const directionX = dx / distance;
    const directionY = dy / distance;
    const edgeDistance = Math.min(
      Math.abs(directionX) > 1e-6 ? (centerX - margin) / Math.abs(directionX) : Infinity,
      Math.abs(directionY) > 1e-6 ? (centerY - margin) / Math.abs(directionY) : Infinity
    );
    const edgeWorldDistance = edgeDistance / cameraScale;
    const approach = clamp((maxRange - distance) / Math.max(1, maxRange - edgeWorldDistance), 0, 1);
    const radius = 2 + approach * 5;
    const indicatorX = clamp(centerX + directionX * edgeDistance, margin, game.width - margin);
    const indicatorY = clamp(centerY + directionY * edgeDistance, margin, game.height - margin);

    ctx.save();
    ctx.fillStyle = '#ff2638';
    ctx.shadowColor = '#ff2638';
    ctx.shadowBlur = 4 + approach * 5;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2);
    ctx.fill();
    if (drone === selectedHostileDrone) {
      ctx.strokeStyle = '#58ff83';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#58ff83';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawSelectedHostileHealth() {
  if (!selectedHostileDrone || !game.hostileDrones.includes(selectedHostileDrone) || selectedHostileDrone.hp <= 0) {
    selectedHostileDrone = null;
    return;
  }

  const maxHealth = Math.max(1, selectedHostileDrone.stats?.maxHealth ?? 1);
  const health = clamp(selectedHostileDrone.hp / maxHealth, 0, 1);
  const width = 220;
  const height = 48;
  const x = (game.width - width) / 2;
  const y = 18;
  ctx.save();
  ctx.globalAlpha = spaceHudOpacity;
  ctx.fillStyle = 'rgba(12, 2, 5, 0.9)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#ff5268';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe2e5';
  ctx.fillText(`ENEMIGO · ${Math.ceil(selectedHostileDrone.hp)}/${maxHealth} HP`, game.width / 2, y + 14);
  ctx.fillStyle = 'rgba(70, 10, 20, 0.9)';
  ctx.fillRect(x + 10, y + 28, width - 20, 10);
  ctx.fillStyle = health > 0.5 ? '#ff5268' : health > 0.25 ? '#ff9b42' : '#ff2638';
  ctx.fillRect(x + 10, y + 28, (width - 20) * health, 10);
  ctx.restore();
}

function getHostileAtScreenPosition(position) {
  const cameraScale = CAMERA_ZOOM * playerZoom;
  const centerX = game.width / 2;
  const centerY = game.height / 2;
  const maxRange = CHUNK_SIZE * HOSTILE_INDICATOR_RANGE_CHUNKS;
  for (const drone of game.hostileDrones) {
    const dx = drone.x - game.player.x;
    const dy = drone.y - game.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0) continue;

    const screenX = centerX + dx * cameraScale;
    const screenY = centerY + dy * cameraScale;
    if (screenX >= 0 && screenX <= game.width && screenY >= 0 && screenY <= game.height) {
      const hitRadius = Math.max(12, 10 * cameraScale);
      if (Math.hypot(position.x - screenX, position.y - screenY) <= hitRadius) return drone;
      continue;
    }
    if (distance > maxRange) continue;

    const directionX = dx / distance;
    const directionY = dy / distance;
    const margin = 14;
    const edgeDistance = Math.min(
      Math.abs(directionX) > 1e-6 ? (centerX - margin) / Math.abs(directionX) : Infinity,
      Math.abs(directionY) > 1e-6 ? (centerY - margin) / Math.abs(directionY) : Infinity
    );
    const indicatorX = clamp(centerX + directionX * edgeDistance, margin, game.width - margin);
    const indicatorY = clamp(centerY + directionY * edgeDistance, margin, game.height - margin);
    if (Math.hypot(position.x - indicatorX, position.y - indicatorY) <= 14) return drone;
  }
  return null;
}

function areAllShipPartsBroken() {
  const health = ensureShipPartHealth();
  return Object.keys(SHIP_PART_BASE_HEALTH).every((slot) => {
    const partId = game.player.shipParts[slot];
    return !partId || (health[slot]?.hp ?? 0) <= 0;
  });
}

function updateEmergencyReturn(dt) {
  const homeworld = game.homeStar?.planets.find(isHomeworld)
    ?? game.planets.find(isHomeworld);
  if (!homeworld) return;

  updatePlanetPositions();
  if (game.emergencyReturnCause === 'tow' && game.emergencyService?.ship) {
    const towShip = game.emergencyService.ship;
    const toEarthX = homeworld.x - towShip.x;
    const toEarthY = homeworld.y - towShip.y;
    const shipDistance = Math.hypot(toEarthX, toEarthY) || 1;
    const arrivalDistance = homeworld.radius + 12;
    if (shipDistance <= arrivalDistance) {
      game.player.x = homeworld.x + homeworld.radius + game.player.radius + 4;
      game.player.y = homeworld.y;
      const orbitalVelocity = getPlanetVelocity(homeworld);
      game.player.velocityX = orbitalVelocity.x;
      game.player.velocityY = orbitalVelocity.y;
      game.emergencyReturn = false;
      game.emergencyReturnCause = null;
      game.emergencyCapsule = null;
      enterPlanet(homeworld);
      return;
    }
    const directionX = toEarthX / shipDistance;
    const directionY = toEarthY / shipDistance;
    const profile = getPropulsorAbilityProfile(towShip.shipParts?.propulsor);
    if (profile && shipDistance > arrivalDistance + 300 && game.time >= (towShip.propulsionAbilityReadyAt || 0) && !towShip.propulsionBoost) {
      towShip.propulsionBoost = { ...profile, startedAt: game.time };
      towShip.propulsionAbilityReadyAt = game.time + profile.cooldown;
    }
    let boostMultiplier = 1;
    if (towShip.propulsionBoost) {
      const boost = towShip.propulsionBoost;
      const elapsed = game.time - boost.startedAt;
      if (elapsed < boost.peakDuration) {
        boostMultiplier = boost.peakMultiplier;
      } else if (elapsed < boost.peakDuration + boost.decayDuration && boost.decayDuration > 0) {
        boostMultiplier = 1 + (boost.peakMultiplier - 1) * (1 - (elapsed - boost.peakDuration) / boost.decayDuration);
      } else {
        towShip.propulsionBoost = null;
      }
    }
    const maxSpeed = towShip.stats?.maxSpeed ?? towShip.speed ?? EMERGENCY_SERVICE_SPEED;
    const towSpeed = Math.min(maxSpeed * boostMultiplier, Math.max(80, (shipDistance - arrivalDistance) * 1.2));
    const orbitalVelocity = getPlanetVelocity(homeworld);
    towShip.velocityX = orbitalVelocity.x + directionX * towSpeed;
    towShip.velocityY = orbitalVelocity.y + directionY * towSpeed;
    towShip.x += towShip.velocityX * dt;
    towShip.y += towShip.velocityY * dt;
    updateShipHeadingFromVelocity(towShip, 'angle', dt);
    game.player.x = towShip.x - directionX * 82;
    game.player.y = towShip.y - directionY * 82;
    game.player.velocityX = towShip.velocityX;
    game.player.velocityY = towShip.velocityY;
    game.player.rotation = towShip.angle;
    updateVisibleChunks();
    updatePlanetPositions();
    game.selectedPlanet = homeworld;
    updateHud();
    saveGameStateIfDue();
    return;
  }
  const dx = homeworld.x - game.player.x;
  const dy = homeworld.y - game.player.y;
  const distance = Math.hypot(dx, dy);
  const arrivalDistance = homeworld.radius + game.player.radius + 5;
  if (distance <= arrivalDistance) {
    game.player.x = homeworld.x + homeworld.radius + game.player.radius + 4;
    game.player.y = homeworld.y;
    const orbitalVelocity = getPlanetVelocity(homeworld);
    game.player.velocityX = orbitalVelocity.x;
    game.player.velocityY = orbitalVelocity.y;
    game.emergencyReturn = false;
    game.emergencyReturnCause = null;
    game.emergencyCapsule = null;
    enterPlanet(homeworld);
    return;
  }

  const targetVelocity = getPlanetVelocity(homeworld);
  const directionX = dx / (distance || 1);
  const directionY = dy / (distance || 1);
  const capsuleSpeedScale = game.emergencyCapsule?.stage === 2 ? SECOND_CAPSULE_SPEED_MULTIPLIER : 1;
  const emergencyMaxSpeed = 1350 * capsuleSpeedScale;
  const emergencyAcceleration = 1800 * capsuleSpeedScale;
  const desiredSpeed = Math.min(
    emergencyMaxSpeed,
    Math.sqrt(2 * emergencyAcceleration * Math.max(0, distance - arrivalDistance))
  );
  const desiredVelocityX = targetVelocity.x + directionX * desiredSpeed;
  const desiredVelocityY = targetVelocity.y + directionY * desiredSpeed;
  let changeX = desiredVelocityX - game.player.velocityX;
  let changeY = desiredVelocityY - game.player.velocityY;
  const changeLength = Math.hypot(changeX, changeY);
  const maxChange = emergencyAcceleration * dt;
  if (changeLength > maxChange) {
    changeX = (changeX / changeLength) * maxChange;
    changeY = (changeY / changeLength) * maxChange;
  }
  game.player.velocityX += changeX;
  game.player.velocityY += changeY;
  game.player.x += game.player.velocityX * dt;
  game.player.y += game.player.velocityY * dt;
  const velocity = Math.hypot(game.player.velocityX, game.player.velocityY);
  if (velocity > 1) {
    game.player.rotation = Math.atan2(game.player.velocityY, game.player.velocityX) + Math.PI / 2;
  }
  updateVisibleChunks();
  updatePlanetPositions();
  game.selectedPlanet = homeworld;
  updateHud();
  saveGameStateIfDue();
}

function update(dt) {
  updateRegolitoGunReload();
  updateMerchantStock();
  updateEmergencyService(dt);
  updateEmergencyFuelStatus();
  const controlsEnabled = inventoryPanel.hidden && !confirmState && !earthWandererDialogOpen;
  updateHostileCombat(dt, controlsEnabled);
  if (game.scene === 'space' && (
    game.emergencyReturn || !isShipPartOperational('center') || areAllShipPartsBroken()
  )) {
    if (activateEmergencyCapsule()) {
      setMessage(game.emergencyReturnCause === 'command'
        ? 'Regresando a la Tierra.'
        : 'Nave destruida. Regresando a Tierra a máxima velocidad.');
    }
    updateEmergencyReturn(dt);
    return;
  }
  updatePlayerWeapon(dt, controlsEnabled);
  const movementInput = controlsEnabled ? getLatestMovementInput() : { x: 0, y: 0 };
  const keyMoveX = movementInput.x;
  const keyMoveY = movementInput.y;
  const hasKeyboardInput = keyMoveX !== 0 || keyMoveY !== 0;

  if (game.scene === 'surface') {
    game.pointer.isDown = false;
    game.pointer.clickTarget = null;
    game.pointer.moveTarget = null;
    game.pointer.followPlanet = null;
    updatePlanetPositions();
    // Mantiene cargados alrededor del planeta los chunks que se necesitarán al despegar.
    const orbitingPlanet = game.surface.planet;
    game.player.x = orbitingPlanet.x + orbitingPlanet.radius + game.player.radius + 4;
    game.player.y = orbitingPlanet.y;
    updateVisibleChunks();
    if (replenishPlanetPickups(game.surface.planet)) {
      game.surface.pickups = createPlanetPickups(game.surface.planet);
      saveGameState();
    }
    const surf = game.surface;
    surf.weaponCooldown = Math.max(0, (surf.weaponCooldown ?? 0) - dt);
    for (let index = game.surfaceProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = game.surfaceProjectiles[index];
      const speed = Math.hypot(projectile.vx, projectile.vy);
      const distance = Math.min(projectile.remainingDistance, speed * dt);
      const stepCount = Math.max(1, Math.ceil(distance / (SURFACE_TILE / 2)));
      const stepDistance = distance / stepCount;
      let hitMountain = false;
      let hitTarget = false;
      for (let step = 0; step < stepCount; step += 1) {
        projectile.x = wrapSurfaceCoordinate(projectile.x + (projectile.vx / speed) * stepDistance);
        projectile.y = wrapSurfaceCoordinate(projectile.y + (projectile.vy / speed) * stepDistance);
        if (isMars(game.surface.planet) && isMarsMountainCellBlocked(projectile.x, projectile.y)) {
          hitMountain = true;
          break;
        }
        if (projectile.owner === 'martian' &&
          getSurfaceDistance(projectile.x, projectile.y, surf.x, surf.y) <= PLAYER_SPRITE_SIZE / 2) {
          damageSurfacePlayer(projectile.damage ?? 1);
          hitTarget = true;
          break;
        }
        if (projectile.owner !== 'martian' && (isMars(game.surface.planet) || isLuna(game.surface.planet))) {
          const target = game.martianEnemies.find((enemy) =>
            getSurfaceDistance(projectile.x, projectile.y, enemy.x, enemy.y) <= PLAYER_SPRITE_SIZE / 2
          );
          if (target) {
            damageMartianEnemy(target, projectile.damage ?? 1);
            hitTarget = true;
            break;
          }
        }
        if (projectile.owner !== 'martian' && isHomeworld(game.surface.planet) && game.earthWanderer &&
          getSurfaceDistance(projectile.x, projectile.y, game.earthWanderer.x, game.earthWanderer.y) <= PLAYER_SPRITE_SIZE / 2) {
          damageEarthWanderer(game.earthWanderer, projectile.damage ?? 1);
          hitTarget = true;
          break;
        }
      }
      projectile.remainingDistance -= distance;
      if (hitMountain || hitTarget || projectile.remainingDistance <= 0) game.surfaceProjectiles.splice(index, 1);
    }
    const reloadingGun = game.player.regolitoGunReloadUntil > game.time;
    if (!multiplayerReady || !multiplayerWorldOwnerId || multiplayerIsWorldOwner) {
      updateEarthWanderer(dt);
      updateMartianNpcs(dt);
      updateMartianEnemies(dt);
    }
    updateSurfaceHoverboard();
    const hoverboardEquipped = game.player.hoverboardEquipped;
    const invokingHoverboard = (game.surface.hoverboard?.spawnUntil ?? 0) > game.time;
    const hoverboardSpawnSpeedMultiplier = invokingHoverboard ? 0.5 : 1;
    const running = controlsEnabled && !reloadingGun && Boolean(game.keys[' ']);
    const surfaceSpeedMultiplier = hoverboardEquipped ? 4 : 1;
    const sprintMultiplier = running && !hoverboardEquipped ? 2 : 1;
    const reloadSpeedMultiplier = reloadingGun ? 0.5 : 1;
    const terrainSpeedMultiplier = (game.surface.planet.isMoon || game.surface.planet.name.toLowerCase() === 'luna')
      ? getLunaCraterSpeedMultiplier(surf.x, surf.y)
      : 1;
    const speed = SURFACE_WALK_SPEED * surfaceSpeedMultiplier * sprintMultiplier *
      terrainSpeedMultiplier * reloadSpeedMultiplier * hoverboardSpawnSpeedMultiplier;
    const frameDuration = PLAYER_ANIMATION_FRAME_DURATION /
      (hoverboardEquipped ? 2 : 1) / sprintMultiplier / reloadSpeedMultiplier /
      hoverboardSpawnSpeedMultiplier;
    const recoveringFromSurfaceDeath = (surf.respawnUntil ?? 0) > game.time;
    let wantX = recoveringFromSurfaceDeath ? 0 : keyMoveX;
    let wantY = recoveringFromSurfaceDeath ? 0 : keyMoveY;
    if (wantX !== 0 && wantY !== 0) {
      // En diagonal se elige un solo eje: el contrario al que ya se está mirando.
      if (surf.facing === 'left' || surf.facing === 'right') {
        wantX = 0;
      } else {
        wantY = 0;
      }
    }
    if (surf.autoDeparture && controlsEnabled) {
      if (hasKeyboardInput) {
        surf.autoDeparture = null;
      } else {
        // El autopilot sigue la ruta por casillas y no hereda impulsos diagonales previos.
        surf.quickStepDirection = null;
        const ship = getSurfaceShipPosition();
        if (getSurfaceDistance(surf.x, surf.y, ship.x, ship.y) <= AUTO_BOARD_DISTANCE) {
          launchFromSurface(surf.autoDeparture);
          return;
        }
        if (!surf.step && game.time >= (surf.autoPathRetryAt ?? 0)) {
          const nextStep = findSurfacePathToShip(surf, surf.autoPathSearchRadiusTiles ?? 32);
          if (nextStep) {
            surf.autoPathSearchRadiusTiles = 32;
            surf.autoPathRetryAt = 0;
            wantX = nextStep.x;
            wantY = nextStep.y;
          } else if (nextStep === undefined) {
            const searchRadius = surf.autoPathSearchRadiusTiles ?? 32;
            if (searchRadius < 128) {
              surf.autoPathSearchRadiusTiles = Math.min(128, searchRadius * 2);
              surf.autoPathRetryAt = game.time + 0.2;
              setMessage('Buscando una ruta alrededor del obstáculo…');
            } else {
              surf.autoDeparture = null;
              surf.autoPathSearchRadiusTiles = 32;
              setMessage('No se encontró una ruta transitable hasta la nave.');
            }
          }
        }
      }
    }
    if (!controlsEnabled) surf.quickStepDirection = null;
    let quickStepActive = controlsEnabled && Boolean(surf.quickStepDirection);
    const isQuickSteppingThisFrame = quickStepActive;
    if (quickStepActive) {
      const quickDirection = MOVEMENT_KEY_DIRECTIONS[surf.quickStepDirection];
      wantX = quickDirection.x;
      wantY = quickDirection.y;
    }

    if (!surf.step) {
      surf.x = snapSurfaceCoordinate(surf.x);
      surf.y = snapSurfaceCoordinate(surf.y);
    }

    const wasAnimating = surf.isMoving || Boolean(surf.bumping);
    surf.isMoving = false;
    surf.bumping = false;
    let bumped = false;
    let budget = speed * dt * (quickStepActive ? 4 : 1);
    for (let guard = 0; guard < 4 && budget > 0; guard += 1) {
      if (!surf.step) {
        const stepX = wantX !== 0 ? Math.sign(wantX) : 0;
        const stepY = wantX === 0 && wantY !== 0 ? Math.sign(wantY) : 0;
        if (stepX === 0 && stepY === 0) break;
        const nextFacing = stepX !== 0
          ? stepX < 0 ? 'left' : 'right'
          : stepY < 0 ? 'up' : 'down';
        if (surf.turnUntil > game.time && !quickStepActive && !surf.autoDeparture) {
          if (surf.facing !== nextFacing) {
            surf.facing = nextFacing;
            surf.turnUntil = game.time + SURFACE_TILE / speed;
          }
          bumped = true;
          break;
        }
        if (surf.facing !== nextFacing) {
          surf.facing = nextFacing;
          if (!quickStepActive && !surf.autoDeparture) {
            surf.turnUntil = game.time + SURFACE_TILE / speed;
            bumped = true;
            break;
          }
        }
        surf.turnUntil = 0;
        const toX = wrapSurfaceCoordinate(surf.x + stepX * SURFACE_TILE);
        const toY = wrapSurfaceCoordinate(surf.y + stepY * SURFACE_TILE);
        if (isSurfaceTileBlocked(toX, toY, surf.x, surf.y)) {
          bumped = true;
        if (surf.autoDeparture && !hasKeyboardInput) {
          surf.autoPathAvoidTile = { x: toX, y: toY, until: game.time + 3 };
          surf.autoPathSearchRadiusTiles = Math.max(64, surf.autoPathSearchRadiusTiles ?? 32);
          surf.autoPathRetryAt = game.time;
        }
          if (quickStepActive) {
            surf.quickStepDirection = null;
            quickStepActive = false;
          }
          break;
        }
        surf.step = { toX, toY };
      }
      const dx = getSurfaceAxisDelta(surf.step.toX, surf.x);
      const dy = getSurfaceAxisDelta(surf.step.toY, surf.y);
      const distance = Math.abs(dx) + Math.abs(dy);
      const move = Math.min(budget, distance);
      surf.x = wrapSurfaceCoordinate(surf.x + Math.sign(dx) * move);
      surf.y = wrapSurfaceCoordinate(surf.y + Math.sign(dy) * move);
      budget -= move;
      surf.isMoving = true;
      if (move >= distance - 1e-6) {
        surf.x = surf.step.toX;
        surf.y = surf.step.toY;
        surf.step = null;
        if (quickStepActive) {
          surf.quickStepDirection = null;
          quickStepActive = false;
          budget = 0;
        }
      }
    }

    // Como en Pokémon: al chocar, el personaje mira hacia el obstáculo y "camina" en el sitio.
    surf.bumping = bumped && !surf.isMoving;
    if (surf.bumping && !hasKeyboardInput && !game.pointer.isDown && game.pointer.moveTarget) {
      game.pointer.moveTarget = null;
      game.pointer.followPlanet = null;
    }
    if (isQuickSteppingThisFrame) {
      surf.animationFrame = surf.quickStepAnimationFrame ?? surf.animationFrame;
      surf.animationTimer = 0;
    } else if (surf.isMoving || surf.bumping) {
      const stepDuration = surf.bumping ? frameDuration * 2 : frameDuration;
      if (!wasAnimating) {
        surf.animationFrame = 0;
        surf.animationTimer = 0;
      } else {
        surf.animationTimer += dt;
        while (surf.animationTimer >= stepDuration) {
          surf.animationTimer -= stepDuration;
          surf.animationFrame = (surf.animationFrame + 1) % 4;
        }
      }
    } else {
      surf.animationFrame = 1;
      surf.animationTimer = 0;
    }
    if (isQuickSteppingThisFrame && !surf.quickStepDirection) {
      surf.quickStepAnimationFrame = null;
    }

    game.selectedPlanet = game.surface.planet;
    saveGameStateIfDue();
    updateHud();
    return;
  }

  let moveX = keyMoveX;
  let moveY = keyMoveY;
  if (controlsEnabled && !hasKeyboardInput && game.pointer.isDown) {
    moveX = game.pointer.x - game.width / 2;
    moveY = game.pointer.y - game.height / 2;
  }

  const inputLength = Math.hypot(moveX, moveY);
  const hasAutopilot = Boolean(game.pointer.followPlanet || game.pointer.moveTarget);
  const shipStats = getEquippedShipStats();
  const hasPropulsor = shipStats.canPropel;
  const propulsionBoostMultiplier = getActivePropulsionBoostMultiplier();
  const propulsionAcceleration = SHIP_ACCELERATION * propulsionBoostMultiplier;
  // Deja que el impulso aumente la velocidad actual en vez de recortarla
  // al límite normal de la nave durante la habilidad.
  const currentMaxSpeed = shipStats.maxSpeed * propulsionBoostMultiplier;
  const brakeHeld = controlsEnabled && Boolean(game.keys[' ']);
  let idleCoasting = false;
  const mouseFlightInput = controlsEnabled && !hasKeyboardInput && !hasAutopilot &&
    game.pointer.isDown && inputLength > 1;
  const manualFlightInput = controlsEnabled && (hasKeyboardInput || mouseFlightInput) && !hasAutopilot;
  let manualTurnDelta = 0;
  if (manualFlightInput) {
    if (mouseFlightInput) {
      const targetRotation = Math.atan2(moveX, -moveY);
      const angleDelta = ((targetRotation - game.player.rotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      manualTurnDelta = clamp(angleDelta, -SHIP_TURN_RATE * 2.5 * dt, SHIP_TURN_RATE * 2.5 * dt);
    } else {
      const turnInput = (game.keys.d ? 1 : 0) - (game.keys.a ? 1 : 0);
      manualTurnDelta = turnInput * SHIP_TURN_RATE * dt;
    }
    game.player.rotation += manualTurnDelta;
    if (hasPropulsor && mouseFlightInput) {
      // Mantener pulsado el ratón dirige la trayectoria hacia el cursor y acelera
      // con decisión hasta la velocidad máxima, sin esperar a que la nave gire del todo.
      const speed = Math.hypot(game.player.velocityX, game.player.velocityY);
      const velocityAngle = speed > 0.1
        ? Math.atan2(game.player.velocityY, game.player.velocityX)
        : game.player.rotation + Math.PI / 2;
      const desiredAngle = Math.atan2(Math.sin(game.player.rotation), -Math.cos(game.player.rotation));
      const velocityAngleDelta = ((desiredAngle - velocityAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const velocityTurn = clamp(velocityAngleDelta, -SHIP_TURN_RATE * 2.5 * dt, SHIP_TURN_RATE * 2.5 * dt);
      const nextAngle = velocityAngle + velocityTurn;
      const accelerationScale = brakeHeld ? 0.25 : 3.5;
      const nextSpeed = Math.min(currentMaxSpeed, speed + propulsionAcceleration * accelerationScale * dt);
      game.player.velocityX = Math.cos(nextAngle) * nextSpeed;
      game.player.velocityY = Math.sin(nextAngle) * nextSpeed;
    } else if (hasPropulsor) {
      const throttle = mouseFlightInput ? 1 : game.keys.w ? 1 : game.keys.s ? -0.35 : 0;
      if (throttle !== 0) {
        const thrustDirectionX = Math.sin(game.player.rotation);
        const thrustDirectionY = -Math.cos(game.player.rotation);
        const thrustScale = brakeHeld ? 0.25 : 1;
        game.player.velocityX += thrustDirectionX * propulsionAcceleration * throttle * thrustScale * dt;
        game.player.velocityY += thrustDirectionY * propulsionAcceleration * throttle * thrustScale * dt;
      }
    }
  } else if (hasPropulsor && inputLength > 0) {
    const speed = Math.hypot(game.player.velocityX, game.player.velocityY);
    let thrustDirectionX = moveX / inputLength;
    let thrustDirectionY = moveY / inputLength;
    if (!brakeHeld && speed > 1) {
      const currentAngle = Math.atan2(game.player.velocityY, game.player.velocityX);
      const inputAngle = Math.atan2(moveY, moveX);
      const angleDelta = ((inputAngle - currentAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const turn = clamp(angleDelta, -SHIP_TURN_RATE * dt, SHIP_TURN_RATE * dt);
      const newAngle = currentAngle + turn;
      game.player.velocityX = Math.cos(newAngle) * speed;
      game.player.velocityY = Math.sin(newAngle) * speed;
      thrustDirectionX = Math.cos(newAngle);
      thrustDirectionY = Math.sin(newAngle);
    }
    const thrustScale = brakeHeld ? 0.25 : 1;
    const turnScale = moveX !== 0 ? (brakeHeld ? 2.6 : 1.8) : 1;
    game.player.velocityX += thrustDirectionX * propulsionAcceleration * thrustScale * turnScale * dt;
    game.player.velocityY += thrustDirectionY * propulsionAcceleration * thrustScale * turnScale * dt;
  } else if (
    hasPropulsor &&
    !brakeHeld &&
    !hasKeyboardInput &&
    !game.pointer.isDown &&
    (game.pointer.followPlanet || game.pointer.moveTarget)
  ) {
    if (game.pointer.followPlanet) {
      const trackedPlanet = game.planets.find(
        (planet) =>
          planet.seed === game.pointer.followPlanet.seed &&
          planet.star.chunkX === game.pointer.followPlanet.star.chunkX &&
          planet.star.chunkY === game.pointer.followPlanet.star.chunkY
      );
      if (trackedPlanet) {
        game.pointer.followPlanet = trackedPlanet;
      }
    }
    const target = game.pointer.followPlanet || game.pointer.moveTarget;
    const targetX = target.x - game.player.x;
    const targetY = target.y - game.player.y;
    const distance = Math.hypot(targetX, targetY);
    const targetVelocity = game.pointer.followPlanet
      ? getPlanetVelocity(game.pointer.followPlanet)
      : { x: 0, y: 0 };
    const relativeVelocityX = game.player.velocityX - targetVelocity.x;
    const relativeVelocityY = game.player.velocityY - targetVelocity.y;
    const relativeVelocity = Math.hypot(relativeVelocityX, relativeVelocityY);
    const arrivalDistance = game.pointer.followPlanet
      ? game.pointer.followPlanet.radius + game.player.radius
      : 8;
    if (distance <= arrivalDistance && relativeVelocity <= 5) {
      if (game.pointer.followPlanet) {
        const landedPlanet = game.pointer.followPlanet;
        const directionX = distance > 0 ? targetX / distance : 0;
        const directionY = distance > 0 ? targetY / distance : 0;
        game.player.x = target.x - directionX * arrivalDistance;
        game.player.y = target.y - directionY * arrivalDistance;
        game.player.velocityX = targetVelocity.x;
        game.player.velocityY = targetVelocity.y;
        game.pointer.followPlanet = null;
        enterPlanet(landedPlanet);
        return;
      } else {
        game.player.x = target.x;
        game.player.y = target.y;
        game.pointer.moveTarget = null;
      }
      game.pointer.followPlanet = null;
    } else {
      const distanceToBrake = Math.max(0, distance - arrivalDistance);
      const approachSpeed = Math.sqrt(2 * propulsionAcceleration * distanceToBrake);
      let desiredVelocityX = targetVelocity.x +
        (distance > 0 ? (targetX / distance) * approachSpeed : 0);
      let desiredVelocityY = targetVelocity.y +
        (distance > 0 ? (targetY / distance) * approachSpeed : 0);
      const desiredSpeed = Math.hypot(desiredVelocityX, desiredVelocityY);
      if (desiredSpeed > currentMaxSpeed) {
        const speedScale = currentMaxSpeed / desiredSpeed;
        desiredVelocityX *= speedScale;
        desiredVelocityY *= speedScale;
      }
      let changeX = desiredVelocityX - game.player.velocityX;
      let changeY = desiredVelocityY - game.player.velocityY;
      const changeLength = Math.hypot(changeX, changeY);
      const maxChange = propulsionAcceleration * dt;
      if (changeLength > maxChange) {
        changeX = (changeX / changeLength) * maxChange;
        changeY = (changeY / changeLength) * maxChange;
      }
      game.player.velocityX += changeX;
      game.player.velocityY += changeY;
    }
  } else {
    const speed = Math.hypot(game.player.velocityX, game.player.velocityY);
    const braking = brakeHeld ? SHIP_DRIFT_BRAKING : SHIP_BRAKING;
    // Frena hasta la deriva mínima y mantiene el rumbo; solo Espacio la detiene por completo.
    const minimumSpeed = brakeHeld ? 0 : Math.min(speed, SHIP_IDLE_DRIFT_SPEED);
    const nextSpeed = Math.max(minimumSpeed, speed - braking * dt);
    const speedScale = speed > 0 ? nextSpeed / speed : 0;
    game.player.velocityX *= speedScale;
    game.player.velocityY *= speedScale;
    idleCoasting = true;
  }

  // El freno aplica resistencia sin cancelar el empuje direccional, así la nave aún puede girar derrapando.
  if (brakeHeld && hasPropulsor && inputLength > 0) {
    const speed = Math.hypot(game.player.velocityX, game.player.velocityY);
    const nextSpeed = Math.max(0, speed - SHIP_DRIFT_BRAKING * dt);
    const speedScale = speed > 0 ? nextSpeed / speed : 0;
    game.player.velocityX *= speedScale;
    game.player.velocityY *= speedScale;
  }

  let velocity = Math.hypot(game.player.velocityX, game.player.velocityY);
  if (velocity > currentMaxSpeed) {
    const scale = currentMaxSpeed / velocity;
    game.player.velocityX *= scale;
    game.player.velocityY *= scale;
    velocity = currentMaxSpeed;
  }
  if (manualFlightInput) updateShipFlameBend(game.player, manualTurnDelta, dt);
  else if (hasAutopilot) updateShipHeadingFromVelocity(game.player, 'rotation', dt);
  else updateShipFlameBend(game.player, 0, dt);

  const travelSpeed = Math.hypot(game.player.velocityX, game.player.velocityY);
  game.player.x += game.player.velocityX * dt;
  game.player.y += game.player.velocityY * dt;
  // La deriva suave sin empuje no gasta combustible ni energía.
  if (!idleCoasting || travelSpeed > SHIP_IDLE_DRIFT_SPEED * 1.01) {
    consumePropulsionForDistance(travelSpeed * dt);
  }
  updateVisibleChunks();
  updatePlanetPositions();
  game.selectedPlanet = getNearestPlanet();
  updateHud();
  saveGameStateIfDue();
}

const shootingStars = [];
let shootingStarTimer = 3 + Math.random() * 4;

function updateShootingStars(dt) {
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    shootingStarTimer = 5 + Math.random() * 10;
    const angle = Math.PI * (0.1 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1) + (Math.random() < 0.5 ? 0 : Math.PI);
    const life = 0.45 + Math.random() * 0.4;
    shootingStars.push({
      x: game.width * (0.1 + Math.random() * 0.8),
      y: game.height * (0.05 + Math.random() * 0.6),
      vx: Math.cos(angle) * (420 + Math.random() * 300),
      vy: Math.sin(angle) * (420 + Math.random() * 300),
      life,
      maxLife: life,
      length: 22 + Math.random() * 26,
    });
  }
  for (let index = shootingStars.length - 1; index >= 0; index -= 1) {
    const star = shootingStars[index];
    star.x += star.vx * dt;
    star.y += star.vy * dt;
    star.life -= dt;
    if (star.life <= 0) shootingStars.splice(index, 1);
  }
}

function drawShootingStars() {
  ctx.save();
  ctx.lineCap = 'round';
  for (const star of shootingStars) {
    const speed = Math.hypot(star.vx, star.vy) || 1;
    const tailX = star.x - (star.vx / speed) * star.length;
    const tailY = star.y - (star.vy / speed) * star.length;
    const progress = star.life / star.maxLife;
    const alpha = Math.sin(progress * Math.PI);
    const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
    gradient.addColorStop(0, 'rgba(200, 220, 255, 0)');
    gradient.addColorStop(1, `rgba(235, 244, 255, ${alpha})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(star.x, star.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground() {
  const screenContext = ctx;
  const now = performance.now();
  if (spaceBackgroundCanvas.width !== game.width || spaceBackgroundCanvas.height !== game.height) {
    spaceBackgroundCanvas.width = game.width;
    spaceBackgroundCanvas.height = game.height;
    spaceBackgroundCacheTime = -Infinity;
  }

  if (now - spaceBackgroundCacheTime >= SPACE_BACKGROUND_REFRESH_INTERVAL) {
    ctx = spaceBackgroundContext;
  ctx.clearRect(0, 0, game.width, game.height);
  ctx.fillStyle = '#03050a';
  ctx.fillRect(0, 0, game.width, game.height);
  const animationFrame = Math.floor(game.time * 30);

  const drawParallaxLayer = (cells, seed, count, minBrightness, maxBrightness, parallax, size) => {
    const cameraX = game.player.x * parallax / PARALLAX_DIVISOR;
    const cameraY = game.player.y * parallax / PARALLAX_DIVISOR;
    const minCellX = Math.floor((cameraX - game.width / 2) / PARALLAX_CELL_SIZE) - 1;
    const maxCellX = Math.floor((cameraX + game.width / 2) / PARALLAX_CELL_SIZE) + 1;
    const minCellY = Math.floor((cameraY - game.height / 2) / PARALLAX_CELL_SIZE) - 1;
    const maxCellY = Math.floor((cameraY + game.height / 2) / PARALLAX_CELL_SIZE) + 1;
    const visibleCellKeys = new Set();

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
        const key = `${cellX},${cellY}`;
        visibleCellKeys.add(key);
        let stars = cells.get(key);
        if (!stars) {
          stars = createParallaxCell(cellX, cellY, seed, count, minBrightness, maxBrightness);
          cells.set(key, stars);
        }

        for (const star of stars) {
          const screenX = star.x - cameraX + game.width / 2;
          const screenY = star.y - cameraY + game.height / 2;
          if (star.twinkles && star.twinkleFrame !== animationFrame) {
            star.twinkleFrame = animationFrame;
            star.cachedTwinkleOpacity = 0.28 + 0.72 * ((Math.sin((game.time * star.twinkleSpeed) / 8 + star.phase) + 1) / 2);
          }
          const twinkleOpacity = star.twinkles ? star.cachedTwinkleOpacity : 1;
          if (screenX < -2 || screenX > game.width + 2 || screenY < -2 || screenY > game.height + 2) {
            continue;
          }
          const baseAlpha = twinkleOpacity * getBackgroundEdgeOpacity(screenX, screenY) * (star.brightness / 255);
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = star.color;
          if (parallax >= 0.3 && (parallax >= 0.5 || star.big)) {
            const glowSize = star.big ? 14 : 9;
            // El halo late suavemente entre 0 % y 50 % de opacidad, con fase propia en cada estrella.
            if (star.glowFrame !== animationFrame) {
              star.glowFrame = animationFrame;
              star.cachedGlowPulse = (Math.sin(game.time * star.twinkleSpeed * 0.5 + star.phase * 3) + 1) / 2;
            }
            const glowPulse = star.cachedGlowPulse;
            ctx.globalAlpha = baseAlpha * glowPulse * GLOW_MAX_OPACITY;
            ctx.drawImage(
              getStarGlowSprite(star.color),
              screenX + 0.5 - glowSize / 2,
              screenY + 0.5 - glowSize / 2,
              glowSize,
              glowSize
            );
            ctx.globalAlpha = baseAlpha;
          }
          const drawSize = star.big && parallax >= 0.5 ? size + 1 : size;
          ctx.fillRect(Math.round(screenX), Math.round(screenY), drawSize, drawSize);
          ctx.globalAlpha = 1;
        }
      }
    }

    for (const key of cells.keys()) {
      if (!visibleCellKeys.has(key)) {
        cells.delete(key);
      }
    }
  };

  drawParallaxLayer(farStarCells, 42, 320, 120, 210, 0.12, 1);
  drawParallaxLayer(midStarCells, 1337, 160, 160, 240, 0.3, 1);
  drawParallaxLayer(nearStarCells, 7001, 70, 200, 255, 0.55, 1);
    ctx = screenContext;
    spaceBackgroundCacheTime = now;
  }

  screenContext.drawImage(spaceBackgroundCanvas, 0, 0);
  drawShootingStars();
}

function drawPlanets() {
  for (const chunk of game.chunks.values()) {
    for (const star of chunk.systems) {
      const starX = star.x - game.player.x + game.width / 2;
      const starY = star.y - game.player.y + game.height / 2;
      const huePhase = star.chunkX * 1.7 + star.chunkY * 2.3;
      const maxOrbit = star.planets.reduce((max, planet) => Math.max(max, planet.orbitRadius), 0);
      if (
        starX + maxOrbit < -30 ||
        starX - maxOrbit > game.width + 30 ||
        starY + maxOrbit < -30 ||
        starY - maxOrbit > game.height + 30
      ) {
        continue;
      }

      const sunColor = solarHueColor(game.time, huePhase);
      const glow = ctx.createRadialGradient(starX, starY, star.radius * 0.35, starX, starY, star.radius * 1.3);
      glow.addColorStop(0, sunColor.replace('58%)', '35%)'));
      glow.addColorStop(1, 'rgba(255, 190, 95, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(starX, starY, star.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      const sunGradient = ctx.createRadialGradient(
        starX - star.radius * 0.2,
        starY - star.radius * 0.2,
        0,
        starX,
        starY,
        star.radius
      );
      sunGradient.addColorStop(0, '#ffffff');
      sunGradient.addColorStop(0.3, '#ffffff');
      sunGradient.addColorStop(0.72, blendHexColors(sunColor, '#fff3cf', 0.55));
      sunGradient.addColorStop(1, sunColor);

      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      const wavePhase = huePhase;
      const segments = 48;
      for (let index = 0; index <= segments; index += 1) {
        const angle = (index / segments) * Math.PI * 2;
        const wave =
          1 +
          0.01 * Math.sin(angle * 5 + game.time * 0.9 + wavePhase) +
          0.005 * Math.sin(angle * 8 - game.time * 0.6 + wavePhase);
        const radius = star.radius * wave;
        const x = starX + Math.cos(angle) * radius;
        const y = starY + Math.sin(angle) * radius;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      const coreRadius = star.radius * 0.92;
      const coreGlow = ctx.createRadialGradient(
        starX,
        starY,
        coreRadius * 0.45,
        starX,
        starY,
        coreRadius
      );
      coreGlow.addColorStop(0, '#ffffff');
      coreGlow.addColorStop(0.58, '#ffffff');
      coreGlow.addColorStop(0.82, 'rgba(255, 255, 255, 0.82)');
      coreGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.save();
      ctx.filter = 'blur(5px)';
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(starX, starY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (const planet of game.planets) {
    const screenX = planet.x - game.player.x + game.width / 2;
    const screenY = planet.y - game.player.y + game.height / 2;
    if (
      screenX < -planet.radius - 5 ||
      screenX > game.width + planet.radius + 5 ||
      screenY < -planet.radius - 5 ||
      screenY > game.height + planet.radius + 5
    ) {
      continue;
    }

    const planetSprite = getPlanetSprite(planet);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = 'blur(0.75px)';
    ctx.drawImage(
      planetSprite,
      screenX - planet.radius,
      screenY - planet.radius,
      planet.radius * 2,
      planet.radius * 2
    );
    ctx.restore();

    if (planet.ring) {
      ctx.beginPath();
      ctx.ellipse(screenX, screenY, planet.radius * 1.8, planet.radius * 0.55, -0.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(190, 177, 148, 0.65)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

  }

  for (const chunk of game.chunks.values()) {
    if (!chunk.blackHole) {
      continue;
    }
    const holeX = chunk.blackHole.x - game.player.x + game.width / 2;
    const holeY = chunk.blackHole.y - game.player.y + game.height / 2;
    if (holeX < -100 || holeX > game.width + 100 || holeY < -100 || holeY > game.height + 100) {
      continue;
    }

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(holeX, holeY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#382c47';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(game.width / 2, game.height / 2);
  const velocity = Math.hypot(game.player.velocityX, game.player.velocityY);
  ctx.rotate(game.player.rotation);

  if (game.emergencyReturn) {
    if (game.emergencyReturnCause === 'tow') {
      drawShipParts(ctx, 0, 0, 6, game.player.shipParts, ensureShipPartHealth());
      ctx.fillStyle = '#55e8ff';
      ctx.strokeStyle = '#d8fbff';
      ctx.lineWidth = 1;
      ctx.fillRect(-19, -3, 7, 6);
      ctx.fillRect(12, -3, 7, 6);
      ctx.beginPath();
      ctx.moveTo(-19, 0);
      ctx.lineTo(-11, 0);
      ctx.moveTo(11, 0);
      ctx.lineTo(19, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (game.emergencyCapsule?.stage === 2) {
      // Segunda cápsula: solo un punto blanco brillante, la mitad de grande que la primera.
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.shadowColor = '#ffcf70';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#e8edf2';
    ctx.strokeStyle = '#ffcf70';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#42536b';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.imageSmoothingEnabled = false;
  if (game.player.shipParts.propulsor && velocity > 0.5) {
    const flameLength = clamp(4 + velocity * 0.02, 4, 56);
    const speedRatio = clamp(velocity / getEquippedShipStats().maxSpeed, 0, 1);
    const headingX = Math.sin(game.player.rotation);
    const headingY = -Math.cos(game.player.rotation);
    const movingBackward = game.player.velocityX * headingX + game.player.velocityY * headingY < -1;
    const flameColor = movingBackward
      ? '#ff9b42'
      : blendHexColors('#ff9b42', '#70eaff', speedRatio);
    const flameOpacity = clamp(velocity / 18, 0, 1);
    drawFlexibleThrusterFlame(ctx, flameLength, flameColor, flameOpacity, game.player.flameBend);
  }
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 7;
  drawShipParts(ctx, 0, 0, 6, game.player.shipParts, ensureShipPartHealth());
  if (game.player.muzzleFlashUntil > Date.now()) {
    drawMuzzleFlash(ctx, 0, -12, game.player.muzzleFlashShape);
  }
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawOreVein(pickup, point) {
  // Cada recurso se representa como una pequeña veta: roca oscura con varias
  // astillas del mineral visible, en vez de un icono flotante.
  let seed = 2166136261;
  for (let index = 0; index < pickup.id.length; index += 1) {
    seed = Math.imul(seed ^ pickup.id.charCodeAt(index), 16777619);
  }
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const x = point.x;
  const y = point.y;
  ctx.save();
  ctx.lineJoin = 'miter';
  ctx.fillStyle = '#171a18';
  ctx.strokeStyle = '#080b09';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 17, y + 5);
  ctx.lineTo(x - 13, y - 5);
  ctx.lineTo(x - 5, y - 10);
  ctx.lineTo(x + 4, y - 9);
  ctx.lineTo(x + 15, y - 3);
  ctx.lineTo(x + 18, y + 5);
  ctx.lineTo(x + 10, y + 10);
  ctx.lineTo(x - 9, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pequeños fragmentos alrededor hacen que la veta se lea como un depósito.
  for (let index = 0; index < 5; index += 1) {
    const shardX = x + (random() - 0.5) * 25;
    const shardY = y + (random() - 0.5) * 11;
    const height = 4 + random() * 6;
    const width = 2 + random() * 3;
    ctx.fillStyle = index % 3 === 0 ? '#f4f0d2' : pickup.color;
    ctx.strokeStyle = '#101511';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shardX - width, shardY + height / 2);
    ctx.lineTo(shardX - width / 2, shardY - height / 2);
    ctx.lineTo(shardX + width / 2, shardY - height);
    ctx.lineTo(shardX + width, shardY + height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawSurface() {
  const planet = game.surface?.planet;
  if (!(planet?.isMoon || planet?.name?.toLowerCase() === 'luna')) {
    drawSurfaceScene();
    drawSurfaceGunAmmoHud();
    drawSurfaceLifeHud();
    drawMartianEnemyEdgeIndicators();
    drawHoverboardEdgeIndicator();
    return;
  }

  const mainContext = ctx;
  const pixelRatio = window.devicePixelRatio || 1;
  if (!lunaFisheyeBuffers || lunaFisheyeBuffers.source.width !== canvas.width || lunaFisheyeBuffers.source.height !== canvas.height) {
    const source = document.createElement('canvas');
    const horizontal = document.createElement('canvas');
    const output = document.createElement('canvas');
    const blurred = document.createElement('canvas');
    for (const buffer of [source, horizontal, output, blurred]) {
      buffer.width = canvas.width;
      buffer.height = canvas.height;
    }
    lunaFisheyeBuffers = { source, horizontal, output, blurred };
  }
  const sourceContext = lunaFisheyeBuffers.source.getContext('2d');
  sourceContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  sourceContext.clearRect(0, 0, game.width, game.height);
  ctx = sourceContext;
  try {
    drawSurfaceScene();
  } finally {
    ctx = mainContext;
  }
  applyLunaFisheyeStretch(lunaFisheyeBuffers, pixelRatio);
  mainContext.drawImage(
    lunaFisheyeBuffers.output,
    0, 0, lunaFisheyeBuffers.output.width, lunaFisheyeBuffers.output.height,
    0, 0, game.width, game.height
  );
  drawLunaFisheyeCorners(lunaFisheyeBuffers.output, lunaFisheyeBuffers.blurred);
  drawSurfaceGunAmmoHud();
  drawSurfaceLifeHud();
  drawMartianEnemyEdgeIndicators();
  drawHoverboardEdgeIndicator();
}

function drawHoverboardEdgeIndicator() {
  const board = game.scene === 'surface' ? game.surface?.hoverboard : null;
  if (!board?.deployed) return;
  const dx = getSurfaceAxisDelta(board.x, game.surface.x);
  const dy = getSurfaceAxisDelta(board.y, game.surface.y);
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) return;
  const centerX = game.width / 2;
  const centerY = game.height / 2;
  const screenX = centerX + dx * playerZoom;
  const screenY = centerY + dy * playerZoom;
  if (screenX >= 12 && screenX <= game.width - 12 && screenY >= 12 && screenY <= game.height - 12) return;
  const directionX = dx / distance;
  const directionY = dy / distance;
  const margin = 16;
  const edgeDistance = Math.min(
    Math.abs(directionX) > 1e-6 ? (centerX - margin) / Math.abs(directionX) : Infinity,
    Math.abs(directionY) > 1e-6 ? (centerY - margin) / Math.abs(directionY) : Infinity
  );
  const x = clamp(centerX + directionX * edgeDistance, margin, game.width - margin);
  const y = clamp(centerY + directionY * edgeDistance, margin, game.height - margin);
  const angle = Math.atan2(directionY, directionX);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#39ff75';
  ctx.shadowColor = '#39ff75';
  ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMartianEnemyEdgeIndicators() {
  if (game.scene !== 'surface' || !game.surface || !(isMars(game.surface.planet) || isLuna(game.surface.planet))) return;
  const maxRange = MARTIAN_ENEMY_DETECTION_RANGE;
  const cameraScale = playerZoom;
  const centerX = game.width / 2;
  const centerY = game.height / 2;
  const margin = 14;
  for (const enemy of game.martianEnemies) {
    const dx = getSurfaceAxisDelta(enemy.x, game.surface.x);
    const dy = getSurfaceAxisDelta(enemy.y, game.surface.y);
    const distance = Math.hypot(dx, dy);
    if (distance <= 0 || distance > maxRange) continue;
    const screenX = centerX + dx * cameraScale;
    const screenY = centerY + dy * cameraScale;
    if (screenX >= 0 && screenX <= game.width && screenY >= 0 && screenY <= game.height) continue;
    const directionX = dx / distance;
    const directionY = dy / distance;
    const edgeDistance = Math.min(
      Math.abs(directionX) > 1e-6 ? (centerX - margin) / Math.abs(directionX) : Infinity,
      Math.abs(directionY) > 1e-6 ? (centerY - margin) / Math.abs(directionY) : Infinity
    );
    const approach = clamp((maxRange - distance) / Math.max(1, maxRange - edgeDistance / cameraScale), 0, 1);
    ctx.save();
    const markerColor = enemy.type === 'lunatic' ? '#c965ff' : '#ff2638';
    ctx.fillStyle = markerColor;
    ctx.shadowColor = markerColor;
    ctx.shadowBlur = 4 + approach * 5;
    ctx.beginPath();
    ctx.arc(
      clamp(centerX + directionX * edgeDistance, margin, game.width - margin),
      clamp(centerY + directionY * edgeDistance, margin, game.height - margin),
      2 + approach * 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
}

function applyLunaFisheyeStretch(buffers, pixelRatio) {
  const stripCount = 96;
  const horizontalContext = buffers.horizontal.getContext('2d');
  horizontalContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  horizontalContext.clearRect(0, 0, game.width, game.height);
  horizontalContext.imageSmoothingEnabled = false;
  horizontalContext.drawImage(
    buffers.source,
    0, 0, buffers.source.width, buffers.source.height,
    0, 0, game.width, game.height
  );
  const outputContext = buffers.output.getContext('2d');
  outputContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  outputContext.clearRect(0, 0, game.width, game.height);
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = 'high';
  const maximumSidePinch = 0.16;
  for (let index = 0; index < stripCount; index += 1) {
    const left = (game.width * index) / stripCount;
    const right = (game.width * (index + 1)) / stripCount;
    const middle = (left + right) / 2;
    const edge = Math.abs((middle / game.width) * 2 - 1);
    const height = game.height * (1 - maximumSidePinch * edge * edge);
    const sourceX = Math.floor(left * pixelRatio);
    const sourceWidth = Math.min(
      buffers.horizontal.width - sourceX,
      Math.max(1, Math.ceil((right - left) * pixelRatio))
    );
    const destinationY = (game.height - height) / 2;
    const destinationWidth = right - left + 0.5;
    outputContext.drawImage(
      buffers.horizontal,
      sourceX, 0, sourceWidth, buffers.horizontal.height,
      left, destinationY, destinationWidth, height
    );
    // Extiende las filas de los extremos para rellenar los huecos creados por el pellizco.
    if (destinationY > 0) {
      outputContext.drawImage(
        buffers.horizontal,
        sourceX, 0, sourceWidth, 1,
        left, 0, destinationWidth, destinationY
      );
      outputContext.drawImage(
        buffers.horizontal,
        sourceX, buffers.horizontal.height - 1, sourceWidth, 1,
        left, destinationY + height, destinationWidth, destinationY
      );
    }
  }
}

function drawSurfaceScene() {
  const { planet } = game.surface;
  const isEarth = isHomeworld(planet);
  const ship = getSurfaceRenderPoint(getSurfaceShipPosition().x, getSurfaceShipPosition().y);
  const { x: shipX, y: shipY } = ship;
  ctx.fillStyle = isEarth ? '#28789a' : planet.color;
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.save();
  ctx.translate(game.width / 2, game.height / 2);
  ctx.scale(playerZoom, playerZoom);
  ctx.translate(-game.surface.x, -game.surface.y);
  const groundLayer = isEarth ? getWaterGroundLayer() : getPlanetGroundLayer(planet);
  if (groundLayer) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const groundPattern = ctx.createPattern(groundLayer, 'repeat');
    if (groundPattern) {
      ctx.fillStyle = groundPattern;
      const visibleWidth = game.width / playerZoom;
      const visibleHeight = game.height / playerZoom;
      ctx.fillRect(
        game.surface.x - visibleWidth / 2,
        game.surface.y - visibleHeight / 2,
        visibleWidth,
        visibleHeight,
      );
    }
    ctx.restore();
  }
  if (isEarth) {
    const landLayer = getPlanetGroundLayer(planet);
    if (landLayer) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const landPattern = ctx.createPattern(landLayer, 'repeat');
      if (landPattern) {
        const land = getHomeLandBounds();
        ctx.fillStyle = landPattern;
        ctx.fillRect(land.x, land.y, land.width, land.height);
      }
      ctx.restore();
    }
  }
  if (isMars(planet)) {
    drawMarsGroundSpots(
      game.surface.x,
      game.surface.y,
      game.width / playerZoom / 2 + SURFACE_TILE,
      game.height / playerZoom / 2 + SURFACE_TILE
    );
  }
  if (planet.isMoon || planet.name.toLowerCase() === 'luna') {
    drawLunaCraters(
      game.surface.x,
      game.surface.y,
      game.width / playerZoom / 2 + SURFACE_TILE,
      game.height / playerZoom / 2 + SURFACE_TILE
    );
  }
  const floorCells = isHomeworld(planet)
    ? getHomeFloorCells()
    : isMars(planet) ? getMarsFloorCells() : null;
  if (floorCells) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    drawSurfaceFloorCells(floorCells);
    ctx.restore();
  }
  if (isMars(planet)) {
    drawMarsMountains(
      planet,
      game.surface.x,
      game.surface.y,
      game.width / playerZoom / 2 + SURFACE_TILE,
      game.height / playerZoom / 2 + SURFACE_TILE
    );
  }
  const visiblePickups = getSurfacePickupCandidates(
    game.surface.x,
    game.surface.y,
    game.width / Math.max(0.1, playerZoom) / 2 + 64,
    game.height / Math.max(0.1, playerZoom) / 2 + 64
  );
  for (const pickup of visiblePickups) {
    const point = getSurfaceRenderPoint(pickup.x, pickup.y);
    const distance = getSurfaceDistance(pickup.x, pickup.y, game.surface.x, game.surface.y);
    drawOreVein(pickup, point);
    ctx.font = WORLD_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#101610';
    ctx.fillText(pickup.icon, point.x, point.y + 4);
    if (distance <= 80) {
      drawWorldText(`${pickup.name.toUpperCase()} x${pickup.count}`, point.x, point.y + 26, '#f3f5e8', true);
      if (distance <= 56) {
        drawWorldText('PULSA E', point.x, point.y + 43, '#d7ffd9', true);
      }
    }
  }
  drawShipParts(ctx, shipX, shipY, 32);
  if (getSurfaceDistance(game.surface.x, game.surface.y, getSurfaceShipPosition().x, getSurfaceShipPosition().y) <= 110 && !confirmState) {
    drawWorldText('PULSA E', shipX, shipY + SURFACE_TILE * 2 + 6, '#d7ffd9', true);
  }
  const playerFrame = PLAYER_FACING_FRAMES[game.surface.facing] ?? PLAYER_FACING_FRAMES.down;
  const surfaceGunEquipped = Boolean(getEquippedSurfaceGun());
  const isKnifeSwinging = isSurfaceItemEquipped(COBALTO_KNIFE_ITEM_ID) &&
    game.time < (game.surface.knifeSlashUntil ?? 0);
  const isSurfaceShooting = !isKnifeSwinging && surfaceGunEquipped && (
    game.time < (game.surface.shotUntil ?? 0) || game.time < (game.surface.gunFiredUntil ?? 0)
  );
  const isReloadingGun = game.player.regolitoGunReloadUntil > game.time;
  const playerDamageFlash = game.time < (game.player.surfaceDamageFlashUntil ?? 0);
  const groundHoverboard = game.surface.hoverboard;
  if (groundHoverboard?.deployed) {
    const boardPoint = getSurfaceRenderPoint(groundHoverboard.x, groundHoverboard.y);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const tintedGroundBoard = getHoverboardFrame(HOVERBOARD_GROUND_SPRITE, 0, game.player.hue);
    if (tintedGroundBoard) {
      ctx.drawImage(tintedGroundBoard, boardPoint.x - 32, boardPoint.y - 24, 64, 48);
    } else if (HOVERBOARD_GROUND_SPRITE.complete && HOVERBOARD_GROUND_SPRITE.naturalWidth > 0) {
      ctx.drawImage(HOVERBOARD_GROUND_SPRITE, boardPoint.x - 32, boardPoint.y - 24, 64, 48);
    } else {
      ctx.fillStyle = '#39ff75';
      ctx.fillRect(boardPoint.x - 16, boardPoint.y + 5, 32, 4);
    }
    ctx.restore();
    const boardDistance = getSurfaceDistance(game.surface.x, game.surface.y, groundHoverboard.x, groundHoverboard.y);
    if (boardDistance <= SURFACE_TILE * 4) {
      if (groundHoverboard.mountUntil > game.time) {
        const mountDots = Math.max(1, Math.ceil(groundHoverboard.mountUntil - game.time));
        drawWorldText(`MONTANDO${'.'.repeat(Math.min(3, mountDots))}`, groundHoverboard.x, groundHoverboard.y + 30, '#d7ffd9', true);
      } else {
        drawWorldText('PULSA E', groundHoverboard.x, groundHoverboard.y + 30, '#d7ffd9', true);
      }
    }
  }
  const inventoryPoseSprite = !inventoryPanel.hidden
    ? Date.now() < playerInventoryClickUntil ? PLAYER_INVENTORY_CLICK_SPRITE : PLAYER_INVENTORY_SPRITE
    : null;
  if (inventoryPoseSprite?.complete && inventoryPoseSprite.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (playerDamageFlash) ctx.filter = 'brightness(0) invert(1)';
    ctx.translate(game.surface.x, game.surface.y);
    if (inventoryPoseSprite === PLAYER_INVENTORY_CLICK_SPRITE && playerInventoryClickFlipped) {
      ctx.scale(-1, 1);
    }
    const recolored = getPlayerInventoryFrame(inventoryPoseSprite, game.player.hue);
    if (recolored) {
      ctx.drawImage(recolored, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
    } else {
      ctx.drawImage(inventoryPoseSprite, 0, 0, 16, 16, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
    }
    ctx.restore();
  } else if (
    game.player.hoverboardEquipped &&
    (HOVERBOARD_SPRITES[game.surface.facing === 'right' ? 'left' : game.surface.facing]?.naturalWidth ?? 0) >= 96
  ) {
    const facing = game.surface.facing;
    const hoverboardSprite = HOVERBOARD_SPRITES[facing] ??
      (facing === 'right' ? HOVERBOARD_SPRITES.left : HOVERBOARD_SPRITES.down);
    if (hoverboardSprite.complete && hoverboardSprite.naturalWidth >= 96) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (playerDamageFlash) ctx.filter = 'brightness(0) invert(1)';
      ctx.translate(game.surface.x, game.surface.y);
      if (facing === 'right') ctx.scale(-1, 1);
      const frame = game.surface.isMoving ? game.surface.animationFrame % 2 : 0;
      const tintedFrame = getHoverboardFrame(hoverboardSprite, frame, game.player.hue);
      if (tintedFrame) {
        ctx.drawImage(tintedFrame, -36, -24, 72, 48);
      } else {
        ctx.drawImage(hoverboardSprite, frame * 48, 0, 48, 32, -36, -24, 72, 48);
      }
      ctx.restore();
    }
  } else if ((isSurfaceShooting || isKnifeSwinging) && SURFACE_SHOT_SPRITE.complete && SURFACE_SHOT_SPRITE.naturalWidth >= 48) {
    const shotFrames = { up: 0, left: 1, right: 1, down: 2 };
    const shotFrame = getNpcFrame(
      (shotFrames[game.surface.facing] ?? 2) * 16,
      0,
      game.player.hue,
      SURFACE_SHOT_SPRITE
    );
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (playerDamageFlash) ctx.filter = 'brightness(0) invert(1)';
    ctx.translate(game.surface.x, game.surface.y);
    if (game.surface.facing === 'right') ctx.scale(-1, 1);
    if (shotFrame) {
      ctx.drawImage(shotFrame, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
    }
    ctx.restore();
  } else if (PLAYER_SPRITE.complete && PLAYER_SPRITE.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (playerDamageFlash) ctx.filter = 'brightness(0) invert(1)';
    ctx.translate(game.surface.x, game.surface.y);
    if (playerFrame.flip) {
      ctx.scale(-1, 1);
    }
    const frameX = game.surface.animationFrame * 32 + playerFrame.x;
    // Cada cuadro se recorta en su propio canvas para que no se mezclen píxeles del cuadro vecino al hacer zoom.
    const recolored = getNpcFrame(frameX, playerFrame.y, game.player.hue);
    if (recolored) {
      ctx.drawImage(recolored, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
    } else {
      if (playerDamageFlash) {
        ctx.filter = 'brightness(0) invert(1)';
      } else if (game.player.hue !== PLAYER_CLOTHES_HUE) {
        ctx.filter = `hue-rotate(${game.player.hue - PLAYER_CLOTHES_HUE}deg)`;
      }
      ctx.drawImage(
        PLAYER_SPRITE,
        frameX,
        playerFrame.y,
        16,
        16,
        -PLAYER_SPRITE_SIZE / 2,
        -PLAYER_SPRITE_SIZE / 2,
        PLAYER_SPRITE_SIZE,
        PLAYER_SPRITE_SIZE
      );
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#fff176';
    ctx.beginPath();
    ctx.arc(game.surface.x, game.surface.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#332800';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const knifeSlashRemaining = (game.surface.knifeSlashUntil ?? 0) - game.time;
  const knifeSlashFacing = game.surface.knifeSlashFacing ?? game.surface.facing;
  if (
    isSurfaceItemEquipped(COBALTO_KNIFE_ITEM_ID) && knifeSlashRemaining > 0 &&
    COBALTO_KNIFE_SPRITE.complete && COBALTO_KNIFE_SPRITE.naturalWidth > 0
  ) {
    const directions = {
      up: { x: 0, y: -1, angle: -Math.PI / 2 },
      right: { x: 1, y: 0, angle: 0 },
      down: { x: 0, y: 1, angle: Math.PI / 2 },
      // Reflejar en horizontal evita voltear el arte verticalmente y subirlo al mirar a la izquierda.
      left: { x: -1, y: 0, angle: 0, flipX: true },
    };
    const direction = directions[knifeSlashFacing] ?? directions.down;
    const progress = 1 - knifeSlashRemaining / COBALTO_KNIFE_SWING_DURATION;
    const lunge = 14 + Math.sin(progress * Math.PI) * 12;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(game.surface.x + direction.x * lunge, game.surface.y + direction.y * lunge);
    ctx.rotate(direction.angle);
    if (direction.flipX) ctx.scale(-1, 1);
    ctx.globalAlpha = 0.85 + Math.sin(progress * Math.PI) * 0.15;
    // La textura es de 16×16: mantenerla cuadrada evita deformar el cuchillo.
    ctx.drawImage(COBALTO_KNIFE_SPRITE, -16, -16, 32, 32);
    ctx.restore();
  }
  if (
    !isKnifeSwinging && isSurfaceShooting && (!isReloadingGun || game.time < (game.surface.gunFiredUntil ?? 0)) &&
    REGOLITO_GUN_SPRITE.complete && REGOLITO_GUN_SPRITE.naturalWidth >= 16
  ) {
    const facing = game.surface.facing;
    const gunPlacement = SURFACE_GUN_PLACEMENTS[facing] ?? SURFACE_GUN_PLACEMENTS.down;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(game.surface.x + gunPlacement.x, game.surface.y + gunPlacement.y);
    ctx.rotate(gunPlacement.rotation);
    if (gunPlacement.flipX) ctx.scale(-1, 1);
    ctx.drawImage(REGOLITO_GUN_SPRITE, -24, -12, 48, 24);
    ctx.restore();
  }
  for (const projectile of game.surfaceProjectiles) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
    const hostileProjectile = projectile.owner === 'martian';
    ctx.fillStyle = hostileProjectile ? '#ffd2d7' : '#fff5bc';
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = hostileProjectile ? '#ff2638' : '#ffb34a';
    ctx.fillRect(-2, -1, 3, 2);
    ctx.restore();
  }
  const playerSpriteHalfHeight = game.player.hoverboardEquipped ? 24 : PLAYER_SPRITE_SIZE / 2;
  drawWorldText(multiplayerName, game.surface.x, game.surface.y - playerSpriteHalfHeight - 8, '#fff9c4', false, WORLD_FONT_SIZE / 1.5);
  drawPlayerChatBubble(
    game.surface.x,
    game.surface.y - playerSpriteHalfHeight - WORLD_FONT_SIZE / 1.5 - 18
  );
  drawRemotePlayersSurface(planet.name);
  if (isHomeworld(planet)) {
    const repairer = getSurfaceRenderPoint(getRepairerPosition().x, getRepairerPosition().y);
    const repairerHasSprite = drawNpcSprite(
      repairer.x,
      repairer.y,
      NPC_HUES.repairer,
      getEarthWandererGreetingFacing('repairer', repairer.x, repairer.y)
    );
    if (!repairerHasSprite) {
      ctx.fillStyle = '#24120d';
      ctx.beginPath();
      ctx.arc(repairer.x, repairer.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff9b71';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    drawWorldText('REPARADOR', repairer.x, repairer.y - (repairerHasSprite ? 22 : 15), '#ffc3a8', false, WORLD_FONT_SIZE / 1.5);
    const merchant = getSurfaceRenderPoint(getMerchantPosition().x, getMerchantPosition().y);
    const merchantHasSprite = drawNpcSprite(
      merchant.x,
      merchant.y,
      NPC_HUES.merchant,
      getEarthWandererGreetingFacing('merchant', merchant.x, merchant.y)
    );
    if (!merchantHasSprite) {
      ctx.fillStyle = '#06130a';
      ctx.beginPath();
      ctx.arc(merchant.x, merchant.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#54ff80';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    drawWorldText('COMERCIANTE', merchant.x, merchant.y - (merchantHasSprite ? 22 : 15), '#c8ffd6', false, WORLD_FONT_SIZE / 1.5);
    const giver = getSurfaceRenderPoint(getQuestGiverPosition().x, getQuestGiverPosition().y);
    const giverHasSprite = drawNpcSprite(
      giver.x,
      giver.y,
      NPC_HUES.questGiver,
      getEarthWandererGreetingFacing('questGiver', giver.x, giver.y)
    );
    if (!giverHasSprite) {
      ctx.fillStyle = '#06130a';
      ctx.beginPath();
      ctx.arc(giver.x, giver.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffe45b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    const missionMarker = getEarthMissionMarker();
    drawWorldText(
      missionMarker.text,
      giver.x,
      giver.y - (giverHasSprite ? 22 : 15),
      missionMarker.color,
      false,
      WORLD_FONT_SIZE / 1.5
    );
    const chest = getSurfaceRenderPoint(getHomeChestPosition().x, getHomeChestPosition().y);
    ctx.fillStyle = '#45260f';
    ctx.fillRect(chest.x - 13, chest.y - 8, 26, 19);
    ctx.fillStyle = '#b76b2b';
    ctx.fillRect(chest.x - 12, chest.y - 10, 24, 8);
    ctx.fillRect(chest.x - 11, chest.y + 1, 22, 8);
    ctx.fillStyle = '#f2c45e';
    ctx.fillRect(chest.x - 2, chest.y - 2, 4, 6);
    ctx.strokeStyle = '#251307';
    ctx.lineWidth = 2;
    ctx.strokeRect(chest.x - 13, chest.y - 10, 26, 21);
    drawWorldText('COFRE', chest.x, chest.y - 18, '#ffe2a1', false, WORLD_FONT_SIZE / 1.5);
    const bench = getSurfaceRenderPoint(getHomeWorkbenchPosition().x, getHomeWorkbenchPosition().y);
    ctx.fillStyle = '#1b0f06';
    ctx.fillRect(bench.x - 15, bench.y + 4, 30, 10);
    ctx.fillStyle = '#5a3a1c';
    ctx.fillRect(bench.x - 13, bench.y + 2, 5, 12);
    ctx.fillRect(bench.x + 8, bench.y + 2, 5, 12);
    ctx.fillStyle = '#9b6a35';
    ctx.fillRect(bench.x - 15, bench.y - 8, 30, 11);
    ctx.fillStyle = '#c28a4d';
    ctx.fillRect(bench.x - 15, bench.y - 8, 30, 3);
    ctx.fillStyle = '#c9d2d9';
    ctx.fillRect(bench.x - 11, bench.y - 13, 8, 5);
    ctx.fillStyle = '#5f6b75';
    ctx.fillRect(bench.x - 9, bench.y - 11, 4, 3);
    ctx.fillStyle = '#6fe3ff';
    ctx.fillRect(bench.x + 4, bench.y - 14, 6, 6);
    ctx.fillStyle = '#d7f8ff';
    ctx.fillRect(bench.x + 5, bench.y - 13, 2, 2);
    ctx.strokeStyle = '#251307';
    ctx.lineWidth = 2;
    ctx.strokeRect(bench.x - 15, bench.y - 8, 30, 11);
    drawWorldText('MESA DE TRABAJO', bench.x, bench.y - 22, '#ffd9a0', false, WORLD_FONT_SIZE / 1.5);
    const wanderer = game.earthWanderer;
    if (wanderer) {
      const wandererPoint = getSurfaceRenderPoint(wanderer.x, wanderer.y);
      const wandererHue = Math.floor(game.time * 3 + wanderer.hueOffset) % 360;
      const wandererHasSprite = drawNpcSprite(
        wanderer.x,
        wanderer.y,
        wandererHue,
        wanderer.facing,
        wanderer.animationFrame,
        game.time < (wanderer.hitFlashUntil ?? 0)
      );
      if (!wandererHasSprite) {
        ctx.fillStyle = `hsl(${wandererHue} 90% 58%)`;
        ctx.beginPath();
        ctx.arc(wandererPoint.x, wandererPoint.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      const wandererNameY = wanderer.y - (wandererHasSprite ? 22 : 15);
      drawWorldText(
        'VIAJERO',
        wanderer.x,
        wandererNameY,
        '#f4f0ff',
        false,
        WORLD_FONT_SIZE / 1.5
      );
      if (earthWandererDialogOpen && earthWandererDialogText) {
        drawSpeechBubble(earthWandererDialogText, wanderer.x, wandererNameY - 4, '#d7b8ff', '#f4eaff');
      }
      if (!earthWandererDialogOpen && wanderer.greetingPhase === 'hello') {
        drawSpeechBubble('¡Hola!', wanderer.x, wandererNameY - 4, '#d7b8ff', '#f4eaff');
      }
      if (!earthWandererDialogOpen && wanderer.greetingPhase === 'reply') {
        const greetingTargets = {
          repairer: { position: repairer, hasSprite: repairerHasSprite, nameY: repairer.y - (repairerHasSprite ? 22 : 15) },
          merchant: { position: merchant, hasSprite: merchantHasSprite, nameY: merchant.y - (merchantHasSprite ? 22 : 15) },
          questGiver: { position: giver, hasSprite: giverHasSprite, nameY: giver.y - (giverHasSprite ? 22 : 15) },
        };
        const greetingTarget = greetingTargets[wanderer.greetingTarget];
        if (greetingTarget) {
          drawSpeechBubble('¡Hola!', greetingTarget.position.x, greetingTarget.nameY - 4, '#fff0a8', '#fff8d8');
        }
      }
    }
    const nearbyPickup = getSurfacePickupCandidates(game.surface.x, game.surface.y, 56, 56).some((pickup) =>
      getSurfaceDistance(pickup.x, pickup.y, game.surface.x, game.surface.y) <= 56
    );
    if (isNearRepairer() && !nearbyPickup) {
      drawWorldText('PULSA E', repairer.x, repairer.y + 34, '#ffc3a8', true);
    }
    if (isNearQuestGiver() && !nearbyPickup) {
      drawWorldText('PULSA E', giver.x, giver.y + 34, '#ffe45b', true);
    }
    if (isNearMerchant() && !nearbyPickup) {
      drawWorldText('PULSA E', merchant.x, merchant.y + 34, '#c8ffd6', true);
    }
    if (isNearHomeChest() && !nearbyPickup) {
      drawWorldText('PULSA E', chest.x, chest.y + 28, '#ffe2a1', true);
    }
    if (isNearWorkbench() && !nearbyPickup) {
      drawWorldText('PULSA E', bench.x, bench.y + 28, '#ffd9a0', true);
    }
    if (isNearEarthWanderer() && !earthWandererDialogOpen && !nearbyPickup && !isNearRepairer() && !isNearQuestGiver() && !isNearMerchant() && !isNearHomeChest() && !isNearWorkbench()) {
      drawWorldText('PULSA E', wanderer.x, wanderer.y + 34, '#f4f0ff', true);
    }
  }
  if (isMars(planet) && game.martianNpcs) {
    const conversation = game.martianConversation;
    const speakerId = conversation
      ? (conversation.phase % 2 === 0 ? conversation.firstId : conversation.secondId)
      : null;
    for (const martian of game.martianNpcs) {
      const martianPoint = getSurfaceRenderPoint(martian.x, martian.y);
      const hasSprite = drawNpcSprite(
        martian.x,
        martian.y,
        120,
        martian.facing,
        martian.animationFrame
      );
      if (!hasSprite) {
        ctx.fillStyle = '#35d65b';
        ctx.beginPath();
        ctx.arc(martianPoint.x, martianPoint.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      const nameY = martian.y - (hasSprite ? 22 : 15);
      drawWorldText('MARCIANO', martian.x, nameY, '#a7ffb7', false, WORLD_FONT_SIZE / 1.5);
      if (conversation && speakerId === martian.id) {
        drawSpeechBubble(conversation.lines[conversation.phase], martian.x, nameY - 4, '#83f49b', '#eaffed');
      }
    }
  }
  if ((isMars(planet) || isLuna(planet)) && game.martianEnemies) {
    for (const enemy of game.martianEnemies) {
      const point = getSurfaceRenderPoint(enemy.x, enemy.y);
      const shooting = game.time < (enemy.shotUntil ?? 0);
      const reloading = enemy.reloadUntil > game.time;
      const reloadAnimation = reloading && (game.time - (enemy.reloadStartedAt ?? game.time)) % 1 < 0.25;
      const showingShotAnimation = shooting || reloadAnimation;
      const enemyHue = enemy.type === 'lunatic' ? 120 : 0;
      const enemySprite = enemy.type === 'lunatic' ? LUNATIC_SPRITE : PLAYER_SPRITE;
      const enemyShotSprite = enemy.type === 'lunatic' ? LUNATIC_SHOOT_SPRITE : SURFACE_SHOT_SPRITE;
      let hasSprite = false;
      const enemyFlashing = game.time < (enemy.flashUntil ?? 0);
      if (showingShotAnimation && enemyShotSprite.complete && enemyShotSprite.naturalWidth >= 48) {
        const frameIndex = { up: 0, left: 1, right: 1, down: 2 }[enemy.facing] ?? 2;
        const shotFrame = getNpcFrame(frameIndex * 16, 0, enemyHue, enemyShotSprite);
        if (shotFrame) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          if (enemyFlashing) ctx.filter = 'brightness(0) invert(1)';
          ctx.translate(point.x, point.y);
          if (enemy.facing === 'right') ctx.scale(-1, 1);
          ctx.drawImage(shotFrame, -PLAYER_SPRITE_SIZE / 2, -PLAYER_SPRITE_SIZE / 2, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE);
          ctx.restore();
          hasSprite = true;
        }
      }
      if (!hasSprite) {
        hasSprite = drawNpcSprite(enemy.x, enemy.y, enemyHue, enemy.facing, enemy.animationFrame, enemyFlashing, enemySprite);
      }
      if (!hasSprite) {
        ctx.fillStyle = '#ed3347';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      if (shooting && REGOLITO_GUN_SPRITE.complete && REGOLITO_GUN_SPRITE.naturalWidth >= 16) {
        const placement = SURFACE_GUN_PLACEMENTS[enemy.facing] ?? SURFACE_GUN_PLACEMENTS.down;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(point.x + placement.x, point.y + placement.y);
        ctx.rotate(placement.rotation);
        if (placement.flipX) ctx.scale(-1, 1);
        ctx.drawImage(REGOLITO_GUN_SPRITE, -24, -12, 48, 24);
        ctx.restore();
      }
      drawWorldText(enemy.type === 'lunatic' ? 'ALIEN LUNÁTICO' : 'MARC. HOSTIL', enemy.x, enemy.y - 38,
        enemy.type === 'lunatic' ? '#e7b5ff' : '#ff9aa4', false, WORLD_FONT_SIZE / 1.5);
    }
  }
  ctx.restore();
  if (isMars(planet)) drawMarsSideFog();
}

let surfacePieHudCanvas = null;

function drawSurfacePie(centerX, centerY, radius, sliceCount, filledSlices) {
  if (!surfacePieHudCanvas) surfacePieHudCanvas = document.createElement('canvas');
  const size = Math.ceil(radius * 2);
  if (surfacePieHudCanvas.width !== size || surfacePieHudCanvas.height !== size) {
    surfacePieHudCanvas.width = size;
    surfacePieHudCanvas.height = size;
  }
  const pieContext = surfacePieHudCanvas.getContext('2d');
  pieContext.clearRect(0, 0, size, size);
  pieContext.fillStyle = '#39ff75';
  for (let slice = 0; slice < filledSlices; slice += 1) {
    const start = -Math.PI / 2 + slice * Math.PI * 2 / sliceCount;
    const end = -Math.PI / 2 + (slice + 1) * Math.PI * 2 / sliceCount;
    pieContext.beginPath();
    pieContext.moveTo(radius, radius);
    pieContext.arc(radius, radius, radius, start, end);
    pieContext.closePath();
    pieContext.fill();
  }
  pieContext.globalCompositeOperation = 'destination-out';
  pieContext.strokeStyle = '#000';
  pieContext.lineWidth = 3;
  pieContext.lineCap = 'butt';
  for (let divider = 0; divider < sliceCount; divider += 1) {
    const angle = -Math.PI / 2 + divider * Math.PI * 2 / sliceCount;
    pieContext.beginPath();
    pieContext.moveTo(radius, radius);
    pieContext.lineTo(radius + Math.cos(angle) * radius, radius + Math.sin(angle) * radius);
    pieContext.stroke();
  }
  pieContext.globalCompositeOperation = 'source-over';
  const active = (game.surface?.ammoHudActiveUntil ?? 0) > game.time ||
    (game.player.damageHudUntil ?? 0) > game.time;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.5;
  ctx.drawImage(surfacePieHudCanvas, centerX - radius, centerY - radius);
  ctx.restore();
}

function drawSurfaceGunAmmoHud() {
  if (game.scene !== 'surface' || !getEquippedSurfaceGun()) return;
  const ammo = clamp(game.player.regolitoGunAmmo, 0, REGOLITO_GUN_MAGAZINE_SIZE);
  const radius = 40;
  const frameInset = clamp(Math.min(game.width, game.height) * 0.025, 8, 18);
  const framePadding = frameInset + 16;
  const centerX = radius + framePadding;
  const centerY = game.height - radius - framePadding;
  drawSurfacePie(centerX, centerY, radius, REGOLITO_GUN_MAGAZINE_SIZE, ammo);
}

function drawSurfaceLifeHud() {
  if (game.scene !== 'surface' || !game.surface) return;
  const radius = 40;
  const frameInset = clamp(Math.min(game.width, game.height) * 0.025, 8, 18);
  const framePadding = frameInset + 16;
  const centerX = game.width - radius - framePadding;
  const centerY = game.height - radius - framePadding;
  const lives = 3;
  const currentHealth = clamp(game.player.surfaceHealth ?? lives, 0, lives);
  drawSurfacePie(centerX, centerY, radius, lives, currentHealth);
}

function drawLunaFisheyeCorners(source, blurred) {
  const blurContext = blurred.getContext('2d');
  const pixelRatio = window.devicePixelRatio || 1;
  blurContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  blurContext.clearRect(0, 0, game.width, game.height);
  blurContext.filter = 'blur(18px)';
  blurContext.drawImage(source, 0, 0, source.width, source.height, 0, 0, game.width, game.height);
  blurContext.filter = 'none';

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  const sideBands = [
    { width: 0.07, alpha: 0.16 },
    { width: 0.14, alpha: 0.2 },
    { width: 0.22, alpha: 0.25 },
  ];
  for (const band of sideBands) {
    const sideWidth = game.width * band.width;
    ctx.beginPath();
    ctx.rect(0, 0, sideWidth, game.height);
    ctx.rect(game.width - sideWidth, 0, sideWidth, game.height);
    ctx.clip();
    ctx.globalAlpha = band.alpha;
    ctx.drawImage(blurred, 0, 0, blurred.width, blurred.height, 0, 0, game.width, game.height);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.restore();
}

function drawMarsSideFog() {
  const fogWidth = Math.min(300, game.width * 0.24);
  const fogColor = '255, 119, 54';
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const leftFog = ctx.createLinearGradient(0, 0, fogWidth, 0);
  leftFog.addColorStop(0, `rgba(${fogColor}, 0.28)`);
  leftFog.addColorStop(0.38, `rgba(${fogColor}, 0.14)`);
  leftFog.addColorStop(1, `rgba(${fogColor}, 0)`);
  ctx.fillStyle = leftFog;
  ctx.fillRect(0, 0, fogWidth, game.height);

  const rightFog = ctx.createLinearGradient(game.width, 0, game.width - fogWidth, 0);
  rightFog.addColorStop(0, `rgba(${fogColor}, 0.28)`);
  rightFog.addColorStop(0.38, `rgba(${fogColor}, 0.14)`);
  rightFog.addColorStop(1, `rgba(${fogColor}, 0)`);
  ctx.fillStyle = rightFog;
  ctx.fillRect(game.width - fogWidth, 0, fogWidth, game.height);
  ctx.restore();
}

function draw() {
  if (game.scene === 'surface') {
    drawSurface();
    return;
  }

  drawBackground();
  ctx.save();
  ctx.translate(game.width / 2, game.height / 2);
  ctx.scale(CAMERA_ZOOM * playerZoom, CAMERA_ZOOM * playerZoom);
  ctx.translate(-game.width / 2, -game.height / 2);
  drawPlanets();
  drawHostileCombat();
  drawRemotePlayersSpace();
  drawPlayer();
  ctx.restore();
  drawEmergencyServiceShip();
  drawRemoteSpaceLabels();
  drawEnemyEdgeIndicators();
  drawWorldText(multiplayerName, game.width / 2, game.height / 2 - 22, '#fff9c4', false, WORLD_FONT_SIZE / 1.5);
  drawPlayerChatBubble(game.width / 2, game.height / 2 - 34);
  drawRadar();
  drawSpaceFrame();
  drawSelectedHostileHealth();
}

function drawSpaceFrame() {
  const inset = clamp(Math.min(game.width, game.height) * 0.025, 8, 18);
  const frameColor = getHealthFrameColor();
  ctx.save();
  ctx.globalAlpha = spaceHudOpacity;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 1;
  ctx.shadowColor = frameColor;
  ctx.shadowBlur = 4;
  ctx.strokeRect(
    inset + 0.5,
    inset + 0.5,
    Math.max(0, game.width - inset * 2 - 1),
    Math.max(0, game.height - inset * 2 - 1)
  );
  ctx.restore();
}

function drawEmergencyServiceShip() {
  const service = game.emergencyService;
  const ship = service?.ship;
  const target = ship || service?.pilotCapsule;
  if (!target || game.scene !== 'space') return;
  const screenX = target.x - game.player.x + game.width / 2;
  const screenY = target.y - game.player.y + game.height / 2;
  const scale = CAMERA_ZOOM * playerZoom;
  const projectedX = game.width / 2 + (screenX - game.width / 2) * scale;
  const projectedY = game.height / 2 + (screenY - game.height / 2) * scale;
  const inView = projectedX >= 0 && projectedX <= game.width &&
    projectedY >= 0 && projectedY <= game.height;
  if (!inView) {
    const dx = projectedX - game.width / 2;
    const dy = projectedY - game.height / 2;
    const distance = Math.hypot(dx, dy) || 1;
    const directionX = dx / distance;
    const directionY = dy / distance;
    const margin = 14;
    const edgeDistance = Math.min(
      Math.abs(directionX) > 1e-6 ? (game.width / 2 - margin) / Math.abs(directionX) : Infinity,
      Math.abs(directionY) > 1e-6 ? (game.height / 2 - margin) / Math.abs(directionY) : Infinity
    );
    const worldDistance = Math.hypot(target.x - game.player.x, target.y - game.player.y);
    const approach = clamp(1 - worldDistance / (CHUNK_SIZE * 3), 0, 1);
    const radius = 2 + approach * 5;
    ctx.save();
    ctx.fillStyle = '#28cfff';
    ctx.shadowColor = '#28cfff';
    ctx.shadowBlur = 4 + approach * 5;
    ctx.beginPath();
    ctx.arc(
      game.width / 2 + directionX * edgeDistance,
      game.height / 2 + directionY * edgeDistance,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
    return;
  }
  const drawX = projectedX;
  const drawY = projectedY;

  if (ship && service.phase === 'towing') {
    ctx.save();
    ctx.strokeStyle = 'rgba(88, 237, 255, 0.82)';
    ctx.shadowColor = '#50e9ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX, drawY);
    ctx.lineTo(game.width / 2, game.height / 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.rotate(target.angle || 0);
  ctx.scale(scale, scale);
  if (ship) {
    const speed = Math.hypot(ship.velocityX, ship.velocityY);
    if (speed > 0.5) {
      drawFlexibleThrusterFlame(ctx, clamp(4 + speed * 0.02, 4, 28), '#5eeaff', clamp(speed / 90, 0.2, 1), ship.flameBend);
    }
    ctx.shadowColor = '#50e9ff';
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 1;
    drawShipParts(ctx, 0, 0, 6, ship.shipParts);
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = '#ffd17a';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#eff4ff';
    ctx.strokeStyle = '#ffc65e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  const label = service.phase === 'pilot-escape'
    ? 'CÁPSULA DE RESCATE'
    : service.phase === 'returning'
    ? 'REGRESO A TIERRA'
    : service.type === 'delivery' ? 'NAVE DE ENTREGA' : 'NAVE DE RESCATE';
  drawWorldText(label, drawX, drawY - 15, '#9af7ff', false, WORLD_FONT_SIZE / 1.5);
}

function getInventoryMapBase() {
  return game.scene === 'surface'
    ? { x: game.surface.planet.x, y: game.surface.planet.y }
    : { x: game.player.x, y: game.player.y };
}

function getInventoryMapCenter() {
  const base = getInventoryMapBase();
  return { x: base.x + inventoryMapPan.x, y: base.y + inventoryMapPan.y };
}

function getRadarChunks() {
  const centerChunkX = Math.floor(game.player.x / CHUNK_SIZE);
  const centerChunkY = Math.floor(game.player.y / CHUNK_SIZE);
  if (!radarChunkCacheCenter || radarChunkCacheCenter.x !== centerChunkX || radarChunkCacheCenter.y !== centerChunkY) {
    radarChunkCacheCenter = { x: centerChunkX, y: centerChunkY };
    for (const key of radarChunkCache.keys()) {
      const [chunkX, chunkY] = key.split(',').map(Number);
      const dx = chunkX - centerChunkX;
      const dy = chunkY - centerChunkY;
      if (dx * dx + dy * dy > RADAR_RANGE_CHUNKS * RADAR_RANGE_CHUNKS) radarChunkCache.delete(key);
    }
    for (let dx = -RADAR_RANGE_CHUNKS; dx <= RADAR_RANGE_CHUNKS; dx += 1) {
      for (let dy = -RADAR_RANGE_CHUNKS; dy <= RADAR_RANGE_CHUNKS; dy += 1) {
        if (dx * dx + dy * dy > RADAR_RANGE_CHUNKS * RADAR_RANGE_CHUNKS) continue;
        const chunkX = centerChunkX + dx;
        const chunkY = centerChunkY + dy;
        const key = `${chunkX},${chunkY}`;
        if (!radarChunkCache.has(key)) {
          radarChunkCache.set(key, game.chunks.get(key) ?? createChunk(chunkX, chunkY, false));
        }
      }
    }
  }
  return radarChunkCache.values();
}

function drawRadar() {
  if (game.scene !== 'space' || !hasInventoryItem('radar')) return;
  const radius = clamp(Math.min(game.width, game.height) * 0.135, 75, 108);
  const frameInset = clamp(Math.min(game.width, game.height) * 0.025, 8, 18);
  const framePadding = frameInset + 16;
  const centerX = game.width - radius - framePadding;
  const centerY = game.height - radius - framePadding;
  const scale = radius / RADAR_RANGE_WORLD;
  const frameColor = getHealthFrameColor();

  ctx.save();
  ctx.globalAlpha = spaceHudOpacity;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(2, 18, 8, 0.92)';
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  ctx.strokeStyle = 'rgba(75, 255, 112, 0.25)';
  ctx.lineWidth = 1;
  for (const fraction of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * fraction, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.moveTo(centerX, centerY - radius);
  ctx.lineTo(centerX, centerY + radius);
  ctx.stroke();

  // Cuadrícula de chunks alineada con las coordenadas reales del mundo.
  ctx.strokeStyle = 'rgba(88, 255, 116, 0.2)';
  ctx.lineWidth = 0.7;
  const firstChunkX = Math.floor((game.player.x - RADAR_RANGE_WORLD) / CHUNK_SIZE);
  const lastChunkX = Math.ceil((game.player.x + RADAR_RANGE_WORLD) / CHUNK_SIZE);
  for (let chunkX = firstChunkX; chunkX <= lastChunkX; chunkX += 1) {
    const screenX = centerX + (chunkX * CHUNK_SIZE - game.player.x) * scale;
    ctx.beginPath();
    ctx.moveTo(screenX, centerY - radius);
    ctx.lineTo(screenX, centerY + radius);
    ctx.stroke();
  }
  const firstChunkY = Math.floor((game.player.y - RADAR_RANGE_WORLD) / CHUNK_SIZE);
  const lastChunkY = Math.ceil((game.player.y + RADAR_RANGE_WORLD) / CHUNK_SIZE);
  for (let chunkY = firstChunkY; chunkY <= lastChunkY; chunkY += 1) {
    const screenY = centerY + (chunkY * CHUNK_SIZE - game.player.y) * scale;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, screenY);
    ctx.lineTo(centerX + radius, screenY);
    ctx.stroke();
  }

  const drawDot = (worldX, worldY, color, dotRadius = 2) => {
    const dx = worldX - game.player.x;
    const dy = worldY - game.player.y;
    if (dx * dx + dy * dy > RADAR_RANGE_WORLD * RADAR_RANGE_WORLD) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX + dx * scale, centerY + dy * scale, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  for (const chunk of getRadarChunks()) {
    for (const star of chunk.systems) {
      drawDot(star.x, star.y, star.isHub ? '#ffd27c' : '#d9f2ff', star.isHub ? 3 : 2.2);
      for (const planet of star.planets) {
        updatePlanetPosition(planet);
        drawDot(planet.x, planet.y, planet.color ?? '#c9eaff', isHomeworld(planet) ? 2.4 : 1.6);
      }
    }
    if (chunk.blackHole) drawDot(chunk.blackHole.x, chunk.blackHole.y, '#d079ff', 3);
  }

  for (const drone of game.hostileDrones) drawDot(drone.x, drone.y, '#ff3d58', 2.8);
  const serviceShip = game.emergencyService?.ship;
  if (serviceShip) drawDot(serviceShip.x, serviceShip.y, '#43eeff', 2.8);

  ctx.fillStyle = '#66ff83';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e5ffe9';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = spaceHudOpacity;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = frameColor;
  ctx.shadowBlur = 9;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#caffd3';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('RADAR', centerX, centerY - radius + 7);
  ctx.restore();

  const speed = Math.round(Math.hypot(game.player.velocityX, game.player.velocityY));
  const speedText = speed.toLocaleString('es-ES');
  const speedX = framePadding;
  const speedY = multiplayerStatus.hidden ? framePadding : framePadding + 54;
  ctx.save();
  ctx.globalAlpha = spaceHudOpacity;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const speedWidth = ctx.measureText(speedText).width + 12;
  ctx.fillStyle = 'rgba(2, 18, 8, 0.82)';
  ctx.fillRect(speedX, speedY, speedWidth, 23);
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(speedX, speedY, speedWidth, 23);
  ctx.fillStyle = '#caffd3';
  ctx.fillText(speedText, speedX + 6, speedY + 11.5);
  ctx.restore();
}

function drawInventoryMap() {
  const width = inventoryMap.width;
  const height = inventoryMap.height;
  const context = inventoryMapContext;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const mapBase = getInventoryMapBase();
  const mapCenter = getInventoryMapCenter();
  const scale = inventoryMapZoom * 0.035;
  const objects = [];
  const drawnStars = new Set();
  const gridOpacity = clamp(inventoryMapZoom, 0.0625, 1);

  const leftWorld = mapCenter.x - centerX / scale;
  const rightWorld = mapCenter.x + centerX / scale;
  const topWorld = mapCenter.y - centerY / scale;
  const bottomWorld = mapCenter.y + centerY / scale;
  context.lineWidth = 1;
  for (
    let chunkX = Math.floor(leftWorld / CHUNK_SIZE);
    chunkX <= Math.ceil(rightWorld / CHUNK_SIZE);
    chunkX += 1
  ) {
    const screenX = centerX + (chunkX * CHUNK_SIZE - mapCenter.x) * scale;
    const pulse = Math.max(0, Math.sin(game.time * 0.55 - chunkX * 0.7)) ** 3;
    const whiteness = pulse * 0.5;
    const red = Math.round(48 + (235 - 48) * whiteness);
    const green = Math.round(180 + (255 - 180) * whiteness);
    const blue = Math.round(78 + (235 - 78) * whiteness);
    context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.35 * gridOpacity})`;
    context.beginPath();
    context.moveTo(screenX, 0);
    context.lineTo(screenX, height);
    context.stroke();
  }
  for (
    let chunkY = Math.floor(topWorld / CHUNK_SIZE);
    chunkY <= Math.ceil(bottomWorld / CHUNK_SIZE);
    chunkY += 1
  ) {
    const screenY = centerY + (chunkY * CHUNK_SIZE - mapCenter.y) * scale;
    const pulse = Math.max(0, Math.sin(game.time * 0.55 - chunkY * 0.7 - 1.8)) ** 3;
    const whiteness = pulse * 0.5;
    const red = Math.round(48 + (235 - 48) * whiteness);
    const green = Math.round(180 + (255 - 180) * whiteness);
    const blue = Math.round(78 + (235 - 78) * whiteness);
    context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.35 * gridOpacity})`;
    context.beginPath();
    context.moveTo(0, screenY);
    context.lineTo(width, screenY);
    context.stroke();
  }

  for (const chunk of game.chunks.values()) {
    for (const star of chunk.systems) {
      const screenX = centerX + (star.x - mapCenter.x) * scale;
      const screenY = centerY + (star.y - mapCenter.y) * scale;
      if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
        const radius = star.isHub ? 4 : 3;
        objects.push({
          name: star.name,
          x: star.x,
          y: star.y,
          screenX,
          screenY,
          radius,
        });
        context.fillStyle = '#fff';
        context.beginPath();
        context.arc(screenX, screenY, radius, 0, Math.PI * 2);
        context.fill();
        drawnStars.add(`${star.chunkX},${star.chunkY}`);
      }
    }
  }

  const trackedStar = (game.pointer.followPlanet || game.selectedPlanet)?.star;
  if (trackedStar && !drawnStars.has(`${trackedStar.chunkX},${trackedStar.chunkY}`)) {
    const screenX = centerX + (trackedStar.x - mapCenter.x) * scale;
    const screenY = centerY + (trackedStar.y - mapCenter.y) * scale;
    if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
      objects.push({
        name: trackedStar.name,
        x: trackedStar.x,
        y: trackedStar.y,
        screenX,
        screenY,
        radius: trackedStar.isHub ? 4 : 3,
      });
      context.fillStyle = '#fff';
      context.beginPath();
      context.arc(screenX, screenY, trackedStar.isHub ? 4 : 3, 0, Math.PI * 2);
      context.fill();
    }
  }

  for (const planet of game.planets) {
    const screenX = centerX + (planet.x - mapCenter.x) * scale;
    const screenY = centerY + (planet.y - mapCenter.y) * scale;
    if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
      objects.push({
        name: planet.name,
        x: planet.x,
        y: planet.y,
        screenX,
        screenY,
        radius: 2,
        planet,
      });
      context.fillStyle = '#fff';
      context.beginPath();
      context.arc(screenX, screenY, 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  const mapService = game.emergencyService;
  const serviceShip = mapService?.phase === 'returning' || mapService?.phase === 'pilot-escape'
    ? null
    : mapService?.ship;
  if (serviceShip) {
    const screenX = centerX + (serviceShip.x - mapCenter.x) * scale;
    const screenY = centerY + (serviceShip.y - mapCenter.y) * scale;
    if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
      const service = mapService;
      const label = service.type === 'delivery' ? 'Nave express' : 'Nave de remolque';
      objects.push({
        name: label,
        x: serviceShip.x,
        y: serviceShip.y,
        screenX,
        screenY,
        radius: 7,
      });
      context.fillStyle = 'rgba(53, 231, 255, 0.3)';
      context.beginPath();
      context.arc(screenX, screenY, 11, 0, Math.PI * 2);
      context.fill();
      context.save();
      context.translate(screenX, screenY);
      context.rotate(serviceShip.angle || 0);
      context.fillStyle = '#40efff';
      context.strokeStyle = '#e0fcff';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(8, 0);
      context.lineTo(-6, -5);
      context.lineTo(-3, 0);
      context.lineTo(-6, 5);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  if (game.scene === 'space' && hasInventoryItem('enemy-detector')) {
    for (const drone of game.hostileDrones) {
      const screenX = centerX + (drone.x - mapCenter.x) * scale;
      const screenY = centerY + (drone.y - mapCenter.y) * scale;
      if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) continue;
      objects.push({
        name: 'Enemigo detectado',
        x: drone.x,
        y: drone.y,
        screenX,
        screenY,
        radius: 5,
      });
      context.fillStyle = 'rgba(255, 40, 55, 0.25)';
      context.beginPath();
      context.arc(screenX, screenY, 9, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ff2638';
      context.beginPath();
      context.arc(screenX, screenY, 5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#ffd4d8';
      context.lineWidth = 1;
      context.stroke();
    }
  }

  context.fillStyle = '#7dff9b';
  context.beginPath();
  context.arc(
    centerX + (mapBase.x - mapCenter.x) * scale,
    centerY + (mapBase.y - mapCenter.y) * scale,
    3,
    0,
    Math.PI * 2
  );
  context.fill();

  return objects;
}

function updateShipAbilityBar() {
  const aboardShip = game.scene === 'space' && !game.emergencyReturn;
  shipAbilities.hidden = !aboardShip;
  updateSurfaceAbilityBar();
  if (!aboardShip) return;

  for (const cell of shipAbilityCells) {
    const slot = cell.dataset.shipPart;
    const partId = game.player.shipParts[slot];
    const part = getShipPart(partId);
    const icon = cell.querySelector('.ship-ability-icon');
    cell.hidden = !part;
    cell.classList.toggle('is-disabled', !isShipPartOperational(slot));
    cell.setAttribute('aria-label', part?.name || 'Pieza no equipada');
    if (icon && icon.dataset.partId !== (partId || '')) {
      icon.dataset.partId = partId || '';
      if (part?.src) icon.src = part.src;
      else icon.removeAttribute('src');
      icon.alt = part?.name || 'Pieza no equipada';
    }
  }
  shipAbilities.hidden = !aboardShip || shipAbilityCells.every((cell) => cell.hidden);
  const cooldown = Math.max(0, game.player.weaponCooldown || 0);
  const tipReady = isShipPartOperational('tip');
  tipCooldownEl.hidden = !tipReady || cooldown <= 0;
  const tip = getShipPart(game.player.shipParts.tip);
  const cooldownDuration = Math.max(0.001, tip?.stats?.weaponCooldown ?? 1.1);
  const progress = clamp(1 - cooldown / cooldownDuration, 0, 1);
  tipCooldownEl.style.setProperty('--cooldown-progress', `${progress * 100}%`);

  const centerCooldown = Math.max(0, game.player.centerAbilityReadyAt - game.time);
  const centerReady = isShipPartOperational('center');
  centerCooldownEl.hidden = !centerReady || centerCooldown <= 0;
  const centerProgress = clamp(1 - centerCooldown / CENTER_ABILITY_COOLDOWN, 0, 1);
  centerCooldownEl.style.setProperty('--cooldown-progress', `${centerProgress * 100}%`);

  const propulsorId = game.player.shipParts.propulsor;
  const propulsorProfile = getPropulsorAbilityProfile(propulsorId);
  const propulsorCooldown = Math.max(0, game.player.propulsionAbilityReadyAt - game.time);
  const propulsorReady = isShipPartOperational('propulsor');
  propulsorCooldownEl.hidden = !propulsorReady || !propulsorProfile || propulsorCooldown <= 0;
  const propulsorProgress = propulsorProfile
    ? clamp(1 - propulsorCooldown / propulsorProfile.cooldown, 0, 1)
    : 0;
  propulsorCooldownEl.style.setProperty('--cooldown-progress', `${propulsorProgress * 100}%`);
}

function updateSurfaceAbilityBar() {
  const equippedItems = game.player.surfaceEquipment.filter(Boolean);
  const onSurface = game.scene === 'surface' && Boolean(game.surface);
  surfaceAbilities.hidden = !onSurface || equippedItems.length === 0;
  if (
    selectedSurfaceAbilitySlot !== null &&
    (game.player.hoverboardEquipped || ![REGOLITO_GUN_ITEM_ID, COBALTO_KNIFE_ITEM_ID].includes(game.player.surfaceEquipment[selectedSurfaceAbilitySlot]))
  ) selectedSurfaceAbilitySlot = null;

  for (const cell of surfaceAbilityCells) {
    const slotIndex = Number(cell.dataset.surfaceSlot);
    const shortcut = SURFACE_ABILITY_KEYS[slotIndex];
    const itemId = game.player.surfaceEquipment[slotIndex];
    const item = getSurfaceUsableItem(itemId);
    const icon = cell.querySelector('.ship-ability-icon');
    const active = itemId === HOVERBOARD_ITEM_ID && game.player.hoverboardEquipped;
    const selected = slotIndex === selectedSurfaceAbilitySlot;
    cell.hidden = !item;
    cell.dataset.shortcut = shortcut;
    cell.classList.toggle('is-selected', slotIndex === selectedSurfaceAbilitySlot);
    cell.classList.toggle('is-active', active && (selectedSurfaceAbilitySlot === null || selected));
    cell.setAttribute('aria-pressed', String(active));
    const hoverboardOnGround = itemId === HOVERBOARD_ITEM_ID && game.surface?.hoverboard?.deployed;
    const isCombatWeapon = itemId === REGOLITO_GUN_ITEM_ID || itemId === COBALTO_KNIFE_ITEM_ID;
    const action = isCombatWeapon
      ? selected ? 'apunta y haz clic en el mundo para atacar' : `pulsa ${shortcut} para seleccionar`
      : active ? 'dejar en el suelo' : hoverboardOnGround ? 'montar con E' : 'sacar';
    cell.setAttribute('aria-label', item ? `${shortcut}: ${item.name}${active ? ', activo' : ''}${selected ? ', seleccionada' : ''}` : `Slot ${shortcut} vacío`);
    cell.title = item ? `${shortcut} · ${item.name} · ${action}` : `Slot ${shortcut} vacío`;
    const previewSprite = getItemPreviewSprite(item);
    if (icon) {
      icon.hidden = !previewSprite;
      if (previewSprite) setItemPreviewSource(icon, previewSprite);
      icon.alt = item?.name ?? '';
    }
    let glyph = cell.querySelector('.surface-ability-glyph');
    if (item && !previewSprite) {
      if (!glyph) {
        glyph = document.createElement('span');
        glyph.className = 'surface-ability-glyph';
        cell.append(glyph);
      }
      glyph.textContent = item.icon;
      glyph.style.color = item.color;
    } else {
      glyph?.remove();
    }
  }
}

// ---------------------------------------------------------------- Menú de pausa (Esc)
const HUD_SCALES = [0.75, 1, 1.25, 1.5];
const HUD_SCALE_KEY = 'spaceheaven-hud-scale';
const gameShell = document.querySelector('.game-shell');
let hudScaleIndex = 1;
let pauseMenuOpen = false;
try {
  const savedHudScale = HUD_SCALES.indexOf(Number(localStorage.getItem(HUD_SCALE_KEY)));
  if (savedHudScale >= 0) hudScaleIndex = savedHudScale;
} catch {
  // Sin almacenamiento: se usa el tamaño normal.
}

const pauseMenu = document.createElement('div');
pauseMenu.className = 'pause-menu';
pauseMenu.hidden = true;
pauseMenu.innerHTML = `
  <div class="pause-menu-box" role="dialog" aria-modal="true" aria-label="Menú">
    <button type="button" class="pause-menu-option" data-action="hud"></button>
    <button type="button" class="pause-menu-option" data-action="restart">Reiniciar partida</button>
    <button type="button" class="pause-menu-option" data-action="exit">Salir</button>
    <p class="pause-menu-note" hidden></p>
  </div>`;
gameShell.append(pauseMenu);
const pauseMenuButtons = [...pauseMenu.querySelectorAll('.pause-menu-option')];
const hudScaleButton = pauseMenu.querySelector('[data-action="hud"]');
const pauseMenuNote = pauseMenu.querySelector('.pause-menu-note');

function applyHudScale() {
  gameShell.style.setProperty('--hud-scale', String(HUD_SCALES[hudScaleIndex]));
  hudScaleButton.textContent = `Tamaño del HUD: ${Math.round(HUD_SCALES[hudScaleIndex] * 100)}%`;
}

function changeHudScale(step) {
  hudScaleIndex = (hudScaleIndex + step + HUD_SCALES.length) % HUD_SCALES.length;
  applyHudScale();
  try {
    localStorage.setItem(HUD_SCALE_KEY, String(HUD_SCALES[hudScaleIndex]));
  } catch {
    // La preferencia solo dura esta sesión.
  }
}

function openPauseMenu() {
  if (pauseMenuOpen) return;
  pauseMenuOpen = true;
  game.keys = {};
  game.pointer.isDown = false;
  pauseMenuNote.hidden = true;
  pauseMenu.hidden = false;
  pauseMenuButtons[0].focus();
}

function closePauseMenu() {
  if (!pauseMenuOpen) return;
  pauseMenuOpen = false;
  pauseMenu.hidden = true;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  game.lastTime = performance.now();
}

function restartGame() {
  // Se borra el guardado y se impide que al cerrar la página se vuelva a escribir.
  savingDisabled = true;
  try {
    localStorage.removeItem(GAME_SAVE_KEY);
  } catch {
    // Si no se puede borrar, la recarga empezará igualmente con el estado guardado.
  }
  location.reload();
}

function exitGame() {
  saveGameState();
  window.close();
  // Los navegadores solo dejan cerrar pestañas abiertas por el propio juego.
  window.setTimeout(() => {
    pauseMenuNote.textContent = 'Partida guardada. Ya puedes cerrar esta pestaña.';
    pauseMenuNote.hidden = false;
  }, 200);
}

pauseMenu.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'hud') changeHudScale(1);
  else if (action === 'restart') {
    askConfirm('¿Reiniciar la partida desde cero? Se borrará todo tu progreso.', restartGame);
  } else if (action === 'exit') exitGame();
});
// El ratón y el teclado comparten la misma opción resaltada.
for (const button of pauseMenuButtons) {
  button.addEventListener('mouseenter', () => button.focus());
}
pauseMenu.addEventListener('pointerdown', (event) => event.stopPropagation());
pauseMenu.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
applyHudScale();

function frame(timestamp) {
  if (!accountReady) {
    requestAnimationFrame(frame);
    return;
  }
  const delta = Math.min((timestamp - game.lastTime) / 1000 || 0.016, 0.032);
  game.lastTime = timestamp;

  // Con el menú abierto el juego queda en pausa (solo se sigue dibujando).
  if (!pauseMenuOpen) {
    game.time += delta;
    update(delta);
    updateMultiplayerInterpolation(delta);
    updateSolarPanels(delta);
    if (game.scene === 'space') updateShootingStars(delta);
    updateSpaceHudOpacity(delta);
  }
  updateShipAbilityBar();
  draw();
  if (!inventoryPanel.hidden && currentInventoryView === 'mapa') {
    drawInventoryMap();
  }
  if (!inventoryPanel.hidden && currentInventoryView === 'misiones' && game.time >= missionPanelRefreshAt) {
    renderMissionPanel();
    missionPanelRefreshAt = game.time + 0.25;
  }
  if (!inventoryPanel.hidden && currentInventoryView === 'nave') {
    drawShipPreview();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (earthWandererDialogOpen) {
    event.preventDefault();
    if (!event.repeat && ['e', 'enter', 'escape'].includes(key)) {
      closeEarthWandererDialog();
    }
    return;
  }

  if (!chatComposer.hidden) {
    if (key === 'escape') {
      event.preventDefault();
      closeChatComposer();
    }
    return;
  }

  if (confirmState) {
    event.preventDefault();
    if (!event.repeat) {
      if (key === 'e') resolveConfirm(true);
      else if (key === 'escape') resolveConfirm(false);
    }
    return;
  }

  if (pauseMenuOpen) {
    if (key === 'escape') {
      event.preventDefault();
      if (!event.repeat) closePauseMenu();
    } else if (key === 'arrowup' || key === 'arrowdown') {
      event.preventDefault();
      const current = pauseMenuButtons.indexOf(document.activeElement);
      const step = key === 'arrowdown' ? 1 : -1;
      pauseMenuButtons[(current + step + pauseMenuButtons.length) % pauseMenuButtons.length].focus();
    } else if ((key === 'arrowleft' || key === 'arrowright') && document.activeElement === hudScaleButton) {
      event.preventDefault();
      changeHudScale(key === 'arrowright' ? 1 : -1);
    }
    return;
  }

  if (key === 'enter' && !event.repeat && inventoryPanel.hidden) {
    event.preventDefault();
    openChatComposer();
    return;
  }

  if (key === 'i' && !event.repeat) {
    event.preventDefault();
    toggleInventory();
    return;
  }

  if (key === 'escape' && !inventoryPanel.hidden) {
    event.preventDefault();
    toggleInventory(false);
    return;
  }

  if (key === 'escape') {
    event.preventDefault();
    if (!event.repeat) openPauseMenu();
    return;
  }

  if (!inventoryPanel.hidden) {
    const isTextEntry = event.target instanceof HTMLElement &&
      (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName));
    const inventoryShortcuts = { '1': 'objetos', '2': 'mapa', '3': 'nave', '4': 'radio', '5': 'misiones' };
    const shortcutView = inventoryShortcuts[key];
    if (!event.repeat && !isTextEntry && shortcutView) {
      event.preventDefault();
      showInventoryView(shortcutView);
      markInventoryAction();
      playInventorySelectSound();
    }
    return;
  }

  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }

  if (
    game.scene === 'surface' && !event.repeat && key === 'r' && getEquippedSurfaceGun() &&
    game.player.regolitoGunAmmo < REGOLITO_GUN_MAGAZINE_SIZE
  ) {
    event.preventDefault();
    reloadRegolitoGun();
    return;
  }

  // E actúa sobre el mineral o la moto que esté más cerca, antes que un objeto equipado.
  if (
    game.scene === 'surface' && !event.repeat && key === 'e' && game.surface && (() => {
      const pickupDistance = game.surface.pickups
        .filter((pickup) => pickup.count > 0)
        .reduce((closest, pickup) => Math.min(closest,
          getSurfaceDistance(pickup.x, pickup.y, game.surface.x, game.surface.y)), Infinity);
      const board = game.surface.hoverboard;
      const boardDistance = board?.deployed
        ? getSurfaceDistance(game.surface.x, game.surface.y, board.x, board.y)
        : Infinity;
      return Math.min(pickupDistance <= 56 ? pickupDistance : Infinity,
        boardDistance <= SURFACE_TILE * 4 ? boardDistance : Infinity) < Infinity;
    })()
  ) {
    event.preventDefault();
    interactWithSurface();
    return;
  }

  if (game.scene === 'surface' && !event.repeat) {
    const surfaceSlotIndex = SURFACE_ABILITY_KEYS.indexOf(key);
    if (surfaceSlotIndex >= 0 && game.player.surfaceEquipment[surfaceSlotIndex]) {
      event.preventDefault();
      selectSurfaceAbility(surfaceSlotIndex);
      return;
    }
  }

  if (key === '3' && !event.repeat && game.scene === 'space') {
    event.preventDefault();
    activatePropulsorAbility();
    return;
  }

  if (Object.hasOwn(MOVEMENT_KEY_DIRECTIONS, key) && !event.repeat) {
    const lastPressedAt = game.movementKeyLastDownAt[key];
    if (
      game.scene === 'surface' && game.surface?.turnUntil > game.time &&
      Number.isFinite(lastPressedAt) && game.time - lastPressedAt <= 0.35
    ) {
      game.surface.quickStepDirection = key;
      game.surface.quickStepAnimationFrame = game.surface.animationFrame;
      game.surface.turnUntil = game.time;
    }
    game.movementKeyLastDownAt[key] = game.time;
    game.movementKeyOrder[key] = ++game.movementKeySequence;
  }
  game.keys[key] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    game.pointer.moveTarget = null;
    game.pointer.followPlanet = null;
    game.pointer.isDown = false;
  }

  if (key === '2' && !event.repeat && game.scene === 'space') {
    event.preventDefault();
    activateCenterAbility();
  }

  if (key === 'e' && !event.repeat) {
    event.preventDefault();
    interactWithWorld();
  }

});

function playInventorySelectSound() {
  if (!inventorySelectSound) {
    inventorySelectSound = new Audio('sound/blipSelect.wav');
    inventorySelectSound.preload = 'auto';
  }
  const blip = inventorySelectSound.cloneNode();
  blip.volume = 0.4;
  blip.play().catch(() => {});
}

function markInventoryAction() {
  if (game.scene === 'surface' && !inventoryPanel.hidden) {
    playerInventoryClickUntil = Date.now() + 250;
    playerInventoryClickFlipped = Math.random() < 0.5;
  }
}

document.addEventListener('click', (event) => {
  if (!inventoryPanel.hidden &&
      (inventoryPanel.contains(event.target) || confirmOverlay.contains(event.target))) {
    markInventoryAction();
    playInventorySelectSound();
  }
}, true);
for (const eventName of ['input', 'change', 'submit']) {
  inventoryPanel.addEventListener(eventName, markInventoryAction, true);
}

marketPanel.addEventListener('click', (event) => {
  const button = event.target.closest('[data-market-view]');
  if (!button) {
    return;
  }
  currentMarketView = button.dataset.marketView;
  updateMarketPanel();
  saveGameState();
});

window.addEventListener('keyup', (event) => {
  game.keys[event.key.toLowerCase()] = false;
});

function getCanvasPointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - bounds.left) / bounds.width) * game.width, 0, game.width),
    y: clamp(((event.clientY - bounds.top) / bounds.height) * game.height, 0, game.height),
  };
}

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || !inventoryPanel.hidden) {
    return;
  }
  if (game.scene === 'surface') {
    if (!game.surface || selectedSurfaceAbilitySlot === null) return;
    const selectedItemId = game.player.surfaceEquipment[selectedSurfaceAbilitySlot];
    if (selectedItemId !== REGOLITO_GUN_ITEM_ID && selectedItemId !== COBALTO_KNIFE_ITEM_ID) return;
    event.preventDefault();
    const position = getCanvasPointerPosition(event);
    const facing = getSurfaceFacingTowardScreenPosition(position);
    game.surface.facing = facing;
    game.surface.autoDeparture = null;
    if (selectedItemId === REGOLITO_GUN_ITEM_ID) fireSurfaceGun(facing);
    else useCobaltoKnife(facing);
    return;
  }
  event.preventDefault();
  const position = getCanvasPointerPosition(event);
  if (game.scene === 'space') {
    const clickedHostile = getHostileAtScreenPosition(position);
    if (clickedHostile) {
      selectedHostileDrone = clickedHostile;
      game.pointer.isDown = false;
      game.pointer.clickTarget = null;
      markSpaceHudAction();
      return;
    }
    selectedHostileDrone = null;
  }
  game.pointer.isDown = true;
  game.pointer.downAt = performance.now();
  game.pointer.x = position.x;
  game.pointer.y = position.y;
  game.pointer.clickTarget = game.scene === 'surface'
    ? {
        x: wrapSurfaceCoordinate(game.surface.x + (position.x - game.width / 2) / playerZoom),
        y: wrapSurfaceCoordinate(game.surface.y + (position.y - game.height / 2) / playerZoom),
      }
    : {
        x: game.player.x + (position.x - game.width / 2) / (CAMERA_ZOOM * playerZoom),
        y: game.player.y + (position.y - game.height / 2) / (CAMERA_ZOOM * playerZoom),
      };
  game.pointer.moveTarget = null;
  if (game.scene === 'surface' && game.surface) game.surface.autoDeparture = null;
  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (!game.pointer.isDown) {
    return;
  }
  const position = getCanvasPointerPosition(event);
  game.pointer.x = position.x;
  game.pointer.y = position.y;
});

function finishPointerMovement(event) {
  if (!game.pointer.isDown) {
    return;
  }
  const wasHeld = performance.now() - game.pointer.downAt >= 180;
  game.pointer.isDown = false;
  if (!wasHeld && game.pointer.clickTarget) {
    game.pointer.moveTarget = game.pointer.clickTarget;
  }
  game.pointer.clickTarget = null;
  if (canvas.hasPointerCapture?.(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  saveGameState();
}

canvas.addEventListener('pointerup', finishPointerMovement);
canvas.addEventListener('pointercancel', finishPointerMovement);
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  if (game.scene === 'surface') {
    playerZoom = SURFACE_PLAYER_ZOOM;
    return;
  }
  const minZoom = game.scene === 'space' ? MIN_SPACE_PLAYER_ZOOM : MIN_PLAYER_ZOOM;
  playerZoom = clamp(
    playerZoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1),
    minZoom,
    MAX_PLAYER_ZOOM
  );
  saveGameState();
}, { passive: false });

inventoryOptions.forEach((option) => {
  option.addEventListener('click', () => {
    showInventoryView(option.dataset.command);
  });
});

radioAddForm.addEventListener('submit', addCustomRadioStation);
radioAudio.addEventListener('error', () => {
  radioStatus.textContent = 'No se pudo reproducir este stream. Puede estar fuera de línea o no ser compatible con el navegador.';
});

document.querySelectorAll('[data-emergency-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.emergencyAction;
    if (action === 'capsule') {
      askConfirm('¿Activar la segunda cápsula? Se perderán los objetos salvo los primeros 3 espacios.', activateFuelEscapeCapsule);
    } else {
      startEmergencyService(action === 'delivery' ? 'delivery' : 'tow');
    }
  });
});

cancelEmergencyServiceButton.addEventListener('click', () => {
  cancelEmergencyService('Solicitud cancelada. El pago no se reembolsa.');
});

let inventoryDrag = null;

window.addEventListener('drop', (event) => {
  draggedItemDroppedInsideInterface = event.target instanceof Element &&
    Boolean(event.target.closest('.inventory-panel'));
  if (draggedInventoryItem && !draggedItemDroppedInsideInterface) event.preventDefault();
}, true);

inventoryTitlebar.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || event.target.closest('button')) {
    return;
  }

  const shellBounds = document.querySelector('.game-shell').getBoundingClientRect();
  const panelBounds = inventoryPanel.getBoundingClientRect();
  inventoryPanel.style.left = `${panelBounds.left - shellBounds.left}px`;
  inventoryPanel.style.top = `${panelBounds.top - shellBounds.top}px`;
  inventoryPanel.style.right = 'auto';
  inventoryPanel.style.bottom = 'auto';
  inventoryDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - panelBounds.left,
    offsetY: event.clientY - panelBounds.top,
  };
  inventoryTitlebar.setPointerCapture(event.pointerId);
  event.preventDefault();
});

inventoryTitlebar.addEventListener('pointermove', (event) => {
  if (!inventoryDrag || event.pointerId !== inventoryDrag.pointerId) {
    return;
  }

  const shellBounds = document.querySelector('.game-shell').getBoundingClientRect();
  const panelBounds = inventoryPanel.getBoundingClientRect();
  const maxLeft = Math.max(0, shellBounds.width - panelBounds.width);
  const maxTop = Math.max(0, shellBounds.height - panelBounds.height);
  inventoryPanel.style.left = `${clamp(event.clientX - inventoryDrag.offsetX, 0, maxLeft)}px`;
  inventoryPanel.style.top = `${clamp(event.clientY - inventoryDrag.offsetY, 0, maxTop)}px`;
});

function finishInventoryDrag(event) {
  if (!inventoryDrag || event.pointerId !== inventoryDrag.pointerId) {
    return;
  }
  inventoryDrag = null;
  if (inventoryTitlebar.hasPointerCapture(event.pointerId)) {
    inventoryTitlebar.releasePointerCapture(event.pointerId);
  }
  persistInventoryWindowGeometry();
}

inventoryTitlebar.addEventListener('pointerup', finishInventoryDrag);
inventoryTitlebar.addEventListener('pointercancel', finishInventoryDrag);

window.addEventListener('resize', () => {
  if (inventoryPanel.hidden) {
    return;
  }
  const shellBounds = document.querySelector('.game-shell').getBoundingClientRect();
  const panelBounds = inventoryPanel.getBoundingClientRect();
  const maxLeft = Math.max(0, shellBounds.width - panelBounds.width);
  const maxTop = Math.max(0, shellBounds.height - panelBounds.height);
  inventoryPanel.style.left = `${clamp(panelBounds.left - shellBounds.left, 0, maxLeft)}px`;
  inventoryPanel.style.top = `${clamp(panelBounds.top - shellBounds.top, 0, maxTop)}px`;
  persistInventoryWindowGeometry();
});

[inventoryItemsGrid, shipPartsList, marketPanel, merchantItemsGrid, marketPlayerItemsGrid]
  .forEach((element) => element.addEventListener('scroll', saveGameStateIfDue, { passive: true }));

function persistInventoryWindowGeometry() {
  if (inventoryPanel.hidden) return;
  const previous = inventoryWindowGeometry ? { ...inventoryWindowGeometry } : null;
  const current = getInventoryWindowGeometry();
  if (
    current &&
    (!previous ||
      current.left !== previous.left ||
      current.top !== previous.top ||
      current.width !== previous.width ||
      current.height !== previous.height)
  ) {
    saveGameState();
  }
}

if (typeof ResizeObserver !== 'undefined') {
  const inventoryResizeObserver = new ResizeObserver(persistInventoryWindowGeometry);
  inventoryResizeObserver.observe(inventoryPanel);
}

inventoryMap.addEventListener('wheel', (event) => {
  event.preventDefault();
  inventoryMapZoom = clamp(
    inventoryMapZoom * (event.deltaY < 0 ? 1.2 : 1 / 1.2),
    MIN_INVENTORY_MAP_ZOOM,
    MAX_INVENTORY_MAP_ZOOM
  );
  saveGameState();
}, { passive: false });

function getInventoryMapPoint(event) {
  const bounds = inventoryMap.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * inventoryMap.width,
    y: ((event.clientY - bounds.top) / bounds.height) * inventoryMap.height,
  };
}

function findInventoryMapObject(event) {
  const pointer = getInventoryMapPoint(event);
  let closest = null;
  let closestDistance = Infinity;

  for (const object of drawInventoryMap()) {
    const distance = Math.hypot(pointer.x - object.screenX, pointer.y - object.screenY);
    if (distance <= Math.max(object.radius + 7, 9) && distance < closestDistance) {
      closest = object;
      closestDistance = distance;
    }
  }

  return closest;
}

inventoryMap.addEventListener('contextmenu', (event) => event.preventDefault());

inventoryMap.addEventListener('pointerdown', (event) => {
  if (event.button !== 2) return;
  event.preventDefault();
  const point = getInventoryMapPoint(event);
  inventoryMapDrag = { x: point.x, y: point.y };
  inventoryMap.style.cursor = 'grabbing';
  if (inventoryMap.setPointerCapture) inventoryMap.setPointerCapture(event.pointerId);
});

function endInventoryMapDrag(event) {
  if (!inventoryMapDrag) return;
  inventoryMapDrag = null;
  inventoryMap.style.cursor = '';
  if (event?.pointerId !== undefined && inventoryMap.hasPointerCapture?.(event.pointerId)) {
    inventoryMap.releasePointerCapture(event.pointerId);
  }
}
inventoryMap.addEventListener('pointerup', (event) => {
  if (event.button === 2) endInventoryMapDrag(event);
});
inventoryMap.addEventListener('pointercancel', endInventoryMapDrag);

inventoryMap.addEventListener('pointermove', (event) => {
  if (inventoryMapDrag) {
    const dragPoint = getInventoryMapPoint(event);
    const dragScale = inventoryMapZoom * 0.035;
    inventoryMapPan.x -= (dragPoint.x - inventoryMapDrag.x) / dragScale;
    inventoryMapPan.y -= (dragPoint.y - inventoryMapDrag.y) / dragScale;
    inventoryMapDrag = { x: dragPoint.x, y: dragPoint.y };
  }
  const object = findInventoryMapObject(event);
  const point = getInventoryMapPoint(event);
  const bounds = inventoryMap.getBoundingClientRect();
  const scale = inventoryMapZoom * 0.035;
  const mapCenter = getInventoryMapCenter();
  const worldX = mapCenter.x + (point.x - inventoryMap.width / 2) / scale;
  const worldY = mapCenter.y + (point.y - inventoryMap.height / 2) / scale;
  const chunkX = Math.floor(worldX / CHUNK_SIZE);
  const chunkY = Math.floor(worldY / CHUNK_SIZE);
  inventoryMapTooltip.textContent = object
    ? `${object.name} · (${chunkX}, ${chunkY})`
    : `(${chunkX}, ${chunkY})`;
  inventoryMapTooltip.hidden = false;
  inventoryMapTooltip.style.left = `${clamp(
    (point.x / inventoryMap.width) * bounds.width + 10,
    4,
    bounds.width - inventoryMapTooltip.offsetWidth - 4
  )}px`;
  inventoryMapTooltip.style.top = `${clamp(
    (point.y / inventoryMap.height) * bounds.height + 10,
    4,
    bounds.height - inventoryMapTooltip.offsetHeight - 4
  )}px`;
});

inventoryMap.addEventListener('pointerleave', () => {
  inventoryMapTooltip.hidden = true;
});

inventoryMap.addEventListener('click', (event) => {
  const object = findInventoryMapObject(event);
  const point = getInventoryMapPoint(event);
  toggleInventory(false);
  if (game.scene === 'surface') {
    const mapScale = inventoryMapZoom * 0.035;
    const navigation = object?.planet
      ? { planet: object.planet }
      : {
          target: object
            ? { x: object.x, y: object.y }
            : {
                x: getInventoryMapCenter().x + (point.x - inventoryMap.width / 2) / mapScale,
                y: getInventoryMapCenter().y + (point.y - inventoryMap.height / 2) / mapScale,
              },
        };
    if (navigation.planet === game.surface.planet) {
      setMessage(`Ya estás en ${navigation.planet.name}.`);
    } else {
      game.pointer.moveTarget = null;
      game.pointer.followPlanet = null;
      game.surface.quickStepDirection = null;
      game.surface.autoPathSearchRadiusTiles = 32;
      game.surface.autoPathRetryAt = 0;
      game.surface.autoPathAvoidTile = null;
      game.surface.autoDeparture = navigation;
      setMessage('Yendo a la nave...');
    }
    saveGameState();
    return;
  }
  if (object?.planet) {
    game.pointer.moveTarget = null;
    game.pointer.followPlanet = object.planet;
  } else if (object) {
    game.pointer.moveTarget = { x: object.x, y: object.y };
    game.pointer.followPlanet = null;
  } else {
    const mapCenter = getInventoryMapCenter();
    const scale = inventoryMapZoom * 0.035;
    game.pointer.moveTarget = {
      x: mapCenter.x + (point.x - inventoryMap.width / 2) / scale,
      y: mapCenter.y + (point.y - inventoryMap.height / 2) / scale,
    };
    game.pointer.followPlanet = null;
  }
  saveGameState();
});

closeInventoryBtn.addEventListener('click', () => toggleInventory(false));
window.addEventListener('pagehide', saveGameState);
window.addEventListener('beforeunload', saveGameState);

let gameStartedForAccount = false;
function startGameForAccount() {
  if (gameStartedForAccount || !GAME_SAVE_KEY) return;
  gameStartedForAccount = true;
  updateVisibleChunks();
  updatePlanetPositions();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  const savedGameState = loadGameState();
  const restoredGameState = Boolean(savedGameState && restoreGameState(savedGameState));
  let newGameHomeworld = null;
  if (!restoredGameState) {
    const homeworld = game.planets.find((planet) => planet.isHomeworld);
    if (homeworld) {
      newGameHomeworld = homeworld;
      game.selectedPlanet = homeworld;
      game.player.x = homeworld.x + homeworld.radius + 8;
      game.player.y = homeworld.y;
      updateVisibleChunks();
      updatePlanetPositions();
    }
  }
  if (!restoredGameState || savedGameState.fuelBonusGranted !== true) {
    addResourceToInventory('fuel', 10);
  }
  if (newGameHomeworld) enterPlanet(newGameHomeworld);
  game.selectedPlanet = game.scene === 'surface' ? game.surface.planet : getNearestPlanet();
  if (currentInventoryView === 'market' && (game.scene !== 'surface' || !isHomeworld(game.surface.planet))) {
    currentInventoryView = lastInventoryTab;
  }
  updateHud();
  applyInventoryWindowGeometry();
  if (!inventoryPanel.hidden) {
    applyInventoryScrollPositions();
    showInventoryView(currentInventoryView);
  }
  setMessage(game.scene === 'surface' ? game.surface.planet.name : 'Espacio');
  saveGameStateIfDue();
}

if (!multiplayerEndpoint) startGameForAccount();
requestAnimationFrame(frame);
