type Task = () => Promise<void>;
class BackgroundQueue {
  private queue: Task[] = [];
  private isProcessing = false;
  enqueue(task: Task) {
    this.queue.push(task);
    this.processNext();
  }
  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Lỗi khi xử lý công việc ngầm:", error);
      }
    }
    this.isProcessing = false;
    setTimeout(() => this.processNext(), 500);
  }
}
export const backgroundQueue = new BackgroundQueue();
