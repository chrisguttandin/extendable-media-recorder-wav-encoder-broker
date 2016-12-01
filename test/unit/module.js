import { load } from '../../src/module';

describe('module', () => {

    let wavEncoderFactory;

    beforeEach(() => {
        const blob = new Blob([`
            self.addEventListener('message', ({ data }) => {
                self.postMessage(data);
            });
        `], { type: 'application/javascript' });

        wavEncoderFactory = load(URL.createObjectURL(blob));
    });

    describe('wavEncoderFactory', () => {

        it('should be a object', () => {
            expect(wavEncoderFactory).to.be.a('object');
        });

    });

});
