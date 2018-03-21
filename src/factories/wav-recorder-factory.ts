import {
    IEncodeRequest,
    IEncodeResponse,
    IErrorResponse,
    IRecordRequest,
    IWorkerEvent
} from 'extendable-media-recorder-wav-encoder-worker';
import { addUniqueNumber } from 'fast-unique-numbers';
import { TWavRecorderFactoryFactory } from '../types';

const requestRecording = (
    recordingId: number,
    recordingIds: Set<number>,
    resolve: Function,
    reject: Function,
    unrespondedRequests: Set<number>,
    worker: Worker
) => {
    const id = addUniqueNumber(unrespondedRequests);

    worker.onmessage = ({ data }: IWorkerEvent) => {
        if (data.id === id) {
            if (data.error === null) {
                const { result: { arrayBuffer } } = <IEncodeResponse> data;

                recordingIds.delete(recordingId);

                worker.onmessage = (<any> null);

                resolve(arrayBuffer);
            } else {
                const { error: { message } } = <IErrorResponse> data;

                reject(new Error(message));
            }
        }
    };

    worker.postMessage(<IEncodeRequest> {
        id,
        method: 'encode',
        params: { recordingId }
    });
};

export const createWavRecorderFactory: TWavRecorderFactoryFactory = (recordingIds, unrespondedRequests, worker) => {
    return (mediaStream) => {
        const audioContext = new AudioContext();
        const gainNode = audioContext.createGain();
        const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(mediaStream);
        const recordingId = addUniqueNumber(recordingIds);
        const scriptProcessorNode = audioContext.createScriptProcessor();
        const unrespondedRecordingRequests = new Set();

        let recordRequestPromise: null | { reject: Function, resolve: Function } = null;

        gainNode.gain.value = 0;

        mediaStreamAudioSourceNode
            .connect(scriptProcessorNode)
            .connect(gainNode)
            .connect(audioContext.destination);

        scriptProcessorNode.onaudioprocess = <EventListener> (({ inputBuffer }: AudioProcessingEvent) => {
            const typedArrays = [];

            const length = inputBuffer.numberOfChannels;

            for (let i = 0; i < length; i += 1) {
                // @todo Check if slicing the array is really necessary.
                typedArrays.push(inputBuffer
                    .getChannelData(i)
                    .slice(0));
            }

            const id = addUniqueNumber(unrespondedRequests);

            unrespondedRecordingRequests.add(id);

            worker.postMessage(<IRecordRequest> {
                id,
                method: 'record',
                params: { recordingId, typedArrays }
            }, typedArrays.map(({ buffer }) => buffer));
        });

        worker.onmessage = <EventListener> (({ data }: IWorkerEvent) => {
            const { id } = data;

            if (unrespondedRecordingRequests.has(id)) {
                unrespondedRecordingRequests.delete(data.id);
            }

            if (unrespondedRequests.has(id)) {
                unrespondedRequests.delete(id);
            }

            if (unrespondedRecordingRequests.size === 0 && recordRequestPromise !== null) {
                const { reject, resolve } = recordRequestPromise;

                requestRecording(recordingId, recordingIds, resolve, reject, unrespondedRequests, worker);

                recordRequestPromise = null;
            }
        });

        return {
            stop () {
                scriptProcessorNode.onaudioprocess = (<any> null);
                audioContext.close();

                return new Promise((resolve, reject) => {
                    if (unrespondedRecordingRequests.size === 0) {
                        requestRecording(recordingId, recordingIds, resolve, reject, unrespondedRequests, worker);
                    } else {
                        recordRequestPromise = { reject, resolve };
                    }
                });
            }
        };
    };
};
