
export type PersonType = {
  name: string
  age?: number
}

export type HouseholdType = {
  size: number
  address: AddressType
  name?: string
}

export type AddressType = {
  state?: string
  county?: string
}
