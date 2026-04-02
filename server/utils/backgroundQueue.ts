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
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error: any) {
          console.error("Lỗi khi xử lý công việc ngầm:", error.message);
        }
      }
    }
    
    this.isProcessing = false;
  }

  // Thêm method để ưu tiên task quan trọng (gửi QR email)
  enqueuePriority(task: Task) {
    this.queue.unshift(task); // Thêm lên đầu queue
    this.processNext();
  }
}

export const backgroundQueue = new BackgroundQueue();
