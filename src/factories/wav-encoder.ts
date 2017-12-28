import { Injectable } from '@angular/core';
import { IWavEncoder, IWavEncoderOptions, IWavRecorder } from '../interfaces';
import { WavRecorderFactory } from './wav-recorder';

export class WavEncoder implements IWavEncoder {

    private _wavRecorderFactory: WavRecorderFactory;

    constructor ({ wavRecorderFactory }: IWavEncoderOptions) {
        this._wavRecorderFactory = wavRecorderFactory;
    }

    public isTypeSupported (type: string): boolean {
        if (type === 'audio/wav') {
            return true;
        }

        return false;
    }

    public start (mediaStream: MediaStream): IWavRecorder {
        return this._wavRecorderFactory.create({ mediaStream });
    }

}

@Injectable()
export class WavEncoderFactory {

    private _wavRecorderFactory: WavRecorderFactory;

    constructor (wavRecorderFactory: WavRecorderFactory) {
        this._wavRecorderFactory = wavRecorderFactory;
    }

    public create (): IWavEncoder {
        return new WavEncoder({ wavRecorderFactory: this._wavRecorderFactory });
    }

}

export const WAV_ENCODER_FACTORY_PROVIDER = { deps: [ WavRecorderFactory ], provide: WavEncoderFactory };
