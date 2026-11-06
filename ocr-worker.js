// Runs the on-device handwriting model (TrOCR via Transformers.js) off the main thread, so the page never freezes.
// Messages in:  {type:'load', model, device, dtype}   {type:'read', px, w, h, max}
// Messages out: {type:'st', t}  {type:'prog', p}  {type:'ready'}  {type:'text', text, ms}  {type:'err', msg}
const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';
let pipe = null, RawImage = null;
self.onmessage = async e => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      self.postMessage({ type: 'st', t: 'Downloading the code library…' });
      const T = await import(CDN); RawImage = T.RawImage; T.env.allowLocalModels = false;
      self.postMessage({ type: 'st', t: 'Fetching the model…' });
      pipe = await T.pipeline('image-to-text', m.model, { device: m.device || 'wasm', dtype: m.dtype || 'q8', progress_callback: p => self.postMessage({ type: 'prog', p }) });
      self.postMessage({ type: 'ready' });
    } else if (m.type === 'read') {
      if (!pipe) throw new Error('The model is not loaded yet.');
      const t0 = performance.now(), r = await pipe(new RawImage(m.px, m.w, m.h, 3), { max_new_tokens: m.max || 48 });
      self.postMessage({ type: 'text', text: r[0].generated_text, ms: performance.now() - t0 });
    }
  } catch (err) { self.postMessage({ type: 'err', msg: String((err && err.message) || err) }); }
};
