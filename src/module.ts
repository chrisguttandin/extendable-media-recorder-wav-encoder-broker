import { createWavEncoder } from './factories/wav-encoder';
import { createWavRecorderFactory } from './factories/wav-recorder-factory';
import { IWavEncoder } from './interfaces';

export * from './interfaces';
export * from './types';

export const load = (url: string): IWavEncoder => {
    const recordingIds: Set<number> = new Set();
    const unrespondedRequests: Set<number> = new Set();
    const worker = new Worker(url);
    const createWavRecoder = createWavRecorderFactory(recordingIds, unrespondedRequests, worker);

    return createWavEncoder(createWavRecoder);
};
