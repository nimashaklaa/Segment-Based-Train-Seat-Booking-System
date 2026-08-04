export const TRAIN_NAMES: Record<string, string> = {
  '1005': 'Udarata Menike',
  '1015': 'Podi Menike',
  '1007': 'Night Mail',
}

export const COACH_TYPES = [
  {
    id: 'cccccccc-0000-0000-0000-000000000001',
    label: 'First Class',
    description: 'Reserved · Air-conditioned · Reclining seats',
    fareMultiplier: 1.8,
    badge: '1st',
    color: 'amber',
    unreserved: false,
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000002',
    label: 'Second Class',
    description: 'Reserved · Cushioned seats · Fan-cooled',
    fareMultiplier: 1.2,
    badge: '2nd',
    color: 'blue',
    unreserved: false,
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000003',
    label: 'Third Class',
    description: 'Unreserved · Standard seating',
    fareMultiplier: 1.0,
    badge: '3rd',
    color: 'gray',
    unreserved: true,
  },
]