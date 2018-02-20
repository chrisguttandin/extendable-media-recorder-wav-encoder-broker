import { Injector } from '@angular/core';
import { WAV_ENCODER_FACTORY_PROVIDER, WavEncoderFactory } from './factories/wav-encoder';
import { WAV_RECODER_FACTORY_PROVIDER } from './factories/wav-recorder';
import { IWavEncoder } from './interfaces';
import { recordingIds } from './providers/recording-ids';
import { unrespondedRequests } from './providers/unresponded-requests';
import { worker } from './providers/worker';

export * from './interfaces';

export const load = (url: string): IWavEncoder => {
    const injector = Injector.create({
        providers: [
            { provide: recordingIds, useValue: new Set<number>() },
            { provide: unrespondedRequests, useValue: new Set<number>() },
            WAV_ENCODER_FACTORY_PROVIDER,
            WAV_RECODER_FACTORY_PROVIDER,
            { provide: worker, useValue: new Worker(url) }
        ]
    });

    const wavEncoderFactory = injector.get<WavEncoderFactory>(WavEncoderFactory);

    return wavEncoderFactory.create();
};
