import { IBrokerDefinition } from 'broker-factory';
import { TTypedArray } from '../types';

export interface IExtendableMediaRecorderWavEncoderBrokerDefinition extends IBrokerDefinition {
    characterize(): Promise<RegExp>;

    encode(recordingId: number, timeslice: null | number): Promise<ArrayBuffer[]>;

    record(recordingId: number, sampleRate: number, typedArrays: TTypedArray[]): Promise<void>;
}
