import { PlaceType } from './types';

export const PLACE_TYPES: PlaceType[] = [
  'EVENT',
  'RESTAURANT',
  'CAFE',
  'PARK',
  'SHOP',
  'HOTEL',
  'UNIVERSITY',
  'HOSPITAL',
  'OTHER',
];

export const TYPE_LABELS: Record<PlaceType, string> = {
  EVENT: 'Event',
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  PARK: 'Park',
  SHOP: 'Shop',
  HOTEL: 'Hotel',
  UNIVERSITY: 'University',
  HOSPITAL: 'Hospital',
  OTHER: 'Other',
};
