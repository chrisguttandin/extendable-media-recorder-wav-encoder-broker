import 'core-js/es7/reflect'; // tslint:disable-line:ordered-imports
import { WavEncoderFactory } from './factories/wav-encoder';
import { WavRecorderFactory } from './factories/wav-recorder';
import { worker } from './providers/worker';
import { ReflectiveInjector } from '@angular/core';

export const load = (url: string) => {
    const injector = ReflectiveInjector.resolveAndCreate([
        WavEncoderFactory,
        WavRecorderFactory,
        { provide: worker, useValue: new Worker(url) }
    ]);

    const wavEncoderFactory = injector.get(WavEncoderFactory);

    return wavEncoderFactory.create();
};
