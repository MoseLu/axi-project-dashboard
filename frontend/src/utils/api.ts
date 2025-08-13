import { buildApiUrl } from '../config/env';

interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = buildApiUrl('');
  }

  private getAuthHeaders(isFormData: boolean = false): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};

    // 只有非 FormData 请求才设置 Content-Type
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      // 如果是401错误，清除token并重定向到登录页
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        throw new Error('认证失败，请重新登录');
      }

      // 尝试解析错误响应
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      } catch {
        // 如果无法解析为JSON，使用状态文本
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }
    }

    // 检查响应的 Content-Type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // 如果不是 JSON，尝试解析为文本
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        // 如果解析失败，记录错误并返回一个默认的成功响应
        console.warn('响应不是有效的JSON格式:', text.substring(0, 100));
        return { success: true, data: text };
      }
    }
  }

  async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;

    const url = `${this.baseURL}${endpoint}`;
    
    // 检查是否是 FormData 请求
    const isFormData = fetchOptions.body instanceof FormData;
    
    // 如果是 FormData，不设置默认的 Content-Type
    const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
    const authHeaders = requireAuth ? this.getAuthHeaders(isFormData) : defaultHeaders;

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...authHeaders,
        ...fetchOptions.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // GET请求
  async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST请求
  async post<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const requestOptions: ApiRequestOptions = {
      ...options,
      method: 'POST',
    };

    // 如果是 FormData，不要 JSON.stringify
    if (data instanceof FormData) {
      requestOptions.body = data;
      // 移除 Content-Type，让浏览器自动设置 multipart boundary
      if (requestOptions.headers) {
        delete requestOptions.headers['Content-Type'];
      }
    } else {
      requestOptions.body = data ? JSON.stringify(data) : undefined;
    }

    return this.request<T>(endpoint, requestOptions);
  }

  // PUT请求
  async put<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // PATCH请求
  async patch<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient();

// 导出便捷方法
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
};

export default apiClient;
