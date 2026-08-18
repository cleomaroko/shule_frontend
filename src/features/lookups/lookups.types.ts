/** Named lookup rows used by titles, genders, banks, counties, etc. */
export interface NamedLookup {
  id: number
  name: string
}

export interface Campus {
  id: number
  name: string
  location?: string | null
}

export interface Department {
  id: number
  name: string
}

export interface SchoolClassOption {
  id: number
  section: string | null
  className: string | null
  streams?: Array<{ id: number; name: string }> | null
}

export interface StreamOption {
  id: number
  name: string
}

export interface HouseOption {
  id: number
  houseName: string
}

export interface ZoneOption {
  id: number
  zoneName: string
}
