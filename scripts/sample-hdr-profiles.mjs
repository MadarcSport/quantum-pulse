import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const HDR_FILES = {
  moonrise: path.join(projectRoot, "app/canva/assets/moonrise.hdr"),
  rosendal: path.join(projectRoot, "app/canva/assets/rosendal.hdr"),
  studio2: path.join(projectRoot, "app/canva/assets/studio2.hdr"),
  ferndale: path.join(projectRoot, "app/canva/assets/ferndale.hdr"),
  ferndale2: path.join(projectRoot, "app/canva/assets/ferndale2.hdr"),
};

const OUTPUT_FILE = path.join(
  projectRoot,
  "app/canva/hdrAnalysis.generated.json",
);
const nodeProcess = globalThis.process;

function round(value, decimals = 4) {
  const precision = 10 ** decimals;
  return Math.round(value * precision) / precision;
}

function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(sortedValues.length * ratio)),
  );
  return sortedValues[index];
}

function analyzeHdrTexture(parsedHdr) {
  const data =
    parsedHdr?.data ??
    parsedHdr?.image?.data ??
    parsedHdr?.source?.data?.data ??
    parsedHdr?.source?.data;
  if (!data || data.length === 0) {
    throw new Error("HDR texture did not contain readable pixel data.");
  }

  let luminanceSum = 0;
  let weightedR = 0;
  let weightedG = 0;
  let weightedB = 0;
  const luminances = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    luminanceSum += luminance;
    luminances.push(luminance);

    weightedR += r * luminance;
    weightedG += g * luminance;
    weightedB += b * luminance;
  }

  const pixelCount = data.length / 4;
  const averageLuminance = luminanceSum / pixelCount;

  const weight = Math.max(luminanceSum, 1e-8);
  const colorR = weightedR / weight;
  const colorG = weightedG / weight;
  const colorB = weightedB / weight;

  const maxChannel = Math.max(colorR, colorG, colorB, 1e-8);
  const normalizedDominant = [
    Math.min(colorR / maxChannel, 1),
    Math.min(colorG / maxChannel, 1),
    Math.min(colorB / maxChannel, 1),
  ];

  luminances.sort((a, b) => a - b);
  const p01 = percentile(luminances, 0.01);
  const p50 = percentile(luminances, 0.5);
  const p95 = percentile(luminances, 0.95);
  const p99 = percentile(luminances, 0.99);
  const averageLuminanceNormalized = p95 > 1e-8 ? averageLuminance / p95 : 0;
  const dynamicRange = p01 > 1e-8 ? p99 / p01 : p50 > 1e-8 ? p99 / p50 : 1;

  return {
    averageLuminance: round(averageLuminanceNormalized, 4),
    averageLuminanceRaw: round(averageLuminance, 4),
    dominantColor: normalizedDominant.map((v) => round(v, 4)),
    dynamicRange: round(dynamicRange, 4),
  };
}

async function loadHdrTexture(hdrPath) {
  const loader = new HDRLoader();
  const buffer = await readFile(hdrPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );

  return loader.parse(arrayBuffer);
}

async function main() {
  const entries = await Promise.all(
    Object.entries(HDR_FILES).map(async ([key, hdrPath]) => {
      const parsedHdr = await loadHdrTexture(hdrPath);
      const analysis = analyzeHdrTexture(parsedHdr);
      return [key, analysis];
    }),
  );

  const output = Object.fromEntries(entries);
  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  nodeProcess.stdout.write(
    `Generated ${path.relative(projectRoot, OUTPUT_FILE)} for ${entries.length} HDR profiles.\n`,
  );
}

main().catch((error) => {
  nodeProcess.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  nodeProcess.exitCode = 1;
});
