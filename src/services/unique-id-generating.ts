// @todo Test actual browser support.
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

export class UniqueIdGeneratingService {

    public generate (map: Set<number>) {
        let id = Math.round(Math.random() * MAX_SAFE_INTEGER);

        while (map.has(id)) {
            id = Math.round(Math.random() * MAX_SAFE_INTEGER);
        }

        return id;
    }

    public generateAndAdd (map: Set<number>) {
        const id = this.generate(map);

        map.add(id);

        return id;
    }

}
