
export type PersonType = {
  name: string
  age?: number
}

export type HouseholdType = {
  name: string
  people: PersonType[]
  address: AddressType
}

export type AddressType = {
  state?: string
  county?: string
}
