import { load, wrap } from '../../src/module';

describe('module', () => {
    let url;

    afterEach(() => {
        Worker.reset();
    });

    beforeEach(() => {
        // eslint-disable-next-line no-global-assign
        Worker = ((OriginalWorker) => {
            const instances = [];

            return class ExtendedWorker extends OriginalWorker {
                constructor(rl) {
                    super(rl);

                    const addEventListener = this.addEventListener;

                    // This is an ugly hack to prevent the broker from handling mirrored events.
                    this.addEventListener = (index, ...args) => {
                        if (typeof index === 'number') {
                            return addEventListener.apply(this, args);
                        }
                    };

                    instances.push(this);
                }

                static addEventListener(index, ...args) {
                    return instances[index].addEventListener(index, ...args);
                }

                static get instances() {
                    return instances;
                }

                static reset() {
                    // eslint-disable-next-line no-global-assign
                    Worker = OriginalWorker;
                }
            };
        })(Worker);

        const blob = new Blob(
            [
                `self.addEventListener('message', ({ data }) => {
                // The port needs to be send as a Transferable because it can't be cloned.
                if (data.params !== undefined && data.params.port !== undefined) {
                    self.postMessage(data, [ data.params.port ]);
                } else {
                    self.postMessage(data);
                }
            });`
            ],
            { type: 'application/javascript' }
        );

        url = URL.createObjectURL(blob);
    });

    leche.withData(['loaded', 'wrapped'], (method) => {
        let extendableMediaRecorderWavEncoder;

        beforeEach(() => {
            if (method === 'loaded') {
                extendableMediaRecorderWavEncoder = load(url);
            } else {
                const worker = new Worker(url);

                extendableMediaRecorderWavEncoder = wrap(worker);
            }

            URL.revokeObjectURL(url);
        });

        describe('characterize()', () => {
            it('should send the correct message', (done) => {
                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'characterize'
                    });

                    done();
                });

                extendableMediaRecorderWavEncoder.characterize();
            });
        });

        describe('encode()', () => {
            let recordingId;
            let timeslice;

            beforeEach(() => {
                recordingId = 142;
                timeslice = 200;
            });

            it('should send the correct message', (done) => {
                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'encode',
                        params: { recordingId, timeslice }
                    });

                    done();
                });

                extendableMediaRecorderWavEncoder.encode(recordingId, timeslice);
            });
        });

        describe('record()', () => {
            let recordingId;
            let sampleRate;
            let typedArrays;

            beforeEach(() => {
                recordingId = 142;
                sampleRate = 44100;
                typedArrays = [new Float32Array(128), new Float32Array(128)];
            });

            it('should send the correct message', (done) => {
                Worker.addEventListener(0, 'message', ({ data }) => {
                    expect(data.id).to.be.a('number');

                    expect(data.params.typedArrays.length).to.equal(2);
                    expect(data.params.typedArrays[0]).to.be.an.instanceOf(Float32Array);
                    expect(data.params.typedArrays[0].length).to.equal(128);
                    expect(data.params.typedArrays[1]).to.be.an.instanceOf(Float32Array);
                    expect(data.params.typedArrays[1].length).to.equal(128);

                    expect(data).to.deep.equal({
                        id: data.id,
                        method: 'record',
                        params: {
                            recordingId,
                            sampleRate,
                            typedArrays: data.params.typedArrays
                        }
                    });

                    done();
                });

                extendableMediaRecorderWavEncoder.record(recordingId, sampleRate, typedArrays);
            });
        });
    });
});
