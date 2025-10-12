/**
 * 全局请求队列管理器
 * 确保同时只有一个图片生成请求在进行，避免并发冲突
 */

type QueuedRequest = {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
};

class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private currentRequestId: string | null = null;

  /**
   * 添加请求到队列
   */
  async enqueue<T>(requestId: string, requestFn: () => Promise<T>): Promise<T> {
    // 如果已有相同ID的请求在队列中，拒绝新请求
    if (this.currentRequestId === requestId || this.queue.some(req => req.id === requestId)) {
      console.warn(`[RequestQueue] Duplicate request detected: ${requestId}, rejecting...`);
      throw new Error('A generation request is already in progress. Please wait for it to complete.');
    }

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        execute: requestFn,
        resolve,
        reject,
      };

      this.queue.push(queuedRequest);
      console.log(`[RequestQueue] Request queued: ${requestId}, Queue length: ${this.queue.length}`);

      // 如果没有正在处理的请求，立即开始处理
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * 处理队列中的请求
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      this.currentRequestId = request.id;

      console.log(`[RequestQueue] Processing request: ${request.id}, Remaining: ${this.queue.length}`);

      try {
        const startTime = Date.now();
        const result = await request.execute();
        const duration = Date.now() - startTime;
        
        console.log(`[RequestQueue] Request completed: ${request.id} in ${duration}ms`);
        request.resolve(result);
      } catch (error) {
        console.error(`[RequestQueue] Request failed: ${request.id}`, error);
        request.reject(error);
      } finally {
        this.currentRequestId = null;
      }
    }

    this.isProcessing = false;
    console.log('[RequestQueue] Queue empty, all requests processed');
  }

  /**
   * 取消特定请求（如果还在队列中）
   */
  cancel(requestId: string) {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const request = this.queue.splice(index, 1)[0];
      request.reject(new Error('Request cancelled'));
      console.log(`[RequestQueue] Request cancelled: ${requestId}`);
      return true;
    }
    return false;
  }

  /**
   * 清空队列
   */
  clear() {
    const cancelledCount = this.queue.length;
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    console.log(`[RequestQueue] Queue cleared, ${cancelledCount} requests cancelled`);
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentRequestId: this.currentRequestId,
      queueLength: this.queue.length,
      queuedRequests: this.queue.map(req => req.id),
    };
  }
}

// 导出单例
export const requestQueue = new RequestQueueManager();

