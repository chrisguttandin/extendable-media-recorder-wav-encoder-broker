import { Injectable } from '@angular/core';
import { IWavEncoderOptions } from '../interfaces';
import { WavRecorder, WavRecorderFactory } from './wav-recorder';

export class WavEncoder {

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

    public start (mediaStream: MediaStream): WavRecorder {
        return this._wavRecorderFactory.create({ mediaStream });
    }

}

@Injectable()
export class WavEncoderFactory {

    private _wavRecorderFactory: WavRecorderFactory;

    constructor (wavRecorderFactory: WavRecorderFactory) {
        this._wavRecorderFactory = wavRecorderFactory;
    }

    public create () {
        return new WavEncoder({ wavRecorderFactory: this._wavRecorderFactory });
    }

}
