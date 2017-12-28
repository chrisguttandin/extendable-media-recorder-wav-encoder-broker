import { IWavRecorder } from './wav-recorder';

export interface IWavEncoder {

    isTypeSupported (type: string): boolean;

    start (mediaStream: MediaStream): IWavRecorder;

}
