import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JUBELAN_KML_FEATURES, JUBELAN_CENTER, JUBELAN_DEFAULT_ZOOM } from '../data/jubelanKmlData';
import { Layers, RotateCcw } from 'lucide-react';
import './InteractiveKmlMap.css';

interface InteractiveKmlMapProps {
  selectedDusunId: string;
  onSelectDusun: (dusunId: string) => void;
  theme?: 'light' | 'dark';
}

export type MapLayerType = 'satellite_hybrid' | 'satellite_pure';

export const InteractiveKmlMap: React.FC<InteractiveKmlMapProps> = ({
  selectedDusunId,
  onSelectDusun,
  theme = 'light'
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<{ [id: string]: L.Polygon }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  // Track current selectedDusunId in a ref so event handlers always see fresh value
  const selectedDusunRef = useRef<string>(selectedDusunId);

  // Default map layer mode is Satelit Hybrid
  const [mapLayer, setMapLayer] = useState<MapLayerType>('satellite_hybrid');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Keep ref in sync with prop
  useEffect(() => {
    selectedDusunRef.current = selectedDusunId;
  }, [selectedDusunId]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: JUBELAN_CENTER,
        zoom: JUBELAN_DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: false, // Prevent page hijacking when scrolling on mobile
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Attribution
      L.control.attribution({
        position: 'bottomright',
        prefix: false
      }).addAttribution('&copy; Google Satellite &bull; OpenStreetMap').addTo(map);

      // Separate boundary feature from dusun features to ensure proper stacking
      const boundaryFeature = JUBELAN_KML_FEATURES.find(f => f.isBoundary);
      const dusunFeatures = JUBELAN_KML_FEATURES.filter(f => !f.isBoundary);

      // 1. Add village outer boundary FIRST at the bottom layer (non-interactive so it never blocks clicks)
      if (boundaryFeature) {
        const boundaryLayer = L.polygon(boundaryFeature.coordinates, {
          color: '#ffffff',
          weight: 3,
          dashArray: '6, 8',
          fillColor: '#22c55e',
          fillOpacity: 0.06,
          interactive: false,
          className: 'desa-boundary-polygon'
        }).addTo(map);

        polygonLayersRef.current[boundaryFeature.id] = boundaryLayer;
      }

      // 2. Add each Dusun polygon (interactive, clickable, hoverable, always in front)
      dusunFeatures.forEach(feature => {
        const polygon = L.polygon(feature.coordinates, {
          color: feature.color,
          weight: 2.5,
          fillColor: feature.color,
          fillOpacity: 0.38,
          interactive: true,
          className: 'dusun-satellite-polygon'
        }).addTo(map);

        // Tooltip on hover
        polygon.bindTooltip(`
          <div class="kml-tooltip-content">
            <span class="tooltip-color-dot" style="background-color: ${feature.color}"></span>
            <strong>${feature.name}</strong>
          </div>
        `, {
          permanent: false,
          direction: 'center',
          className: 'satellite-dusun-tooltip'
        });

        // Click handler to select dusun
        polygon.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectDusun(feature.id);
        });

        // Mouse hover effects
        polygon.on('mouseover', () => {
          polygon.setStyle({
            weight: 4.5,
            fillOpacity: 0.72
          });
        });

        polygon.on('mouseout', () => {
          const curSelected = selectedDusunRef.current;
          const isSelected = curSelected === feature.id || 
            (curSelected.includes('watugandu') && feature.id.includes('watugandu')) ||
            (curSelected.includes('logung') && feature.id.includes('logung')) ||
            (curSelected.includes('jubelan') && feature.id.includes('jubelan') && !curSelected.includes('desa')) ||
            (curSelected.includes('suruhan') && feature.id.includes('suruhan'));

          polygon.setStyle({
            weight: isSelected ? 4.5 : 2.5,
            color: isSelected ? '#ffffff' : feature.color,
            fillOpacity: isSelected ? 0.65 : 0.38
          });
        });

        polygonLayersRef.current[feature.id] = polygon;
      });

      // Ensure all dusun polygons stay on top of boundary
      dusunFeatures.forEach(f => {
        const p = polygonLayersRef.current[f.id];
        if (p) p.bringToFront();
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when mapLayer or theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = '';
    let maxZoom = 20;

    if (mapLayer === 'satellite_hybrid') {
      // High-resolution Google Satellite with roads and settlement labels
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      maxZoom = 20;
    } else if (mapLayer === 'satellite_pure') {
      // Pure ESRI World Imagery / Google Satellite pure
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
    }

    const tiles = L.tileLayer(tileUrl, {
      maxZoom,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    tiles.addTo(map);
    tileLayerRef.current = tiles;

    // Keep polygon layers in front of tiles, with dusuns on top of boundary
    const boundary = polygonLayersRef.current['desa-jubelan'];
    if (boundary) boundary.bringToBack();
    Object.entries(polygonLayersRef.current).forEach(([id, layer]) => {
      if (id !== 'desa-jubelan') layer.bringToFront();
    });
  }, [mapLayer, theme]);

  // Update active polygon highlight and camera focus
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isDesaTotal = selectedDusunId === 'desa-jubelan' || selectedDusunId === 'desa-jubelan-boundary';

    if (isDesaTotal) {
      // Highlight whole village boundary
      const boundaryLayer = polygonLayersRef.current['desa-jubelan'];
      if (boundaryLayer) {
        boundaryLayer.setStyle({
          color: '#ffffff',
          weight: 4.5,
          dashArray: '4, 8',
          fillColor: '#22c55e',
          fillOpacity: 0.12
        });
        boundaryLayer.bringToBack();
      }

      // Reset individual dusun polygons to standard opacity and ensure they stay on top
      JUBELAN_KML_FEATURES.forEach(feature => {
        if (!feature.isBoundary) {
          const l = polygonLayersRef.current[feature.id];
          if (l) {
            l.setStyle({
              color: feature.color,
              weight: 2.5,
              fillColor: feature.color,
              fillOpacity: 0.38
            });
            l.bringToFront();
          }
        }
      });

      // Fly to village center
      map.flyTo(JUBELAN_CENTER, JUBELAN_DEFAULT_ZOOM, {
        duration: 0.8
      });
      return;
    }

    // Reset boundary layer if specific dusun is active
    const boundaryLayer = polygonLayersRef.current['desa-jubelan'];
    if (boundaryLayer) {
      boundaryLayer.setStyle({
        color: '#ffffff',
        weight: 2.5,
        dashArray: '6, 8',
        fillColor: 'transparent',
        fillOpacity: 0
      });
    }

    // Highlight active Dusun
    JUBELAN_KML_FEATURES.forEach(feature => {
      const layer = polygonLayersRef.current[feature.id];
      if (!layer || feature.isBoundary) return;

      const isSelected = selectedDusunId === feature.id || 
        (selectedDusunId.includes('watugandu') && feature.id.includes('watugandu')) ||
        (selectedDusunId.includes('logung') && feature.id.includes('logung')) ||
        (selectedDusunId.includes('jubelan') && feature.id.includes('jubelan') && !selectedDusunId.includes('desa')) ||
        (selectedDusunId.includes('suruhan') && feature.id.includes('suruhan'));

      if (isSelected) {
        layer.setStyle({
          color: '#ffffff',
          weight: 4.5,
          fillColor: feature.color,
          fillOpacity: 0.65
        });
        layer.bringToFront();

        // Smooth flight animation to active polygon
        const bounds = layer.getBounds();
        map.flyToBounds(bounds, {
          padding: [40, 40],
          duration: 0.8,
          maxZoom: 16
        });
      } else {
        layer.setStyle({
          color: feature.color,
          weight: 2.5,
          fillColor: feature.color,
          fillOpacity: 0.35
        });
      }
    });
  }, [selectedDusunId]);

  const handleResetView = () => {
    onSelectDusun('desa-jubelan');
  };

  return (
    <div className="interactive-kml-map-wrapper">
      {/* Top Toolbar Overlay */}
      <div className="map-toolbar-overlay">
        <div className="map-tag-indicator satellite-tag">
          <span className="dot-live"></span>
          <span>
            {mapLayer === 'satellite_hybrid' && '🛰️ Satelit Hybrid'}
            {mapLayer === 'satellite_pure' && '🌍 Satelit Alami'}
          </span>
        </div>

        <div className="map-action-group">
          {/* Layer Mode Switcher Dropdown */}
          <div className="layer-switcher-wrap">
            <button 
              className="btn-map-control"
              onClick={() => setShowLayerMenu(prev => !prev)}
              title="Ganti Tipe Layer Peta"
            >
              <Layers size={14} />
              <span>Layer</span>
            </button>

            {showLayerMenu && (
              <div className="layer-menu-dropdown">
                <button 
                  className={`layer-option-btn ${mapLayer === 'satellite_hybrid' ? 'active' : ''}`}
                  onClick={() => {
                    setMapLayer('satellite_hybrid');
                    setShowLayerMenu(false);
                  }}
                >
                  <span className="layer-icon">🛰️</span>
                  <div>
                    <div className="layer-title">Satelit Hybrid</div>
                    <div className="layer-sub">Foto udara + nama jalan/dusun</div>
                  </div>
                </button>

                <button 
                  className={`layer-option-btn ${mapLayer === 'satellite_pure' ? 'active' : ''}`}
                  onClick={() => {
                    setMapLayer('satellite_pure');
                    setShowLayerMenu(false);
                  }}
                >
                  <span className="layer-icon">🌍</span>
                  <div>
                    <div className="layer-title">Satelit Murni</div>
                    <div className="layer-sub">Citra satelit tanpa label</div>
                  </div>
                </button>


              </div>
            )}
          </div>

          {/* Reset Zoom Button */}
          <button 
            className="btn-map-control"
            onClick={handleResetView}
            title="Tampilkan Seluruh Wilayah Desa Jubelan"
          >
            <RotateCcw size={14} />
            <span>Desa Total</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* Legend inside map */}
      <div className="map-kml-legend">
        <div className="legend-title">Pilih Wilayah:</div>
        <div className="legend-pills">
          {/* Desa Jubelan Total Button */}
          <button
            className={`legend-pill-btn ${(selectedDusunId === 'desa-jubelan' || selectedDusunId === 'desa-jubelan-boundary') ? 'active' : ''}`}
            onClick={() => onSelectDusun('desa-jubelan')}
            style={{
              borderColor: (selectedDusunId === 'desa-jubelan' || selectedDusunId === 'desa-jubelan-boundary') ? '#ffffff' : '#4ade80'
            }}
          >
            <span className="pill-color-indicator" style={{ backgroundColor: '#4ade80' }}></span>
            <span>Desa Jubelan</span>
          </button>

          {/* Individual Dusun Buttons */}
          {JUBELAN_KML_FEATURES.filter(f => !f.isBoundary).map(f => {
            const isSelected = (selectedDusunId === f.id) ||
              (selectedDusunId.includes('watugandu') && f.id.includes('watugandu')) ||
              (selectedDusunId.includes('logung') && f.id.includes('logung')) ||
              (selectedDusunId.includes('jubelan') && f.id.includes('jubelan') && !selectedDusunId.includes('desa')) ||
              (selectedDusunId.includes('suruhan') && f.id.includes('suruhan'));

            return (
              <button
                key={f.id}
                className={`legend-pill-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectDusun(f.id)}
                style={{
                  borderColor: isSelected ? '#ffffff' : f.color
                }}
              >
                <span className="pill-color-indicator" style={{ backgroundColor: f.color }}></span>
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
