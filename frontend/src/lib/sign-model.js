const MODEL_PATH = "/recognition-model";
const RUNTIME_URLS = [
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.4/dist/tf.min.js",
  "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.3/dist/teachablemachine-image.min.js",
];

let modelPromise;

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    const timeout = window.setTimeout(fail, 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error("The sign recognition library could not load."));
    }
    script.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    script.onerror = fail;
    document.head.append(script);
  });
}

export function loadSignModel() {
  modelPromise ??= (async () => {
    if (!window.tf) await loadScript(RUNTIME_URLS[0]);
    if (!window.tmImage) await loadScript(RUNTIME_URLS[1]);
    return window.tmImage.load(`${MODEL_PATH}/model.json`, `${MODEL_PATH}/metadata.json`);
  })().catch((error) => {
    modelPromise = undefined;
    throw error;
  });
  return modelPromise;
}
