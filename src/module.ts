import 'core-js/es7/reflect'; // tslint:disable-line:ordered-imports
import { Injector } from '@angular/core'; // tslint:disable-line:ordered-imports
import { WAV_ENCODER_FACTORY_PROVIDER, WavEncoder, WavEncoderFactory } from './factories/wav-encoder';
import { WAV_RECODER_FACTORY_PROVIDER } from './factories/wav-recorder';
import { recordingIds } from './providers/recording-ids';
import { unrespondedRequests } from './providers/unresponded-requests';
import { worker } from './providers/worker';

export const load = (url: string): WavEncoder => {
    const injector = Injector.create([
        { provide: recordingIds, useValue: new Set<number>() },
        { provide: unrespondedRequests, useValue: new Set<number>() },
        WAV_ENCODER_FACTORY_PROVIDER,
        WAV_RECODER_FACTORY_PROVIDER,
        { provide: worker, useValue: new Worker(url) }
    ]);

    const wavEncoderFactory = injector.get(WavEncoderFactory);

    return wavEncoderFactory.create();
};
