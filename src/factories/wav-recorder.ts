import { Inject, Injectable } from '@angular/core';
import {
    IEncodeRequest,
    IEncodeResponse,
    IErrorResponse,
    IRecordRequest,
    IWorkerEvent
} from 'extendable-media-recorder-wav-encoder-worker';
import { addUniqueNumber } from 'fast-unique-numbers';
import { IWavRecorderFactoryOptions, IWavRecorderOptions } from '../interfaces';
import { recordingIds } from '../providers/recording-ids';
import { unrespondedRequests } from '../providers/unresponded-requests';
import { worker } from '../providers/worker';

export class WavRecorder {

    private _audioContext: AudioContext;

    private _onAudioProcess: EventListener;

    private _onMessage: EventListener;

    private _recordRequestPromise: null | { reject: Function, resolve: Function };

    private _recordingId: number;

    private _recordingIds: Set<number>;

    private _scriptProcessorNode: ScriptProcessorNode;

    private _unrespondedRecordingRequests: Set<number>;

    private _unrespondedRequests: Set<number>;

    private _worker: Worker;

    constructor ({
        mediaStream,
        unrespondedRequests: nrspnddRqusts,
        recordingIds: rcrdngDs,
        worker: wrkr
    }: IWavRecorderOptions) {
        this._audioContext = new AudioContext();
        this._worker = wrkr;
        this._recordRequestPromise = null;
        this._recordingId = addUniqueNumber(rcrdngDs);
        this._recordingIds = rcrdngDs;
        this._unrespondedRecordingRequests = new Set();
        this._unrespondedRequests = nrspnddRqusts;

        const mediaStreamAudioSourceNode = this._audioContext.createMediaStreamSource(mediaStream);

        this._scriptProcessorNode = this._audioContext.createScriptProcessor();

        const gainNode = this._audioContext.createGain();

        gainNode.gain.value = 0;

        mediaStreamAudioSourceNode
            .connect(this._scriptProcessorNode)
            .connect(gainNode)
            .connect(this._audioContext.destination);

        this._onAudioProcess = ({ inputBuffer }: AudioProcessingEvent) => {
            const typedArrays = [];

            const length = inputBuffer.numberOfChannels;

            for (let i = 0; i < length; i += 1) {
                // @todo Check if slicing the array is really necessary.
                typedArrays.push(inputBuffer.getChannelData(i).slice(0));
            }

            const id = addUniqueNumber(nrspnddRqusts);

            this._unrespondedRecordingRequests.add(id);

            wrkr.postMessage(<IRecordRequest> {
                id,
                method: 'record',
                params: { recordingId: this._recordingId, typedArrays }
            }, typedArrays.map(({ buffer }) => buffer));
        };

        this._onMessage = ({ data }: IWorkerEvent) => {
            const { id } = data;

            if (this._unrespondedRecordingRequests.has(id)) {
                this._unrespondedRecordingRequests.delete(data.id);
            }

            if (this._unrespondedRequests.has(id)) {
                this._unrespondedRequests.delete(id);
            }

            if (this._unrespondedRecordingRequests.size === 0 && this._recordRequestPromise !== null) {
                const { reject, resolve } = this._recordRequestPromise;

                this._requestRecording(resolve, reject);

                this._recordRequestPromise = null;
            }
        };

        this._scriptProcessorNode.addEventListener('audioprocess', this._onAudioProcess);
        this._worker.addEventListener('message', this._onMessage);
    }

    public stop (): Promise<ArrayBuffer> {
        this._scriptProcessorNode.removeEventListener('audioprocess', this._onAudioProcess);
        this._audioContext.close();

        return new Promise((resolve, reject) => {
            if (this._unrespondedRecordingRequests.size === 0) {
                this._requestRecording(resolve, reject);
            } else {
                this._recordRequestPromise = { reject, resolve };
            }
        });
    }

    private _requestRecording (resolve: Function, reject: Function) {
        const id = addUniqueNumber(this._unrespondedRequests);

        const onMessage = ({ data }: IWorkerEvent) => {
            if (data.id === id) {
                if (data.error === null) {
                    const { result: { arrayBuffer } } = <IEncodeResponse> data;

                    this._recordingIds.delete(this._recordingId);

                    this._worker.removeEventListener('message', onMessage);

                    resolve(arrayBuffer);
                } else {
                    const { error: { message } } = <IErrorResponse> data;

                    reject(new Error(message));
                }
            }
        };

        this._worker.addEventListener('message', onMessage);
        this._worker.removeEventListener('message', this._onMessage);

        this._worker.postMessage(<IEncodeRequest> {
            id,
            method: 'encode',
            params: { recordingId: this._recordingId }
        });
    }

}

@Injectable()
export class WavRecorderFactory {

    private _options: {

        recordingIds: Set<number>;

        unrespondedRequests: Set<number>;

        worker: Worker;

    };

    constructor (
        @Inject(recordingIds) rcrdngDs: Set<number>,
        @Inject(unrespondedRequests) nrspnddRqusts: Set<number>,
        @Inject(worker) wrkr: Worker
    ) {
        this._options = { recordingIds: rcrdngDs, unrespondedRequests: nrspnddRqusts, worker: wrkr };
    }

    public create ({ mediaStream }: IWavRecorderFactoryOptions) {
        return new WavRecorder({ ...this._options, mediaStream });
    }

}
