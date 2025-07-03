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
            console.error(`Ошибка при выполнении задачи:`, error);
            return 0 as unknown as T; // Возвращаем 0 в случае ошибки, можно изменить на другое значение по необходимости
        } finally {
            this.pending--;
            const next = this.queue.shift();
            next?.();
        }
    }
}
