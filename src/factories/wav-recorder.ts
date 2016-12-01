import { worker } from '../providers/worker';
import { Inject, Injectable } from '@angular/core';

export class WavRecorder {

    private _audioContext;

    private _onAudioProcess;

    private _scriptProcessorNode;

    private _worker;

    constructor ({ mediaStream, worker }) {
        this._audioContext = new AudioContext();
        this._worker = worker;

        const mediaStreamAudioSourceNode = this._audioContext.createMediaStreamSource(mediaStream);

        this._scriptProcessorNode = this._audioContext.createScriptProcessor(0, 1);

        const gainNode = this._audioContext.createGain();

        gainNode.gain.value = 0;

        mediaStreamAudioSourceNode
            .connect(this._scriptProcessorNode)
            .connect(gainNode)
            .connect(this._audioContext.destination);

        this._onAudioProcess = ({ inputBuffer }) => {
            const typedArrays = [];

            for (let i = 0, length = inputBuffer.numberOfChannels; i < length; i += 1) {
                typedArrays.push(inputBuffer.getChannelData(i));
            }

            worker.postMessage({ typedArrays }, typedArrays);
        };

        this._scriptProcessorNode.addEventListener('audioprocess', this._onAudioProcess);
    }

    public stop (): Promise<ArrayBuffer> {
        this._scriptProcessorNode.removeEventListener('audioprocess', this._onAudioProcess);
        this._audioContext.close();

        return new Promise((resolve, reject) => {
            const onMessage = ({ data }) => {
                resolve(data.arrayBuffer);

                this._worker.removeEventListener('message', onMessage);
            };

            this._worker.addEventListener('message', onMessage);

            this._worker.postMessage({ done: true });
        });
    }

}

@Injectable()
export class WavRecorderFactory {

    private _worker;

    constructor (@Inject(worker) worker) {
        this._worker = worker;
    }

    public create ({ mediaStream }) {
        return new WavRecorder({ mediaStream, worker: this._worker });
    }

}
