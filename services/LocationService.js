export const STUDY_BREAK_LOCATIONS = [
  {
    id: 'fisher-library',
    name: 'Fisher Library',
    category: 'Library',
    address: 'Eastern Ave, Camperdown NSW 2006',
    distance: '0.1km',
    rating: 4.6,
    hours: 'Open · Closes 10 PM',
    tags: ['Quiet', 'Study', 'Free WiFi', 'Air-conditioned'],
    urgency: 'Low',
    urgencyLabel: 'Scheduled',
    costEstimate: 'Free',
    costDetail: 'No cost · USYD student access',
    aiMatch: 94,
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80',
    aiSummary:
      '"Study Break" vibe detected from low sleep data. Fisher Library offers a calm, structured environment ideal for light cognitive restoration without physical strain.',
  },
  {
    id: 'victoria-park-cafe',
    name: 'Victoria Park Café',
    category: 'Café · Study',
    address: 'Parramatta Rd, Camperdown NSW 2050',
    distance: '0.4km',
    rating: 4.4,
    hours: 'Open · Closes 5 PM',
    tags: ['Outdoor', 'Café', 'WiFi', 'Low noise'],
    urgency: 'Low',
    urgencyLabel: 'Preventive',
    costEstimate: '$4–8',
    costDetail: 'Coffee or snack · Student discount available',
    aiMatch: 87,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    aiSummary:
      'A short walk for fresh air combined with a café environment boosts alertness without raising cortisol — ideal for low-sleep days.',
  },
  {
    id: 'usyd-gardens',
    name: 'USYD Eastern Ave Gardens',
    category: 'Park · Nature',
    address: 'Eastern Ave, University of Sydney',
    distance: '0.2km',
    rating: 4.7,
    hours: 'Open 24 hrs',
    tags: ['Nature', 'Walk', 'Free', 'Quiet'],
    urgency: 'Low',
    urgencyLabel: 'Scheduled',
    costEstimate: 'Free',
    costDetail: 'No cost · Public access',
    aiMatch: 82,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    aiSummary:
      'Outdoor green spaces reduce cortisol by ~21% in 20-minute exposures. Low physical demand matches your current step count profile.',
  },
];

export function getTopMatch() {
  return STUDY_BREAK_LOCATIONS[0];
}

export function getLocationById(id) {
  return STUDY_BREAK_LOCATIONS.find((l) => l.id === id) ?? null;
}
