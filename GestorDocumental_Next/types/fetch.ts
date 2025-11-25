// export type FetchOptions = {
//   method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
//   headers?: Record<string, string>;
//   body?: Record<string, unknown> | FormData;
// };


export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  headers?: Record<string, string>
  body?: any
  cache?: RequestCache
  credentials?: RequestCredentials
}
