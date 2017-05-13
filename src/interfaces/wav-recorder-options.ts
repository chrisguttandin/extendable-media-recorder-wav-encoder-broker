import { UniqueIdGeneratingService } from '../services/unique-id-generating';
import { IWavRecorderFactoryOptions } from './wav-recorder-factory-options';

export interface IWavRecorderOptions extends IWavRecorderFactoryOptions {

    uniqueIdGeneratingService: UniqueIdGeneratingService;

    unrespondedRequests: Set<number>;

    recordingIds: Set<number>;

    worker: Worker;

}
