import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  initialLocation?: Location;
  readOnly?: boolean;
  onLocationSelect?: (loc: Location) => void;
}

export default function LeafletMap({ initialLocation, readOnly = false, onLocationSelect }: LeafletMapProps) {
  const webviewRef = useRef<WebView>(null);

  const defaultLat = initialLocation?.lat ?? -0.2298500;
  const defaultLng = initialLocation?.lng ?? -78.5249500;

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

        var marker = L.marker([${defaultLat}, ${defaultLng}]).addTo(map);

        var readOnly = ${readOnly};

        if (!readOnly) {
          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
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
