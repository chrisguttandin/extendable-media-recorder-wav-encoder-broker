import { IBrokerDefinition } from 'broker-factory';
import { TTypedArray } from 'extendable-media-recorder-wav-encoder-worker';

export interface IExtendableMediaRecorderWavEncoderBrokerDefinition extends IBrokerDefinition {

    characterize (): Promise<RegExp>;

    encode (recordingId: number): Promise<ArrayBuffer[]>;

    record (recordingId: number, typedArrays: TTypedArray[]): Promise<void>;

}
