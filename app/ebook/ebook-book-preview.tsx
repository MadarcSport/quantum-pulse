"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { DoubleSide, Group, SRGBColorSpace, TextureLoader } from "three";
import styles from "./ebook-book-preview.module.css";

const EBOOK_COVER_URL =
  "https://res.cloudinary.com/db7i9febj/image/upload/v1781964036/bookCov001_wkq1dz.png";
const PAGE_COUNT = 10;
const BOOK_WIDTH = 1.4;
const BOOK_HEIGHT = 2.0;
const COVER_THICKNESS = 0.04;
const PAGE_THICKNESS = 0.002;
const SPINE_WIDTH = 0.1;
const SPINE_DEPTH = 0.1;
const PAGE_WIDTH = BOOK_WIDTH * 1.1;
const PAGE_HEIGHT = BOOK_HEIGHT * 1.01;
const PAGE_GUTTER = 0.012;

const FRONT_COVER_ROTATION = -0.1;
const BACK_COVER_ROTATION = 0.18;
const FIRST_TURNED_PAGE_ROTATION = -2.88;
const LAST_UNTURNED_PAGE_ROTATION = -0.08;

// Add your PNG/JPG URLs here later. Examples:
// front: "/ebook/front-cover.png"
// pageTextures: ["/ebook/page-01.png", "/ebook/page-02.png", ...]
const bookTextureSources = {
  cover: {
    front: EBOOK_COVER_URL,
    back: "",
    spine: "",
  },
  pages: Array.from({ length: PAGE_COUNT }, () => ""),
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
};

function TexturedMaterial({
  src,
  color,
  roughness = 0.72,
  metalness = 0.02,
}: MaterialSlotProps) {
  if (!src) {
    return (
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        side={DoubleSide}
      />
    );
  }

  return (
    <LoadedTextureMaterial
      src={src}
      color={color}
      roughness={roughness}
      metalness={metalness}
    />
  );
}

function LoadedTextureMaterial({
  src,
  color,
  roughness = 0.72,
  metalness = 0.02,
}: Required<MaterialSlotProps>) {
  const texture = useLoader(TextureLoader, src);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return (
    <meshStandardMaterial
      map={texture}
      color={color}
      roughness={roughness}
      metalness={metalness}
      side={DoubleSide}
    />
  );
}

function CoverImagePlane({ src, x }: { src?: string; x: number }) {
  if (!src) return null;

  return (
    <mesh
      name="frontCoverImage"
      position={[x, 0, -COVER_THICKNESS / 2 - 0.002]}
      rotation={[0, Math.PI, 0]}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[BOOK_WIDTH * 0.96, BOOK_HEIGHT * 0.96, 1, 1]} />
      <TexturedMaterial src={src} color="#ffffff" roughness={0.5} />
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
              <TexturedMaterial src="" color="#0e183c" roughness={0.46} />
            </mesh>
            <CoverImagePlane
              src={coverTextureState.front}
              x={-BOOK_WIDTH / 2}
            />
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
                  <TexturedMaterial
                    src={pageTextureState[pageIndex]}
                    color="#fffdf5"
                  />
                </mesh>
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
      <div>The Cloudinary cover is now mapped onto the front cover plane.</div>
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
          correct page later.
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
