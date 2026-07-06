import measuredAnalysis from "./hdrAnalysis.generated.json";

export const DEFAULT_HDR_PROFILE_ID = "ferndale2";

const FALLBACK_ANALYSIS = {
  moonrise: {
    averageLuminance: 0.92,
    dominantColor: [0.73, 0.72, 0.79],
    dynamicRange: 6.2,
  },
  rosendal: {
    averageLuminance: 1.08,
    dominantColor: [0.75, 0.77, 0.7],
    dynamicRange: 7.1,
  },
  studio2: {
    averageLuminance: 0.86,
    dominantColor: [0.79, 0.79, 0.81],
    dynamicRange: 8.4,
  },
  ferndale: {
    averageLuminance: 0.7602,
    dominantColor: [0.8394, 0.898, 1],
    dynamicRange: 2.0209,
  },
  ferndale2: {
    // averageLuminance: 0.7742,
    averageLuminance: 0.7742,
    dominantColor: [1, 0.9651, 0.9434],
    // dynamicRange: 1.8895,
    dynamicRange: 8.4,
  },
};

function resolveAnalysis(profileId) {
  return measuredAnalysis[profileId] ?? FALLBACK_ANALYSIS[profileId];
}

export const HDR_PROFILE_MAP = {
  moonrise: {
    id: "moonrise",
    label: "Moonrise",
    assetFile: "moonrise.hdr",
    analysis: resolveAnalysis("moonrise"),
    lighting: {
      environmentIntensity: 0.2,
      hemisphereSkyColor: "#e7e7e7",
      hemisphereGroundColor: "#11224e",
      hemisphereIntensity: 18.8,
      ambientIntensity: 3.1,
      keySpot: {
        position: [5, 14, -38],
        angle: Math.PI / 2,
        penumbra: 8.2,
        intensity: 560,
        distance: 260,
        decay: 2,
      },
      fillSpot: {
        position: [-6, 18, -38],
        angle: Math.PI / 2,
        penumbra: 12.2,
        intensity: 160,
        distance: 260,
        decay: 2,
      },
      directionalIntensity: 0.65,
    },
  },
  rosendal: {
    id: "rosendal",
    label: "Rosendal",
    assetFile: "rosendal.hdr",
    analysis: resolveAnalysis("rosendal"),
    lighting: {
      environmentIntensity: 0.24,
      hemisphereSkyColor: "#f0efe3",
      hemisphereGroundColor: "#1a2441",
      hemisphereIntensity: 16,
      ambientIntensity: 2.7,
      keySpot: {
        position: [5, 14, -38],
        angle: Math.PI / 2,
        penumbra: 8.2,
        intensity: 520,
        distance: 260,
        decay: 2,
      },
      fillSpot: {
        position: [-6, 18, -38],
        angle: Math.PI / 2,
        penumbra: 12.2,
        intensity: 150,
        distance: 260,
        decay: 2,
      },
      directionalIntensity: 0.58,
    },
  },
  studio2: {
    id: "studio2",
    label: "Studio 2",
    assetFile: "studio2.hdr",
    analysis: resolveAnalysis("studio2"),
    lighting: {
      environmentIntensity: 0.22,
      hemisphereSkyColor: "#eceff4",
      hemisphereGroundColor: "#1a1e27",
      hemisphereIntensity: 19,
      ambientIntensity: 2.9,
      keySpot: {
        position: [5, 14, -38],
        angle: Math.PI / 2,
        penumbra: 8.2,
        intensity: 590,
        distance: 260,
        decay: 2,
      },
      fillSpot: {
        position: [-6, 18, -38],
        angle: Math.PI / 2,
        penumbra: 12.2,
        intensity: 180,
        distance: 260,
        decay: 2,
      },
      directionalIntensity: 0.7,
    },
  },

  ferndale: {
    id: "ferndale",
    label: "Ferndale",
    assetFile: "ferndale.hdr",
    analysis: resolveAnalysis("ferndale"),
    lighting: {
      environmentIntensity: 0.82,
      hemisphereSkyColor: "#dfe8f7",
      hemisphereGroundColor: "#1a2138",
      //   hemisphereIntensity: 17.2,
      hemisphereIntensity: 3.2,
      ambientIntensity: 2.8,
      keySpot: {
        position: [-1.8, 24, -38],
        // position: [28, 18, 40],
        angle: Math.PI / 1.8,
        penumbra: 9.2,
        intensity: 640,
        distance: 260,
        decay: 2,
      },
      fillSpot: {
        position: [-30, 20, -60],
        angle: Math.PI / 2,
        penumbra: 8.102,
        intensity: 965,
        distance: 260,
        decay: 2,
      },
      directionalIntensity: 1.2,
    },
  },
  ferndale2: {
    id: "ferndale2",
    label: "Ferndale 2",
    assetFile: "ferndale2.hdr",
    analysis: resolveAnalysis("ferndale2"),
    lighting: {
      environmentIntensity: 0.18,
      hemisphereSkyColor: "#ffffff",
      hemisphereGroundColor: "#ffffff",
      hemisphereIntensity: 10.2,
      ambientIntensity: 2.8,

      keySpot: {
        position: [-6, 25, -90],
        // position: [0, 45, -80],
        angle: Math.PI / 4,
        penumbra: 0.1,
        intensity: 1140,
        distance: 260,
        decay: 2,
      },
      fillSpot: {
        // position: [26, 42, -100],
        position: [36, -3, 30],
        angle: Math.PI / 4,
        penumbra: 1.1222,
        intensity: 21000,
        distance: 360,
        decay: 2,
      },
      directionalIntensity: 3.2,
    },
  },
};

export function getHdrProfile(profileId = DEFAULT_HDR_PROFILE_ID) {
  return HDR_PROFILE_MAP[profileId] ?? HDR_PROFILE_MAP[DEFAULT_HDR_PROFILE_ID];
}
