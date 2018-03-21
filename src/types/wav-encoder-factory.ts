import { IWavEncoder } from '../interfaces';
import { TWavRecorderFactory } from './wav-recorder-factory';

export type TWavEncoderFactory = (createWavRecoder: TWavRecorderFactory) => IWavEncoder;
