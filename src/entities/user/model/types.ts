export interface UserProfile {
  id: string
  email: string
  nickname: string
  image: string | null
  role: string
  defaultAddress: string | null
  latitude: number | null
  longitude: number | null
}

export interface UserAddress {
  id: string
  label: string
  address: string
  detail: string | null
  latitude: number
  longitude: number
  isDefault: boolean
}
