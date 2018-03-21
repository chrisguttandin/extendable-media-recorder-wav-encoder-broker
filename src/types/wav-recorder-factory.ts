import { IWavRecorder } from '../interfaces';

export type TWavRecorderFactory = (mediaStream: MediaStream) => IWavRecorder;
