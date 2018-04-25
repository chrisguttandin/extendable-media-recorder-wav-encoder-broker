import { createBroker } from 'broker-factory';
import { TExtendableMediaRecorderWavEncoderWorkerDefinition } from 'extendable-media-recorder-wav-encoder-worker';
import { IExtendableMediaRecorderWavEncoderBrokerDefinition } from './interfaces';
import { TExtendableMediaRecorderWavEncoderBrokerLoader, TExtendableMediaRecorderWavEncoderBrokerWrapper } from './types';

export * from './interfaces';
export * from './types';

export const wrap: TExtendableMediaRecorderWavEncoderBrokerWrapper = createBroker<
    IExtendableMediaRecorderWavEncoderBrokerDefinition,
    TExtendableMediaRecorderWavEncoderWorkerDefinition
>({
    characterize: ({ call }) => {
        return () => call('characterize', { });
    },
    encode: ({ call }) => {
        return (recordingId) => {
            return call('encode', { recordingId });
        };
    },
    record: ({ call }) => {
        return async (recordingId, typedArrays) => {
            await call('record', { recordingId, typedArrays }, typedArrays.map(({ buffer }) => <ArrayBuffer> buffer));
        };
    }
});

export const load: TExtendableMediaRecorderWavEncoderBrokerLoader = (url: string) => {
    const worker = new Worker(url);

    return wrap(worker);
};
