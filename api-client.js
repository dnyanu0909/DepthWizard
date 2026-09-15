/**
 * Aero3D Backend Service Adapter (Member 5)
 * Handles uploading files to Member 3's FastAPI server with automatic Mock fallback.
 */

const API_CONFIG = {
  USE_MOCK: true, // Flip to false when Member 3's backend is running
  BACKEND_URL: 'http://localhost:8000/api/process'
};

const MOCK_DATA = {
  status: "success",
  data: {
    original_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    heightmap_url: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg",
    min_alt: 1100,
    peak_alt: 2840,
    elevation_gain: 1740,
    coords_lat: "32° 14' 20.4\" N",
    coords_lon: "77° 11' 18.2\" E"
  }
};

class AeroApiClient {
  static async uploadImage(file) {
    if (API_CONFIG.USE_MOCK) {
      console.log("[AeroAPI] Generating local preview for:", file.name);

      // Create a local blob URL for instant loading without CORS issues
      const localFileUrl = URL.createObjectURL(file);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: "success",
            data: {
              original_url: localFileUrl,
              heightmap_url: localFileUrl, // Uses the real image luminance as elevation
              min_alt: 1240,
              peak_alt: 2680,
              elevation_gain: 1440,
              coords_lat: "35° 50' 35\" N",
              coords_lon: "120° 16' 47\" E"
            }
          });
        }, 300);
      });
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_CONFIG.BACKEND_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  }
}

window.AeroApiClient = AeroApiClient;