<Canvas
shadows
// camera={{ position: [0.1, 12, 25], fov: 18 }}
camera={{ position: [-1.5, 12, 25], fov: 18 }}
gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            // toneMapping: THREE.AgXToneMapping,
            // toneMapping: THREE.CineonToneMapping,
            toneMappingExposure: 0.48,
          }}
style={{
            background: "#060a1a",
            borderRadius: "8px",
            display: "block",
            height: "100%",
            width: "100%",
          }} >
<Suspense fallback={null}>
<Scene
topGroupOpen={topGroupOpen}
topGroupRotation={topGroupRotation}
onNewsTextClick={() => setShowTextPopup(true)}
/>
</Suspense>
</Canvas>

        -------------------

          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

<Canvas
shadows
// camera={{ position: [0.1, 12, 25], fov: 18 }}
camera={{
            position: isMobile ? [-1.5, 15, 38] : [-1.5, 12, 25],
            fov: isMobile ? 22 : 18,
          }}
gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            // toneMapping: THREE.AgXToneMapping,
            // toneMapping: THREE.CineonToneMapping,
            toneMappingExposure: 0.48,
          }}
style={{
            background: "#060a1a",
            borderRadius: "8px",
            display: "block",
            height: "100%",
            width: "100%",
          }} >
<Suspense fallback={null}>
<Scene
topGroupOpen={topGroupOpen}
topGroupRotation={topGroupRotation}
onNewsTextClick={() => setShowTextPopup(true)}
/>
</Suspense>
</Canvas>
