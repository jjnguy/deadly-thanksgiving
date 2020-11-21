
export type PersonType = {
  name: string
  age?: number
}

export type HouseholdType = {
  size: number
  address: AddressType
}

export type AddressType = {
  state?: string
  county?: string
}
