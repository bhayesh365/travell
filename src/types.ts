/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleCapacity = 
  | '7' 
  | '10' 
  | '12' 
  | '14' 
  | '17' 
  | '20' 
  | '25' 
  | '40' 
  | '56';

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyPhone: string;
  name: string;
  capacity: VehicleCapacity; // 7, 10, 12, 14, 17, 20, 25, 40, 56 Seater
  city: string;
  pricePerKm: number; // expected price per km
  isAc: boolean;
  photoUrl: string;
  vehicleImages?: string[]; // array of uploaded vehicle images (base64 or urls)
  condition: string; // "Excellent", "Very Good", "Good", etc.
  details: string; // vehicle description, model year, facilities
  rating: number;
  reviews: Review[];
  isAvailable: boolean;
}

export interface TripCosts {
  driverStay: number;
  meals: number;
  tolls: number;
  otherCharges: number;
  explanation: string;
}

export interface Inquiry {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCapacity: VehicleCapacity;
  agencyId: string;
  agencyName: string;
  
  // Trip details
  fromCity: string;
  toCity: string;
  startDate: string;
  endDate: string;
  placesToCover: string[]; // places to cover during journey
  isAc: boolean; // preference
  tripType: 'round-trip' | 'one-way';
  durationDays: number;
  numPassengers: number;
  remarks: string;
  
  // Passenger info for booking
  passengerList: { name: string; age: number; gender: string }[];
  
  status: 'pending' | 'accepted' | 'declined' | 'confirmed';
  createdAt: string;
  quotedAt?: string;
  
  // Finalized pricing components added by Travel Agency during chat
  customPricePerKm?: number;
  tripCosts?: TripCosts;
  estimatedTotalDistanceKm?: number;
  finalTotalQuote?: number;
}

export interface Message {
  id: string;
  inquiryId: string;
  senderId: string; // user id or agency id or 'system' or 'google-gemini'
  senderName: string;
  senderType: 'customer' | 'agency' | 'ai';
  content: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  inquiryId: string;
  customerId: string;
  customerName: string;
  agencyId: string;
  agencyName: string;
  vehicleId: string;
  vehicleName: string;
  amountPaid: number;
  paymentReceiptNo: string;
  bookedAt: string;
  tripDetails: {
    fromCity: string;
    toCity: string;
    startDate: string;
    endDate: string;
    tripType: string;
    durationDays: number;
  };
  passengerList: { name: string; age: number; gender: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agency';
  password?: string;
  // Agency specifics
  phone?: string;
  city?: string;
  description?: string;
  address?: string;
}

export interface TourPackage {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyPhone: string;
  title: string;
  fromCity: string;
  toCity: string;
  stops: string[];
  hotelName: string;
  hotelRating: string;
  hotelImages?: string[]; // array of hotel images
  vehicleName: string;
  vehicleCapacity: VehicleCapacity;
  vehicleImages?: string[]; // array of vehicle images
  inclusions: {
    hotel: boolean;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  pricePerPerson: number;
  durationDays: number;
  description: string;
  photoUrl: string;
  isAvailable: boolean;
  createdAt: string;
}

