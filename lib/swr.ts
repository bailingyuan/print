import useSWROriginal from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useSWR<T>(url: string, config?: any) {
  return useSWROriginal<T>(url, fetcher, config)
}
