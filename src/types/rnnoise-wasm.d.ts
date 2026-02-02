declare module "@jitsi/rnnoise-wasm" {
  interface RNNoiseModule {
    ready: Promise<void>;
    _rnnoise_create: () => number;
    _rnnoise_destroy: (state: number) => void;
    _rnnoise_process_frame: (state: number, input: number, output: number) => number;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    HEAPF32: Float32Array;
  }

  interface RNNoiseModuleOptions {
    locateFile?: (filename: string) => string;
  }

  type CreateRNNoiseModule = (options?: RNNoiseModuleOptions) => Promise<RNNoiseModule>;

  export const createRNNWasmModule: CreateRNNoiseModule;
  export const createRNNWasmModuleSync: CreateRNNoiseModule;
}
