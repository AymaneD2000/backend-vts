// The transactional services that share the matching/pricing infrastructure.
// (See architecture doc: courses_livraisons.type_service.)
export enum ServiceType {
  RIDE_CAR = 'ride_car',
  MOTO = 'moto',
  PARCEL = 'parcel',
  // A store/restaurant delivery: driver picks up at the shop and drops at the
  // customer. Flows through the same dispatch pipeline as a ride.
  MERCHANT_DELIVERY = 'merchant_delivery',
}
