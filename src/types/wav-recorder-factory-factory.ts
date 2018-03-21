import { TWavRecorderFactory } from './wav-recorder-factory';

export type TWavRecorderFactoryFactory = (
    recordingIds: Set<number>,
    unrespondedRequests: Set<number>,
    worker: Worker
) => TWavRecorderFactory;
