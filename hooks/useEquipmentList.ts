// hooks/useEquipmentList.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useEquipmentList(
  page: number = 0,
  includeDelivered: boolean = false,
  status?: string,
  serviceType?: string
) {
  let url = `/api/equipment?page=${page}&include_delivered=${includeDelivered}`
  if (status) url += `&status=${encodeURIComponent(status)}`
  if (serviceType) url += `&service_type=${encodeURIComponent(serviceType)}`

  const { data, error, mutate, isLoading } = useSWR(url, fetcher)

  return {
    equipments: data?.data?.equipments || [],
    total: data?.data?.total || 0,
    totalPages: data?.data?.total_pages || 0,
    isLoading,
    isError: error || (data && !data.success),
    errorMsg: data?.error,
    mutate,
  }
}

export function useDashboardStats() {
  const { data, error, mutate, isLoading } = useSWR('/api/stats', fetcher)

  return {
    stats: data?.data || null,
    isLoading,
    isError: error || (data && !data.success),
    errorMsg: data?.error,
    mutate,
  }
}

export function useEquipmentSearch(query: string) {
  const shouldFetch = query && query.trim().length >= 2
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/equipment/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  )

  return {
    results: data?.data?.results || [],
    total: data?.data?.total || 0,
    isLoading: shouldFetch ? isLoading : false,
    isError: error || (data && !data.success),
    errorMsg: data?.error,
  }
}

export function useEquipmentDetail(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/equipment/${id}/details` : null,
    fetcher
  )

  return {
    equipment: data?.data?.equipment || null,
    history: data?.data?.history || [],
    nextStates: data?.data?.next_states || [],
    canAdvance: !!data?.data?.can_advance,
    isLoading,
    isError: error || (data && !data.success),
    errorMsg: data?.error,
    mutate,
  }
}
