import { Injectable } from '@angular/core';
import { WavRecorder, WavRecorderFactory } from './wav-recorder';

export class WavEncoder {

    private _wavRecorderFactory;

    constructor ({ wavRecorderFactory }) {
        this._wavRecorderFactory = wavRecorderFactory;
    }

    public isTypeSupported (type): boolean {
        if (type === 'audio/wav') {
            return true;
        }

        return false;
    }

    public start (mediaStream): WavRecorder {
        return this._wavRecorderFactory.create({ mediaStream });
    }

}

@Injectable()
export class WavEncoderFactory {

    private _wavRecorderFactory;

    constructor (wavRecorderFactory: WavRecorderFactory) {
        this._wavRecorderFactory = wavRecorderFactory;
    }

    public create () {
        return new WavEncoder({ wavRecorderFactory: this._wavRecorderFactory });
    }

}
