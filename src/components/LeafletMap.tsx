import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  dishLocation?: Location;
  userLocation?: Location;
  readOnly?: boolean;
  onLocationSelect?: (loc: Location) => void;
}

export default function LeafletMap({ dishLocation, userLocation, readOnly = false, onLocationSelect }: LeafletMapProps) {
  const webviewRef = useRef<WebView>(null);

  const defaultLat = dishLocation?.lat ?? -0.2298500;
  const defaultLng = dishLocation?.lng ?? -78.5249500;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100vw; }
        .distance-tooltip {
          background-color: white;
          border: 2px solid #1A3A5C;
          border-radius: 8px;
          font-weight: bold;
          color: #1A3A5C;
          padding: 4px 8px;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${defaultLat}, ${defaultLng}], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var hasDish = ${dishLocation ? 'true' : 'false'};
        var hasUser = ${userLocation ? 'true' : 'false'};
        var dishLat = ${dishLocation?.lat ?? 'null'};
        var dishLng = ${dishLocation?.lng ?? 'null'};
        var userLat = ${userLocation?.lat ?? 'null'};
        var userLng = ${userLocation?.lng ?? 'null'};

        var dishMarker;
        if (hasDish) {
            dishMarker = L.marker([dishLat, dishLng]).addTo(map);
        } else {
            dishMarker = L.marker([${defaultLat}, ${defaultLng}]).addTo(map);
        }

        if (hasUser && hasDish) {
            var userLatLng = L.latLng(userLat, userLng);
            var dishLatLng = L.latLng(dishLat, dishLng);

            // user marker
            var userMarker = L.circleMarker(userLatLng, {
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 1,
                radius: 8
            }).addTo(map);
            userMarker.bindPopup("<b>Tú estás aquí</b>").openPopup();

            // route polyline
            var polyline = L.polyline([userLatLng, dishLatLng], {color: 'red', weight: 4}).addTo(map);

            // distance calculation
            var distanceKm = (userLatLng.distanceTo(dishLatLng) / 1000).toFixed(2);
            polyline.bindTooltip(distanceKm + " km", {permanent: true, direction: 'center', className: 'distance-tooltip'}).openTooltip();

            // adjust bounds
            map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
        }

        var readOnly = ${readOnly};

        if (!readOnly) {
          map.on('click', function(e) {
            dishMarker.setLatLng(e.latlng);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={(event) => {
          if (onLocationSelect) {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              onLocationSelect(data);
            } catch (e) {
              console.error(e);
            }
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
