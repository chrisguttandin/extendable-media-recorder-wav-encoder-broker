import { Inject, Injectable } from '@angular/core';
import { IEncodeRequest, IRecordRequest } from 'extendable-media-recorder-wav-encoder-worker';
import { recordingIds } from '../providers/recording-ids';
import { unrespondedRequests } from '../providers/unresponded-requests';
import { worker } from '../providers/worker';
import { UniqueIdGeneratingService } from '../services/unique-id-generating';

export class WavRecorder {

    private _audioContext;

    private _onAudioProcess;

    private _onMessage;

    private _recordRequestPromise;

    private _recordingId: number;

    private _recordingIds: Set<number>;

    private _scriptProcessorNode;

    private _uniqueIdGeneratingService: UniqueIdGeneratingService;

    private _unrespondedRecordingRequests: Set<number>;

    private _unrespondedRequests: Set<number>;

    private _worker;

    constructor ({ mediaStream, uniqueIdGeneratingService, unrespondedRequests, recordingIds, worker }) {
        this._audioContext = new AudioContext();
        this._worker = worker;
        this._recordRequestPromise = null;
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

        this._onAudioProcess = ({ inputBuffer }) => {
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

        this._onMessage = ({ data }) => {
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

    private _requestRecording (resolve, reject) {
        const onMessage = ({ data }) => {
            resolve(data.arrayBuffer);

            this._recordingIds.delete(this._recordingId);

            this._worker.removeEventListener('message', onMessage);
        };

        this._worker.addEventListener('message', onMessage);
        this._worker.removeEventListener('message', this._onMessage);

        const id = this._uniqueIdGeneratingService.generateAndAdd(this._unrespondedRequests);

        this._worker.postMessage(<IEncodeRequest> {
            id,
            method: 'encode',
            params: { recordingId: this._recordingId }
        });
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
        @Inject(recordingIds) recordingIds,
        uniqueIdGeneratingService: UniqueIdGeneratingService,
        @Inject(unrespondedRequests) unrespondedRequests,
        @Inject(worker) worker
    ) {
        this._options = { recordingIds, uniqueIdGeneratingService, unrespondedRequests, worker };
    }

    public create ({ mediaStream }) {
        return new WavRecorder({ ...this._options, mediaStream });
    }

}
