"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DoubleSide,
  Group,
  SRGBColorSpace,
  type Side,
  Texture,
  TextureLoader,
} from "three";
import styles from "./ebook-book-preview.module.css";

const EBOOK_COVER_URL =
  "https://res.cloudinary.com/db7i9febj/image/upload/v1781964036/bookCov001_wkq1dz.png";
const EBOOK_PAGE_URLS = [
  "https://res.cloudinary.com/db7i9febj/image/upload/v1783653769/p1_m5pbaq.png",
  "https://res.cloudinary.com/db7i9febj/image/upload/v1783653772/p2_sgegsn.png",
  "https://res.cloudinary.com/db7i9febj/image/upload/v1783653772/p3_pqpohj.png",
  "https://res.cloudinary.com/db7i9febj/image/upload/v1783653767/p4_h106hm.png",
  "https://res.cloudinary.com/db7i9febj/image/upload/v1783653771/p5_dkiano.png",
];
const PAGE_COUNT = 9;
const BOOK_WIDTH = 1.4;
const BOOK_HEIGHT = 2.0;
const COVER_THICKNESS = 0.025;
const PAGE_THICKNESS = 0.002;
const SPINE_WIDTH = 0.1;
const SPINE_DEPTH = 0.1;
const PAGE_WIDTH = BOOK_WIDTH * 1.1;
const PAGE_HEIGHT = BOOK_HEIGHT * 1.01;
const PAGE_GUTTER = 0.012;
const SURFACE_TEXTURE_OFFSET = 0.003;

const FRONT_COVER_ROTATION = 0.1;
const BACK_COVER_ROTATION = 0.18;
const FIRST_TURNED_PAGE_ROTATION = -2.88;
const LAST_UNTURNED_PAGE_ROTATION = -0.08;

const bookTextureSources = {
  cover: {
    front: EBOOK_COVER_URL,
    back: "",
    spine: "",
  },
  pages: Array.from(
    { length: PAGE_COUNT },
    (_, pageIndex) => EBOOK_PAGE_URLS[pageIndex % EBOOK_PAGE_URLS.length],
  ),
};

type CoverTextureSources = {
  front?: string;
  back?: string;
  spine?: string;
};

type BookModelProps = {
  coverTextures?: CoverTextureSources;
  pageTextures?: string[];
};

export type BookModelApi = {
  setPageTexture: (index: number, src: string) => void;
  setCoverTexture: (part: keyof CoverTextureSources, src: string) => void;
  turnPage: (index: number, direction?: "forward" | "backward") => void;
};

type MaterialSlotProps = {
  src?: string;
  color: string;
  roughness?: number;
  metalness?: number;
  side?: Side;
};

function TexturedMaterial({
  src,
  color,
  roughness = 0.72,
  metalness = 0.02,
  side = DoubleSide,
}: MaterialSlotProps) {
  if (!src) {
    return (
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        side={side}
      />
    );
  }

  return (
    <LoadedTextureMaterial
      src={src}
      color={color}
      roughness={roughness}
      metalness={metalness}
      side={side}
    />
  );
}

function LoadedTextureMaterial({
  src,
  color,
  roughness = 0.72,
  metalness = 0.02,
  side = DoubleSide,
}: MaterialSlotProps & { src: string }) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loader = new TextureLoader();

    loader.load(
      src,
      (loadedTexture) => {
        if (!isMounted) return;
        loadedTexture.colorSpace = SRGBColorSpace;
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (!isMounted) return;
        console.warn("Ebook cover texture failed to load:", src);
        // Fail gracefully: keep rendering without a map instead of crashing page.
        setTexture(null);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <meshStandardMaterial
      map={texture ?? undefined}
      color={color}
      roughness={roughness}
      metalness={metalness}
      side={side}
    />
  );
}

