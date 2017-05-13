import { Inject, Injectable } from '@angular/core';
import { IEncodeRequest, IEncodeResponse, IRecordRequest, IWorkerEvent } from 'extendable-media-recorder-wav-encoder-worker';
import { IWavRecorderFactoryOptions, IWavRecorderOptions } from '../interfaces';
import { recordingIds } from '../providers/recording-ids';
import { unrespondedRequests } from '../providers/unresponded-requests';
import { worker } from '../providers/worker';
import { UniqueIdGeneratingService } from '../services/unique-id-generating';

export class WavRecorder {

    private _audioContext: AudioContext;

    private _onAudioProcess: EventListener;

    private _onMessage: EventListener;

    private _recordRequestPromiseResolve: null | Function;

    private _recordingId: number;

    private _recordingIds: Set<number>;

    private _scriptProcessorNode: ScriptProcessorNode;

    private _uniqueIdGeneratingService: UniqueIdGeneratingService;

    private _unrespondedRecordingRequests: Set<number>;

    private _unrespondedRequests: Set<number>;

    private _worker: Worker;

    constructor ({ mediaStream, uniqueIdGeneratingService, unrespondedRequests, recordingIds, worker }: IWavRecorderOptions) {
        this._audioContext = new AudioContext();
        this._worker = worker;
        this._recordRequestPromiseResolve = null;
        this._recordingId = uniqueIdGeneratingService.generateAndAdd(recordingIds);
        this._recordingIds = recordingIds;
        this._uniqueIdGeneratingService = uniqueIdGeneratingService;
        this._unrespondedRecordingRequests = new Set();
        this._unrespondedRequests = unrespondedRequests;

        const mediaStreamAudioSourceNode = this._audioContext.createMediaStreamSource(mediaStream);

        this._scriptProcessorNode = this._audioContext.createScriptProcessor(0, 1);

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

            const id = uniqueIdGeneratingService.generateAndAdd(unrespondedRequests);

            this._unrespondedRecordingRequests.add(id);

            worker.postMessage(<IRecordRequest> {
                id,
                method: 'record',
                params: { recordingId: this._recordingId, typedArrays }
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

            if (this._unrespondedRecordingRequests.size === 0 && this._recordRequestPromiseResolve !== null) {
                this._requestRecording(this._recordRequestPromiseResolve);

                this._recordRequestPromiseResolve = null;
            }
        };

        this._scriptProcessorNode.addEventListener('audioprocess', this._onAudioProcess);
        this._worker.addEventListener('message', this._onMessage);
    }

    private _requestRecording (resolve: Function) {
        const id = this._uniqueIdGeneratingService.generateAndAdd(this._unrespondedRequests);

        const onMessage = ({ data }: IWorkerEvent) => {
            if (data.id === id) {
                const { result: { arrayBuffer } } = <IEncodeResponse> data;

                this._recordingIds.delete(this._recordingId);

                this._worker.removeEventListener('message', onMessage);

                resolve(arrayBuffer);
            }
        };

        this._worker.addEventListener('message', onMessage);
        this._worker.removeEventListener('message', this._onMessage);

        this._worker.postMessage(<IEncodeRequest> {
            id,
            method: 'encode',
            params: { recordingId: this._recordingId }
        });
    }

    public stop (): Promise<ArrayBuffer> {
        this._scriptProcessorNode.removeEventListener('audioprocess', this._onAudioProcess);
        this._audioContext.close();

        return new Promise((resolve) => {
            if (this._unrespondedRecordingRequests.size === 0) {
                this._requestRecording(resolve);
            } else {
                this._recordRequestPromiseResolve = resolve;
            }
        });
    }

}

@Injectable()
export class WavRecorderFactory {

    private _options: {

        recordingIds: Set<number>;

        uniqueIdGeneratingService: UniqueIdGeneratingService;

        unrespondedRequests: Set<number>;

        worker: Worker;

    };

    constructor (
        @Inject(recordingIds) recordingIds: Set<number>,
        uniqueIdGeneratingService: UniqueIdGeneratingService,
        @Inject(unrespondedRequests) unrespondedRequests: Set<number>,
        @Inject(worker) worker: Worker
    ) {
        this._options = { recordingIds, uniqueIdGeneratingService, unrespondedRequests, worker };
    }

    public create ({ mediaStream }: IWavRecorderFactoryOptions) {
        return new WavRecorder({ ...this._options, mediaStream });
    }

}
