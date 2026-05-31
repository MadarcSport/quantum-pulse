import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/v1/decoders/";

export function configureDracoLoader(loader: DRACOLoader) {
  loader.setDecoderPath(DRACO_DECODER_PATH);
}