function SurfaceTextureMaterial({ src, side = DoubleSide }: MaterialSlotProps) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    if (!src) {
      setTexture(null);
      return;
    }

    let isMounted = true;
    const loader = new TextureLoader();

    loader.load(
      src,
      (loadedTexture) => {
        if (!isMounted) return;
        loadedTexture.colorSpace = SRGBColorSpace;
        loadedTexture.anisotropy = 8;
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (!isMounted) return;
        console.warn("Ebook surface texture failed to load:", src);
        setTexture(null);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!texture) {
    return null;
  }

  return (
    <meshBasicMaterial
      map={texture}
      polygonOffset
      polygonOffsetFactor={-2}
      polygonOffsetUnits={-2}
      side={side}
      toneMapped={false}
    />
  );
}

function PageTextureOverlays({ src }: { src?: string }) {
  if (!src) return null;

  return (
    <>
      <mesh
        name="page-texture-front-overlay"
        position={[PAGE_WIDTH / 2, 0, SURFACE_TEXTURE_OFFSET]}
        renderOrder={10}
      >
        <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT, 1, 1]} />
        <SurfaceTextureMaterial src={src} side={DoubleSide} color="#ffffff" />
      </mesh>
      <mesh
        name="page-texture-back-overlay"
        position={[PAGE_WIDTH / 2, 0, -SURFACE_TEXTURE_OFFSET]}
        renderOrder={10}
      >
        <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT, 1, 1]} />
        <SurfaceTextureMaterial src={src} side={DoubleSide} color="#ffffff" />
      </mesh>
    </>
  );
}

function CoverTextureOverlays({ src }: { src?: string }) {
  if (!src) return null;

  return (
    <mesh
      name="cover-texture-front-overlay"
      position={[0, 0, -COVER_THICKNESS / 2 - SURFACE_TEXTURE_OFFSET]}
      rotation={[0, Math.PI, 0]}
      renderOrder={10}
    >
      <planeGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, 1, 1]} />
      <SurfaceTextureMaterial src={src} side={DoubleSide} color="#ffffff" />
    </mesh>
  );
}

