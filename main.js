import './style.css';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Icon, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';

// Layer polygon Riau
const riau = new VectorLayer({
  background : '#1a2b39',
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygon_riau.json'
  }),
  style: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'OBJECTID'],
      1,
      '#ffff33',
      1283,
      '#3358ff',
    ],
  },
});

// Layer banjir
const banjir = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/banjir.json'
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'icon/flood.png',
      scale: 0.08
    })
  })
});

// Layer RTH
const rthLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/data_rth.json'
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'icon/rth.png',
      scale: 0.1
    })
  })
});

// Popup HTML elements (dipakai oleh popup kedua)
const container = document.getElementById('popup');
const content_element = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

// MAP INIT (tanpa overlay pertama)
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
    riau,
    banjir,
    rthLayer
  ],
  // overlays: []  // tidak perlu mendefinisikan overlays di sini
  view: new View({
    center: fromLonLat([101.438309, 0.510440]),
    zoom: 7
  })
});

// POPUP 
const popup = new Overlay({
  element: container,
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -15]
});

map.addOverlay(popup);

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feat) {
    return feat;
  });

  if (feature) {
    // ambil koordinat geometry (untuk point atau centroid dari geometry)
    const geometry = feature.getGeometry();
    let coordinates;

    // beberapa geometry (polygon) punya koordinat array; untuk popup sering ingin centroid
    if (geometry.getType && geometry.getType() === 'Point') {
      coordinates = geometry.getCoordinates();
    } else if (geometry.getType && geometry.getType() === 'Polygon') {
      // gunakan centroid sederhana (ambil koordinat pertama dari linear ring)
      const coords = geometry.getCoordinates();
      // coords[0] adalah outer ring, ambil titik tengah dari bounding box sebagai pendekatan
      const flat = coords[0];
      const sum = flat.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0,0]);
      coordinates = [sum[0] / flat.length, sum[1] / flat.length];
    } else {
      // fallback: ambil koordinat event klik
      coordinates = evt.coordinate;
    }

    let content = '<h3>Informasi Fitur</h3>';
    content += '<p>Nama Daerah: <strong>' + (feature.get('Nama_Pemetaan') || '-') + '</strong></p>';
    content += '<p>Jumlah Korban: <strong>' + (feature.get('Jumlah_Korban') || '-') + '</strong></p>';

    content_element.innerHTML = content;
    popup.setPosition(coordinates);
  } else {
    popup.setPosition(undefined);
  }
});

// HIGHLIGHT POLYGON 
const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.7)',
      width: 2
    })
  })
});

let highlight;
const highlightFeature = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }
};

const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feat) {
    return feat;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.get('DESA') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }
};

// Pointer Hover Event
map.on('pointermove', function (evt) {
  if (evt.dragging) return;
  highlightFeature(evt.pixel);
  displayFeatureInfo(evt.pixel);
});

// CLOSE POPUP BUTTON (menggunakan popup yang aktif)
closer.onclick = function () {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

// Checkbox Layer Control
const polygonLayerCheckbox = document.getElementById('polygon');
const pointLayerCheckbox = document.getElementById('point');
const rthLayerCheckbox = document.getElementById('rth');

polygonLayerCheckbox.addEventListener('change', function () {
  riau.setVisible(polygonLayerCheckbox.checked);
});

pointLayerCheckbox.addEventListener('change', function () {
  banjir.setVisible(pointLayerCheckbox.checked);
});

rthLayerCheckbox.addEventListener('change', function () {
  rthLayer.setVisible(rthLayerCheckbox.checked);
});
