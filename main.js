import './style.css';
import 'ol/ol.css';

import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Icon, Stroke, Fill } from 'ol/style';
import Overlay from 'ol/Overlay';

// STYLE MODERN UNTUK POLYGON RIAU

const riauStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 1.5
  }),
  fill: new Fill({
    color: 'rgba(51, 102, 255, 0.15)'
  })
});

// VECTOR LAYER: POLYGON RIAU
const riau = new VectorLayer({
  source: new VectorSource({
    url: 'data/polygon_riau.json',
    format: new GeoJSON()
  }),
  style: riauStyle
});


// LAYER RTH (ICON MODERN)

const rthLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/data_rth.json',
    format: new GeoJSON()
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'icon/rth.png',
      scale: 0.13
    })
  })
});


// POPUP GLASSMORPHISM
const popupContainer = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const popupCloser = document.getElementById('popup-closer');

const popup = new Overlay({
  element: popupContainer,
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -20]
});


// MAP INIT

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    riau, 
    rthLayer
  ],
  overlays: [popup],
  view: new View({
    center: fromLonLat([101.4383, 0.5104]),
    zoom: 9
  })
});


// POPUP KETIKA DIKLIK
map.on('singleclick', (evt) => {
  const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

  if (!feature) {
    popup.setPosition(undefined);
    return;
  }

  const name = feature.get('nama') || feature.get('Nama_Pemetaan') || '-';
  const alamat = feature.get('alamat') || '-';
  const tanggal = feature.get('tanggal') || '-';

  popupContent.innerHTML = `
    <div style="padding:5px;">
      <h5 style="margin:0; font-weight:700;">${name}</h5>
      <p style="margin:4px 0;">📍 <strong>${alamat}</strong></p>
      <p style="margin:4px 0;">📅 ${tanggal}</p>
    </div>
  `;

  popup.setPosition(evt.coordinate);
});

popupCloser.onclick = () => {
  popup.setPosition(undefined);
  return false;
};

// HIGHLIGHT HOVER (GLOW EFFECT)
const highlightLayer = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.9)',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.1)'
    })
  })
});

let highlighted = null;

map.on('pointermove', (evt) => {
  if (evt.dragging) return;

  const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
  const info = document.getElementById('info');

  if (feature !== highlighted) {
    if (highlighted) {
      highlightLayer.getSource().removeFeature(highlighted);
    }
    if (feature) {
      highlightLayer.getSource().addFeature(feature);
      info.innerHTML = feature.get('nama') || feature.get('DESA') || 'Fitur';
    } else {
      info.innerHTML = '-';
    }
    highlighted = feature;
  }
});


// CONTROL LAYER CHECKBOX

document.getElementById('polygon').addEventListener('change', (e) => {
  riau.setVisible(e.target.checked);
});

document.getElementById('rth').addEventListener('change', (e) => {
  rthLayer.setVisible(e.target.checked);
});