const BookModel = forwardRef<BookModelApi, BookModelProps>(function BookModel(
  {
    coverTextures = bookTextureSources.cover,
    pageTextures = bookTextureSources.pages,
  },
  ref,
) {
  const frontCoverRef = useRef<Group>(null);
  const backCoverRef = useRef<Group>(null);
  const pageRefs = useRef<Array<Group | null>>([]);
  const [coverTextureState, setCoverTextureState] =
    useState<CoverTextureSources>(coverTextures);
  const [pageTextureState, setPageTextureState] = useState<string[]>(() =>
    Array.from({ length: PAGE_COUNT }, (_, index) => pageTextures[index] ?? ""),
  );
  const [turnedPages, setTurnedPages] = useState<boolean[]>(() =>
    Array.from({ length: PAGE_COUNT }, () => false),
  );

  useImperativeHandle(ref, () => ({
    setPageTexture(index, src) {
      if (index < 0 || index >= PAGE_COUNT) return;

      setPageTextureState((current) => {
        const next = [...current];
        next[index] = src;
        return next;
      });
    },
    setCoverTexture(part, src) {
      setCoverTextureState((current) => ({ ...current, [part]: src }));
    },
    turnPage(index, direction = "forward") {
      if (index < 0 || index >= PAGE_COUNT) return;

      setTurnedPages((current) => {
        const next = [...current];
        next[index] = direction === "forward";
        return next;
      });
    },
  }));

  const pages = useMemo(
    () => Array.from({ length: PAGE_COUNT }, (_, index) => index),
    [],
  );

  const pageRotations = useMemo(
    () =>
      pages.map((pageIndex) => {
        const progress = pageIndex / Math.max(PAGE_COUNT - 1, 1);
        return (
          FIRST_TURNED_PAGE_ROTATION +
          (LAST_UNTURNED_PAGE_ROTATION - FIRST_TURNED_PAGE_ROTATION) * progress
        );
      }),
    [pages],
  );

  return (
    <group name="Book group" rotation={[0.12, -0.42, 0]} scale={1.45}>
      <group name="spine-anchor" position={[0, 0, 0]}>
        <mesh name="spine" position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[SPINE_WIDTH, BOOK_HEIGHT, SPINE_DEPTH]} />
          <TexturedMaterial
            src={coverTextureState.spine}
            color="#0f172a"
            roughness={0.5}
          />
        </mesh>

        <group name="Cover meshes">
          <group
            ref={frontCoverRef}
            name="frontCoverPivot"
            position={[-SPINE_WIDTH / 2, 0, 0]}
            rotation={[0, BACK_COVER_ROTATION, 0]}
          >
            <mesh
              name="frontCover"
              position={[-BOOK_WIDTH / 2, 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS]} />
              <TexturedMaterial color="#ffffff" roughness={0.46} />
              <CoverTextureOverlays src={coverTextureState.front} />
            </mesh>
          </group>

          <group
            ref={backCoverRef}
            name="backCoverPivot"
            position={[SPINE_WIDTH / 2, 0, 0]}
            rotation={[0, FRONT_COVER_ROTATION, 0]}
          >
            <mesh
              name="backCover"
              position={[BOOK_WIDTH / 2, 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS]} />
              <TexturedMaterial
                src={coverTextureState.back}
                color="#1d2533"
                roughness={0.48}
              />
            </mesh>
          </group>
        </group>

        <group
          name="Pages array"
          position={[SPINE_WIDTH / 2 + PAGE_GUTTER, 0, 0]}
        >
          {pages.map((pageIndex) => {
            const isTurned = turnedPages[pageIndex];
            const defaultRotation = pageRotations[pageIndex];
            const targetRotation = isTurned
              ? FIRST_TURNED_PAGE_ROTATION
              : defaultRotation;
            const pageZOffset =
              (pageIndex - (PAGE_COUNT - 1) / 2) * PAGE_THICKNESS;

            return (
              <group
                key={pageIndex}
                ref={(pageGroup) => {
                  pageRefs.current[pageIndex] = pageGroup;
                }}
                name={`page-${pageIndex + 1}-pivot`}
                position={[0, 0, pageZOffset]}
                rotation={[0, targetRotation, 0]}
              >
                <mesh
                  name={`page-${pageIndex + 1}`}
                  position={[PAGE_WIDTH / 2, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT, 1, 1]} />
                  <TexturedMaterial color="#fffdf5" />
                </mesh>
                <PageTextureOverlays src={pageTextureState[pageIndex]} />
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
});

function PreviewTable() {
  return (
    <div className={styles.notes} aria-label="Book model structure">
      <div>
        <strong>Texture slots ready:</strong> front cover, back cover, spine,
        and 10 page textures.
      </div>
      <div>
        The Cloudinary cover is mapped onto the front cover, and the supplied
        page PNGs are mapped onto the existing page meshes without changing the
        book position or disposition.
      </div>
    </div>
  );
}

export function EbookBookPreview() {
  return (
    <section className={styles.preview} aria-label="Interactive ebook preview">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Ebook preview</p>
        <h2>Preview the guide as a lightweight 3D book.</h2>
        <p>
          The model is already split into cover meshes and 10 independently
          addressable page meshes, so each PNG/JPG layout can be mapped to the
          correct page surface.
        </p>
        <PreviewTable />
      </div>

      <div className={styles.canvasWrap}>
        <Canvas
          camera={{ position: [4, 3.1, 5.2], fov: 40 }}
          shadows
          dpr={[1, 2]}
          className={styles.canvas}
        >
          <color attach="background" args={["#07111f"]} />
          <ambientLight intensity={1.65} />
          <directionalLight position={[3.5, 6, 4]} intensity={2.8} castShadow />
          <pointLight
            position={[-3, 2.5, -2]}
            intensity={1.1}
            color="#93c5fd"
          />
          <BookModel />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.52, 0]}
            receiveShadow
          >
            <planeGeometry args={[7, 6]} />
            <shadowMaterial opacity={0.22} />
          </mesh>
          <OrbitControls enablePan={false} minDistance={4} maxDistance={8} />
        </Canvas>
      </div>
    </section>
  );
}
