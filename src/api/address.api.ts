import type { Address } from '../models/order'
import { request } from './request'

interface AddressDto {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

function toAddress(dto: AddressDto): Address {
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phone,
    region: dto.region,
    detail: dto.detail,
    isDefault: !!dto.isDefault,
  }
}

export interface AddressInput {
  name: string
  phone: string
  region: string
  detail: string
  isDefault?: boolean
}

/** 拉取当前用户收货地址列表（带用户 token）。 */
export async function getAddresses(): Promise<Address[]> {
  const data = await request<{ list: AddressDto[] }>('/addresses')
  return (data?.list ?? []).map(toAddress)
}

/** 新增收货地址。 */
export async function createAddress(input: AddressInput): Promise<Address> {
  const data = await request<AddressDto>('/addresses', { method: 'POST', data: input })
  return toAddress(data)
}

/** 更新收货地址（可只传要改的字段）。 */
export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  const data = await request<AddressDto>(`/addresses/${id}`, { method: 'PUT', data: input })
  return toAddress(data)
}

/** 删除收货地址。 */
export function deleteAddress(id: string): Promise<unknown> {
  return request(`/addresses/${id}`, { method: 'DELETE' })
}
