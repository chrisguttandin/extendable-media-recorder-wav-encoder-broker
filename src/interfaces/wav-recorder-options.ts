import { IWavRecorderFactoryOptions } from './wav-recorder-factory-options';

export interface IWavRecorderOptions extends IWavRecorderFactoryOptions {

    unrespondedRequests: Set<number>;

    recordingIds: Set<number>;

    worker: Worker;

}
