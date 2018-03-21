import { TWavEncoderFactory } from '../types';

export const createWavEncoder: TWavEncoderFactory = (createWavRecoder) => {
    return {
        isTypeSupported (type) {
            return (type === 'audio/wav');
        },
        start (mediaStream) {
            return createWavRecoder(mediaStream);
        }
    };
};
