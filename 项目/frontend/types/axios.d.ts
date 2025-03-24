import { AxiosInstance } from 'axios'

declare module 'axios' {
  interface AxiosInstance {
    get<T>(url: string, config?: any): Promise<T>
    post<T>(url: string, data?: any, config?: any): Promise<T>
    put<T>(url: string, data?: any, config?: any): Promise<T>
    del<T>(url: string, config?: any): Promise<T>
    downloadFile(url: string, data?: any): Promise<any>
  }
} 