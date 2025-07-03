export class AsyncQueue {
    private pending = 0;
    private queue: Array<() => void> = [];
    private concurrency: number;

    constructor(concurrency: number) {
        this.concurrency = concurrency;
    }

    public async run<T>(task: () => Promise<T>): Promise<T> {
        if (this.pending >= this.concurrency) {
            await new Promise<void>(resolve => this.queue.push(resolve));
        }
        this.pending++;
        try {
            return await task();
        } catch (error) {
            console.error(`Error executing task:`, error);
            return 0 as unknown as T; // Return 0 on error, can be changed to another value if needed
        } finally {
            this.pending--;
            const next = this.queue.shift();
            next?.();
        }
    }
}
