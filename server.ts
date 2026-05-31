/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import { Vehicle, Inquiry, Message, Booking, UserProfile, Review, TourPackage } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- IN-MEMORY DATABASE ---
  let users: UserProfile[] = [
    {
      id: 'cust-1',
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      role: 'customer',
      password: 'password'
    },
    {
      id: 'cust-2',
      name: 'Pooja Patel',
      email: 'pooja@example.com',
      role: 'customer',
      password: 'password'
    },
    {
      id: 'agency-surat',
      name: 'Surat Royal Travels',
      email: 'surat.travels@example.com',
      role: 'agency',
      password: 'password',
      phone: '+91 98250 12345',
      city: 'Surat',
      description: 'Surat\'s leading fleet provider for family tours, wedding trips, and group travels. Premium tempo travellers and comfortable sleeper buses available at best rates.',
      address: 'Shop 22, Ring Road Textile Market, Surat, Gujarat'
    },
    {
      id: 'agency-delhi',
      name: 'Delhi Heritage Voyagers',
      email: 'delhi.voyagers@example.com',
      role: 'agency',
      password: 'password',
      phone: '+91 99110 54321',
      city: 'Delhi',
      description: 'Professional commercial vehicle providers in Delhi NCR. Offering safe, AC elite travel coaches and luxury cruisers driven by verified of experienced drivers.',
      address: '45, Connaught Circus, New Delhi NCR'
    },
    {
      id: 'agency-goa',
      name: 'Goa Coastal Leisure Cab',
      email: 'goa.leisure@example.com',
      role: 'agency',
      password: 'password',
      phone: '+91 90123 90123',
      city: 'Goa',
      description: 'Your premium local logistics partner in Goa. Best rates for sightseeing, hotel transfers, and corporate picnics in premium traveller buses.',
      address: 'Marina Boulevard, Panaji, Goa'
    }
  ];

  let vehicles: Vehicle[] = [
    {
      id: 'veh-surat-1',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      agencyPhone: '+91 98250 12345',
      name: 'Premium Force Traveller (Premium Comfort)',
      capacity: '12',
      city: 'Surat',
      pricePerKm: 18,
      isAc: true,
      photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      condition: 'Excellent - Model 2024',
      details: 'Pushback luxury leather seats, ample boot storage, LED TV entertainment system, charging ports at each seat, ambient lighting, and dual AC vents.',
      rating: 4.8,
      reviews: [
        { id: 'rev-1', customerName: 'Arvind Mehta', rating: 5, comment: 'Very clean vehicle, driver was extremely polite and route map selection was great!', createdAt: '2026-05-12T14:30:00Z' },
        { id: 'rev-2', customerName: 'Nisha Shah', rating: 4, comment: 'AC cooling was wonderful, seating was extremely spacious for our group of 11.', createdAt: '2026-05-20T10:15:00Z' }
      ],
      isAvailable: true
    },
    {
      id: 'veh-surat-2',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      agencyPhone: '+91 98250 12345',
      name: 'Mahindra Marazzo Tourist Coach',
      capacity: '7',
      city: 'Surat',
      pricePerKm: 14,
      isAc: true,
      photoUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800',
      condition: 'Very Good - Clean interiors',
      details: 'Perfect for small family gatherings. Roof mounted AC, supreme boot space, Bluetooth audio system.',
      rating: 4.5,
      reviews: [
        { id: 'rev-3', customerName: 'Bhavin Savani', rating: 4.5, comment: 'Good choice for a quick round trip to Baroda.', createdAt: '2026-04-28T09:00:00Z' }
      ],
      isAvailable: true
    },
    {
      id: 'veh-surat-3',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      agencyPhone: '+91 98250 12345',
      name: 'Tata Marcopolo Group Bus',
      capacity: '25',
      city: 'Surat',
      pricePerKm: 32,
      isAc: false,
      photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800',
      condition: 'Good - Model 2022',
      details: 'Commercial Non-AC bus suitable for large marriage functions or employee transit. Pushback seats, high deck luggage carrier.',
      rating: 4.1,
      reviews: [],
      isAvailable: true
    },
    {
      id: 'veh-delhi-1',
      agencyId: 'agency-delhi',
      agencyName: 'Delhi Heritage Voyagers',
      agencyPhone: '+91 99110 54321',
      name: 'Executive Tempo Cruiser XL',
      capacity: '17',
      city: 'Delhi',
      pricePerKm: 24,
      isAc: true,
      photoUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&q=80&w=800',
      condition: 'Excellent - Model 2025',
      details: 'Super luxury setup with individual business class recliner seats, premium sound system, mini fridge, ambient twilight roof panels, GPS-equipped tracking.',
      rating: 4.9,
      reviews: [
        { id: 'rev-4', customerName: 'Gaurav Singhal', rating: 5, comment: 'Fantastic premium vehicle. Booked for Delhi to Manali, trip was exceptionally smooth.', createdAt: '2026-05-18T18:40:00Z' }
      ],
      isAvailable: true
    },
    {
      id: 'veh-delhi-2',
      agencyId: 'agency-delhi',
      agencyName: 'Delhi Heritage Voyagers',
      agencyPhone: '+91 99110 54321',
      name: 'Volvo Multi-Axle Elite Coach',
      capacity: '56',
      city: 'Delhi',
      pricePerKm: 65,
      isAc: true,
      photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      condition: 'Excellent - Regular Servicing',
      details: 'Ultra grand tourist coach. Air-suspended chassis, fully equipped washroom onboard, emergency exits, separate large luggage vaults, TV panels, semi-sleeper seats.',
      rating: 4.7,
      reviews: [
        { id: 'rev-5', customerName: 'Sanjay Aggarwal', rating: 5, comment: 'We booked this coach for corporate retreat of 50 team members. Excellent experience.', createdAt: '2026-05-10T11:00:00Z' }
      ],
      isAvailable: true
    },
    {
      id: 'veh-delhi-3',
      agencyId: 'agency-delhi',
      agencyName: 'Delhi Heritage Voyagers',
      agencyPhone: '+91 99110 54321',
      name: 'Urban Transit Coach (Semi-luxury)',
      capacity: '40',
      city: 'Delhi',
      pricePerKm: 42,
      isAc: true,
      photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800',
      condition: 'Very Good - Cleaned Daily',
      details: 'Comfortable air conditioned semi-sleeper bus. Great for city excursions or industrial sight visits. Standard audio player, charging hubs.',
      rating: 4.4,
      reviews: [],
      isAvailable: true
    },
    {
      id: 'veh-goa-1',
      agencyId: 'agency-goa',
      agencyName: 'Goa Coastal Leisure Cab',
      agencyPhone: '+91 90123 90123',
      name: 'Elite Cruiser Coach',
      capacity: '14',
      city: 'Goa',
      pricePerKm: 22,
      isAc: true,
      photoUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800',
      condition: 'Excellent - Model 2024',
      details: 'Airy large glass windows for ultimate sunset and coastal drives, high capacity cooling, premium audio system with subwoofer, cup holders.',
      rating: 4.6,
      reviews: [
        { id: 'rev-6', customerName: 'Priscilla Dsouza', rating: 4.5, comment: 'Wonderful drive around South Goa. Excellent driver who knew all hidden beaches.', createdAt: '2026-05-02T16:00:00Z' }
      ],
      isAvailable: true
    },
    {
      id: 'veh-goa-2',
      agencyId: 'agency-goa',
      agencyName: 'Goa Coastal Leisure Cab',
      agencyPhone: '+91 90123 90123',
      name: 'Urban Commuter Tempo',
      capacity: '10',
      city: 'Goa',
      pricePerKm: 18,
      isAc: false,
      photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      condition: 'Good - Model 2021',
      details: 'Standard Non-AC tempo traveller with pushback seats. Highly economical for beach hopping groups.',
      rating: 4.2,
      reviews: [],
      isAvailable: true
    }
  ];

  let inquiries: Inquiry[] = [
    {
      id: 'inq-seed-1',
      customerId: 'cust-1',
      customerName: 'Rohan Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'rohan@example.com',
      vehicleId: 'veh-surat-1',
      vehicleName: 'Premium Force Traveller (Premium Comfort)',
      vehicleCapacity: '12',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      fromCity: 'Surat',
      toCity: 'Delhi',
      startDate: '2026-05-15',
      endDate: '2026-05-20',
      placesToCover: ['Surat', 'Udaipur', 'Jaipur', 'Delhi'],
      isAc: true,
      tripType: 'round-trip',
      durationDays: 5,
      numPassengers: 11,
      remarks: 'Family trip.',
      passengerList: [{ name: 'Bhaumik', age: 32, gender: 'male' }],
      status: 'confirmed',
      createdAt: '2026-05-10T10:00:00Z',
      customPricePerKm: 18,
      estimatedTotalDistanceKm: 800,
      finalTotalQuote: 18800,
      tripCosts: {
        driverStay: 2000,
        meals: 1000,
        tolls: 1400,
        otherCharges: 0,
        explanation: 'Seed booking'
      }
    },
    {
      id: 'inq-seed-2',
      customerId: 'cust-2',
      customerName: 'Pooja Patel',
      customerPhone: '+91 99111 22222',
      customerEmail: 'pooja@example.com',
      vehicleId: 'veh-surat-2',
      vehicleName: 'Mahindra Marazzo Tourist Coach',
      vehicleCapacity: '7',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      fromCity: 'Surat',
      toCity: 'Mumbai',
      startDate: '2026-05-26',
      endDate: '2026-05-28',
      placesToCover: ['Surat', 'Mumbai'],
      isAc: true,
      tripType: 'round-trip',
      durationDays: 2,
      numPassengers: 6,
      remarks: 'Shopping trip',
      passengerList: [{ name: 'Pooja Patel', age: 28, gender: 'female' }],
      status: 'confirmed',
      createdAt: '2026-05-24T12:00:00Z',
      customPricePerKm: 14,
      estimatedTotalDistanceKm: 500,
      finalTotalQuote: 8400,
      tripCosts: {
        driverStay: 500,
        meals: 500,
        tolls: 400,
        otherCharges: 0,
        explanation: 'Seed booking'
      }
    },
    {
      id: 'inq-seed-3',
      customerId: 'cust-2',
      customerName: 'Pooja Patel',
      customerPhone: '+91 99111 22222',
      customerEmail: 'pooja@example.com',
      vehicleId: 'veh-surat-1',
      vehicleName: 'Premium Force Traveller (Premium Comfort)',
      vehicleCapacity: '12',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      fromCity: 'Surat',
      toCity: 'Jaipur',
      startDate: '2026-05-14',
      endDate: '2026-05-18',
      placesToCover: ['Surat', 'Jaipur'],
      isAc: true,
      tripType: 'round-trip',
      durationDays: 4,
      numPassengers: 10,
      remarks: 'Fort viewing',
      passengerList: [{ name: 'Nikhil Patel', age: 30, gender: 'male' }],
      status: 'confirmed',
      createdAt: '2026-05-11T12:00:00Z',
      customPricePerKm: 18,
      estimatedTotalDistanceKm: 1100,
      finalTotalQuote: 24500,
      tripCosts: {
        driverStay: 1500,
        meals: 1000,
        tolls: 2200,
        otherCharges: 0,
        explanation: 'Seed booking'
      }
    },
    {
      id: 'inq-seed-4',
      customerId: 'cust-1',
      customerName: 'Rohan Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'rohan@example.com',
      vehicleId: 'veh-surat-3',
      vehicleName: 'Tata Marcopolo Group Bus',
      vehicleCapacity: '25',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      fromCity: 'Surat',
      toCity: 'Diu',
      startDate: '2026-05-06',
      endDate: '2026-05-09',
      placesToCover: ['Surat', 'Diu'],
      isAc: false,
      tripType: 'round-trip',
      durationDays: 3,
      numPassengers: 22,
      remarks: 'Corporate picnic',
      passengerList: [{ name: 'Yash', age: 31, gender: 'male' }],
      status: 'confirmed',
      createdAt: '2026-05-04T12:00:00Z',
      customPricePerKm: 32,
      estimatedTotalDistanceKm: 1200,
      finalTotalQuote: 45000,
      tripCosts: {
        driverStay: 3000,
        meals: 1500,
        tolls: 2100,
        otherCharges: 0,
        explanation: 'Seed booking'
      }
    },
    {
      id: 'inq-1',
      customerId: 'cust-1',
      customerName: 'Rohan Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'rohan@example.com',
      vehicleId: 'veh-surat-1',
      vehicleName: 'Premium Force Traveller (Premium Comfort)',
      vehicleCapacity: '12',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      fromCity: 'Surat',
      toCity: 'Delhi',
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      placesToCover: ['Surat', 'Udaipur', 'Jaipur', 'Delhi'],
      isAc: true,
      tripType: 'one-way',
      durationDays: 7,
      numPassengers: 11,
      remarks: 'We are reaching by train in Surat but then want to travel all the way up to Delhi checking majestic forts enroute. Need safe driver.',
      passengerList: [],
      status: 'pending',
      createdAt: '2026-05-28T12:00:00Z'
    }
  ];

  let messages: Message[] = [
    {
      id: 'msg-1',
      inquiryId: 'inq-1',
      senderId: 'cust-1',
      senderName: 'Rohan Sharma',
      senderType: 'customer',
      content: 'Hello, we made an inquiry on your 12 seater. We plan to travel from Surat to Udaipur, Jaipur and then drop off in Delhi. Can you please confirm final approximate charges and whether we require paying for driver overnight board?',
      createdAt: '2026-05-28T12:05:00Z'
    }
  ];

  let bookings: Booking[] = [
    {
      id: 'book-seed-1',
      inquiryId: 'inq-seed-1',
      customerId: 'cust-1',
      customerName: 'Rohan Sharma',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      vehicleId: 'veh-surat-1',
      vehicleName: 'Premium Force Traveller (Premium Comfort)',
      amountPaid: 18800,
      paymentReceiptNo: 'TXN-993710484',
      bookedAt: '2026-05-29T10:00:00Z',
      tripDetails: {
        fromCity: 'Surat',
        toCity: 'Delhi',
        startDate: '2026-05-15',
        endDate: '2026-05-20',
        tripType: 'round-trip',
        durationDays: 5
      },
      passengerList: [{ name: 'Bhaumik', age: 32, gender: 'male' }]
    },
    {
      id: 'book-seed-2',
      inquiryId: 'inq-seed-2',
      customerId: 'cust-2',
      customerName: 'Pooja Patel',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      vehicleId: 'veh-surat-2',
      vehicleName: 'Mahindra Marazzo Tourist Coach',
      amountPaid: 8400,
      paymentReceiptNo: 'TXN-485294021',
      bookedAt: '2026-05-25T14:30:00Z',
      tripDetails: {
        fromCity: 'Surat',
        toCity: 'Mumbai',
        startDate: '2026-05-26',
        endDate: '2026-05-28',
        tripType: 'round-trip',
        durationDays: 2
      },
      passengerList: [{ name: 'Pooja Patel', age: 28, gender: 'female' }]
    },
    {
      id: 'book-seed-3',
      inquiryId: 'inq-seed-3',
      customerId: 'cust-2',
      customerName: 'Pooja Patel',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      vehicleId: 'veh-surat-1',
      vehicleName: 'Premium Force Traveller (Premium Comfort)',
      amountPaid: 24500,
      paymentReceiptNo: 'TXN-103859203',
      bookedAt: '2026-05-12T11:00:00Z',
      tripDetails: {
        fromCity: 'Surat',
        toCity: 'Jaipur',
        startDate: '2026-05-14',
        endDate: '2026-05-18',
        tripType: 'round-trip',
        durationDays: 4
      },
      passengerList: [{ name: 'Nikhil Patel', age: 30, gender: 'male' }]
    },
    {
      id: 'book-seed-4',
      inquiryId: 'inq-seed-4',
      customerId: 'cust-1',
      customerName: 'Rohan Sharma',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      vehicleId: 'veh-surat-3',
      vehicleName: 'Tata Marcopolo Group Bus',
      amountPaid: 45000,
      paymentReceiptNo: 'TXN-283948572',
      bookedAt: '2026-05-05T09:00:00Z',
      tripDetails: {
        fromCity: 'Surat',
        toCity: 'Diu',
        startDate: '2026-05-06',
        endDate: '2026-05-09',
        tripType: 'round-trip',
        durationDays: 3
      },
      passengerList: [{ name: 'Yash', age: 31, gender: 'male' }]
    },
    {
      id: 'book-seed-5',
      inquiryId: 'inq-seed-5',
      customerId: 'cust-2',
      customerName: 'Pooja Patel',
      agencyId: 'agency-delhi',
      agencyName: 'Delhi Heritage Voyagers',
      vehicleId: 'veh-delhi-1',
      vehicleName: 'Executive Tempo Cruiser XL',
      amountPaid: 16500,
      paymentReceiptNo: 'TXN-385028471',
      bookedAt: '2026-05-20T16:20:00Z',
      tripDetails: {
        fromCity: 'Delhi',
        toCity: 'Manali',
        startDate: '2026-05-21',
        endDate: '2026-05-24',
        tripType: 'one-way',
        durationDays: 3
      },
      passengerList: [{ name: 'Aarav', age: 24, gender: 'male' }]
    }
  ];

  let tourPackages: TourPackage[] = [
    {
      id: 'pkg-surat-dwarka',
      agencyId: 'agency-surat',
      agencyName: 'Surat Royal Travels',
      agencyPhone: '+91 98250 12345',
      title: 'Surat to Dwarka Pilgrimage Package',
      fromCity: 'Surat',
      toCity: 'Dwarka',
      stops: ['Somnath Mandir', 'Girnar Hills (Junagadh)', 'Nageshwar Jyotirlinga', 'Sudama Setu', 'Bet Dwarka'],
      hotelName: 'Hotel Grand Dwarka & Somnath Sagar Resort',
      hotelRating: '3-Star Premium Deluxe',
      inclusions: {
        hotel: true,
        breakfast: true,
        lunch: true,
        dinner: true
      },
      vehicleName: 'Premium Force Traveller (AC Comfort Coach)',
      vehicleCapacity: '12',
      pricePerPerson: 9500,
      durationDays: 6,
      description: 'An all-inclusive spiritual odyssey from Surat to Dwarka of Gujarat. Embark in our ultra-luxurious AC Force Traveller. Stays are scheduled at verified, hygienic premium multi-star hotels. Enjoy unlimited authentic Kathiyawadi & Gujarati meals (Breakfast, Lunch & Dinner) as part of your booking. Perfect for family pilgrimages!',
      photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      isAvailable: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'pkg-delhi-manali',
      agencyId: 'agency-delhi',
      agencyName: 'Delhi Heritage Voyagers',
      agencyPhone: '+91 99110 54321',
      title: 'Delhi to Manali Snow Valley Getaway',
      fromCity: 'Delhi',
      toCity: 'Manali',
      stops: ['Kullu Valley', 'Solang Valley', 'Hadimba Temple', 'Jogini Waterfalls'],
      hotelName: 'Snow Valley Resorts Manali',
      hotelRating: '4-Star Luxury Alpine Resort',
      inclusions: {
        hotel: true,
        breakfast: true,
        lunch: false,
        dinner: true
      },
      vehicleName: 'Executive Tempo Cruiser XL (Super Luxury)',
      vehicleCapacity: '17',
      pricePerPerson: 11200,
      durationDays: 4,
      description: 'Chasing the crisp clean air of the majestic Himalayas? This premium curated tour package covers your transit in our top-of-the-line business class Tempo Cruiser. Premium valley-view 4-Star hotel bookings, piping hot buffet breakfasts and gorgeous candlelight dinners are fully paid for in this pricing.',
      photoUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&q=80&w=800',
      isAvailable: true,
      createdAt: new Date().toISOString()
    }
  ];

  // --- GEMINI INITIALIZATION ---
  let ai: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return null;
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return ai;
  }

  // --- API ROUTING ---

  // OTP In-Memory Storage
  interface PendingOtp {
    otp: string;
    expiresAt: number;
  }
  const pendingOtps = new Map<string, PendingOtp>();
  const INTERNAL_AUTH_ERROR = 'Internal server error. Please try again.';

  const sendAuthError = (res: express.Response, statusCode: number, error: string) => {
    if (!res.headersSent) {
      res.status(statusCode).json({ error });
    }
  };

  const handleAuthUnexpectedError = (res: express.Response, endpoint: string, error: unknown) => {
    console.error(`[Auth ${endpoint}] Unexpected error:`, error);
    sendAuthError(res, 500, INTERNAL_AUTH_ERROR);
  };

  // Send Registration Verification OTP
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email } = req.body ?? {};
      if (typeof email !== 'string' || !email.trim()) {
        sendAuthError(res, 400, 'Email address is required');
        return;
      }

      // Generate a secure 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      const normalizedEmail = email.toLowerCase().trim();

      pendingOtps.set(normalizedEmail, { otp, expiresAt });

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      let smtpFrom = process.env.SMTP_FROM_EMAIL || 'no-reply@prvasiq.com';

      // Auto-detect and fix Resend-specific sender domain restrictions to ensure success
      const isResend = (smtpHost && smtpHost.toLowerCase().includes('resend')) || 
                      (smtpUser && smtpUser.toLowerCase() === 'resend');
      
      if (isResend) {
        const isPublicOrPlaceholder = !process.env.SMTP_FROM_EMAIL || 
                          smtpFrom.toLowerCase().endsWith('@gmail.com') || 
                          smtpFrom.toLowerCase().endsWith('@yahoo.com') || 
                          smtpFrom.toLowerCase().endsWith('@outlook.com') || 
                          smtpFrom.toLowerCase().endsWith('@hotmail.com') || 
                          smtpFrom.toLowerCase().endsWith('prvasiq.com'); // default fallback is unverified
        
        if (isPublicOrPlaceholder) {
          // Enforce Resend's default onboarding sender to guarantee successful mail dispatch of free tier
          smtpFrom = 'onboarding@resend.dev';
        }
      }

      let emailSent = false;
      let emailError = '';

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        try {
          const smtpPortNumber = Number.parseInt(smtpPort, 10);
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPortNumber,
            secure: smtpPortNumber === 465, // true for 465, false for others
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          const mailOptions = {
            from: `"PRVASIQ Travel" <${smtpFrom}>`,
            to: email,
            subject: 'PRVASIQ - Your 6-Digit Email Verification Code',
            text: `Hello,\n\nYour one-time password (OTP) to verify your account with PRVASIQ is: ${otp}\n\nThis code will expire in 10 minutes.\n\nWarm regards,\nPRVASIQ Travel Team`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0f172a; margin: 0; font-size: 24px; letter-spacing: -0.5px;">PRVASIQ</h1>
                <p style="color: #f97316; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0;">Travel Marketplace & Dispatch</p>
              </div>
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hello,</p>
                <p style="color: #334155; font-size: 14px; line-height: 1.5;">Thank you for registering with PRVASIQ. To complete your account registration, please enter the following 6-digit verification code below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <span style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; color: #0d9488; font-size: 32px; font-weight: bold; font-family: monospace; padding: 12px 30px; border-radius: 8px; letter-spacing: 6px;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This verification code is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
              </div>
              <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} PRVASIQ. All rights reserved.</p>
                <p style="color: #94a3b8; font-size: 10px; margin: 4px 0 0 0;">Verified Carrier Operations & Real-Time Fleet Dispatch Portal</p>
              </div>
            </div>
          `,
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
        } catch (err: unknown) {
          console.error('SMTP sending error:', err);
          emailError = err instanceof Error ? err.message : 'SMTP Configuration Error';
        }
      }

      if (emailSent) {
        res.json({ success: true, email, simulated: false });
      } else {
        console.log(`[PRVASIQ OTP Simulator] Code generated for ${email}: ${otp}`);
        res.json({
          success: true,
          email,
          simulated: true,
          sandboxOtp: otp,
          errorInfo: emailError ? `SMTP inactive (${emailError}). Entered sandbox simulation mode.` : "Entered sandbox simulation mode."
        });
      }
    } catch (error) {
      handleAuthUnexpectedError(res, '/api/auth/send-otp', error);
    }
  });

  // Auth Registration with OTP
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, role, password, otp, phone, city, description, address } = req.body ?? {};
      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof role !== 'string' ||
        typeof password !== 'string' ||
        typeof otp !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !role.trim() ||
        !password.trim() ||
        !otp.trim()
      ) {
        sendAuthError(res, 400, 'Name, email, password, role and OTP are required');
        return;
      }
      if (password.length < 4) {
        sendAuthError(res, 400, 'Password must be at least 4 characters long');
        return;
      }

      // Verify OTP
      const emailKey = email.toLowerCase().trim();
      const recordedOtp = pendingOtps.get(emailKey);
      if (!recordedOtp) {
        sendAuthError(res, 400, 'No active OTP verification session found for this email. Please request an OTP code.');
        return;
      }
      if (recordedOtp.expiresAt < Date.now()) {
        pendingOtps.delete(emailKey);
        sendAuthError(res, 400, 'OTP code has expired. Please secure a new OTP code.');
        return;
      }
      if (recordedOtp.otp !== otp.trim()) {
        sendAuthError(res, 400, 'The 6-digit OTP you entered is invalid. Please verify and try again.');
        return;
      }

      // OTP match verified!
      pendingOtps.delete(emailKey);

      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        sendAuthError(res, 400, 'User with this email already exists');
        return;
      }
      const newId = role === 'agency' ? `agency-${Date.now()}` : `cust-${Date.now()}`;
      const newUser: UserProfile = {
        id: newId,
        name,
        email,
        role,
        password,
        phone,
        city,
        description,
        address
      };
      users.push(newUser);
      res.status(201).json(newUser);
    } catch (error) {
      handleAuthUnexpectedError(res, '/api/auth/register', error);
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password.trim()) {
        sendAuthError(res, 400, 'Email and password are required');
        return;
      }
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        sendAuthError(res, 404, 'No account found with this email. Please register!');
        return;
      }
      const userPassword = user.password || 'password';
      if (userPassword !== password) {
        sendAuthError(res, 400, 'Incorrect password. Please try again.');
        return;
      }
      res.json(user);
    } catch (error) {
      handleAuthUnexpectedError(res, '/api/auth/login', error);
    }
  });

  // Password Reset In-Memory Store
  const pendingResetOtps = new Map<string, PendingOtp>();

  // Send Password Reset OTP
  app.post('/api/auth/forgot-password-send-otp', async (req, res) => {
    try {
      const { email } = req.body ?? {};
      if (typeof email !== 'string' || !email.trim()) {
        sendAuthError(res, 400, 'Email address is required');
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        sendAuthError(res, 404, 'No account found with this email. Please register!');
        return;
      }

      // Generate a secure 6-digit OTP code for password reset
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      pendingResetOtps.set(normalizedEmail, { otp, expiresAt });

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      let smtpFrom = process.env.SMTP_FROM_EMAIL || 'no-reply@prvasiq.com';

      // Auto-detect and fix Resend-specific sender domain restrictions to ensure success
      const isResend = (smtpHost && smtpHost.toLowerCase().includes('resend')) || 
                      (smtpUser && smtpUser.toLowerCase() === 'resend');
      
      if (isResend) {
        const isPublicOrPlaceholder = !process.env.SMTP_FROM_EMAIL || 
                          smtpFrom.toLowerCase().endsWith('@gmail.com') || 
                          smtpFrom.toLowerCase().endsWith('@yahoo.com') || 
                          smtpFrom.toLowerCase().endsWith('@outlook.com') || 
                          smtpFrom.toLowerCase().endsWith('@hotmail.com') || 
                          smtpFrom.toLowerCase().endsWith('prvasiq.com'); // default fallback is unverified
        
        if (isPublicOrPlaceholder) {
          // Enforce Resend's default onboarding sender to guarantee successful mail dispatch of free tier
          smtpFrom = 'onboarding@resend.dev';
        }
      }

      let emailSent = false;
      let emailError = '';

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        try {
          const smtpPortNumber = Number.parseInt(smtpPort, 10);
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPortNumber,
            secure: smtpPortNumber === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          const mailOptions = {
            from: `"PRVASIQ Travel" <${smtpFrom}>`,
            to: email,
            subject: 'PRVASIQ - Reset Your Password',
            text: `Hello,\n\nYour one-time password (OTP) to reset your PRVASIQ password is: ${otp}\n\nThis code will expire in 10 minutes.\n\nWarm regards,\nPRVASIQ Travel Team`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0f172a; margin: 0; font-size: 24px; letter-spacing: -0.5px;">PRVASIQ</h1>
                <p style="color: #f97316; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0;">Travel Marketplace & Dispatch</p>
              </div>
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hello,</p>
                <p style="color: #334155; font-size: 14px; line-height: 1.5;">You've requested to reset your password. Please use the following 6-digit OTP code below to confirm your password change:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <span style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; color: #f97316; font-size: 32px; font-weight: bold; font-family: monospace; padding: 12px 30px; border-radius: 8px; letter-spacing: 6px;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This password reset code is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email; your security is unaffected.</p>
              </div>
              <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} PRVASIQ. All rights reserved.</p>
              </div>
            </div>
          `,
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
        } catch (err: unknown) {
          console.error('SMTP sending error:', err);
          emailError = err instanceof Error ? err.message : 'SMTP Configuration Error';
        }
      }

      if (emailSent) {
        res.json({ success: true, email, simulated: false });
      } else {
        console.log(`[PRVASIQ Forgot Password OTP Simulator] Code generated for ${email}: ${otp}`);
        res.json({
          success: true,
          email,
          simulated: true,
          sandboxOtp: otp,
          errorInfo: emailError ? `SMTP inactive (${emailError}). Entered sandbox simulation mode.` : "Entered sandbox simulation mode."
        });
      }
    } catch (error) {
      handleAuthUnexpectedError(res, '/api/auth/forgot-password-send-otp', error);
    }
  });

  // Verify Reset Password OTP and apply new password
  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { email, password, otp } = req.body ?? {};
      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof otp !== 'string' ||
        !email.trim() ||
        !password.trim() ||
        !otp.trim()
      ) {
        sendAuthError(res, 400, 'Email, new password and OTP are required');
        return;
      }
      if (password.length < 4) {
        sendAuthError(res, 400, 'Password must be at least 4 characters long');
        return;
      }

      const emailKey = email.toLowerCase().trim();
      const recordedOtp = pendingResetOtps.get(emailKey);
      if (!recordedOtp) {
        sendAuthError(res, 400, 'No active password reset session found for this email. Please request a new code.');
        return;
      }
      if (recordedOtp.expiresAt < Date.now()) {
        pendingResetOtps.delete(emailKey);
        sendAuthError(res, 400, 'OTP code has expired. Please secure a new code.');
        return;
      }
      if (recordedOtp.otp !== otp.trim()) {
        sendAuthError(res, 400, 'The 6-digit verification code is invalid. Please verify and try again.');
        return;
      }

      // OTP fits! Reset password
      pendingResetOtps.delete(emailKey);

      const userIndex = users.findIndex(u => u.email.toLowerCase() === emailKey);
      if (userIndex === -1) {
        sendAuthError(res, 404, 'No account found with this email.');
        return;
      }

      users[userIndex].password = password;
      res.json({ success: true, message: 'Password reset successfully! You can now sign in with your new password.', email: emailKey });
    } catch (error) {
      handleAuthUnexpectedError(res, '/api/auth/reset-password', error);
    }
  });

  // Get Vehicles list with robust filtering
  app.get('/api/vehicles', (req, res) => {
    const { city, capacity, isAc } = req.query;
    let filtered = [...vehicles];

    if (city) {
      const cityStr = String(city).trim().toLowerCase();
      filtered = filtered.filter(v => v.city.toLowerCase().includes(cityStr));
    }

    if (capacity) {
      filtered = filtered.filter(v => v.capacity === String(capacity));
    }

    if (isAc !== undefined) {
      const isAcBool = isAc === 'true';
      filtered = filtered.filter(v => v.isAc === isAcBool);
    }

    res.json(filtered);
  });

  // Fetch unique cities available in system
  app.get('/api/cities', (req, res) => {
    const citiesSet = new Set(vehicles.map(v => v.city));
    res.json(Array.from(citiesSet));
  });

  // Get specific vehicle details
  app.get('/api/vehicles/:id', (req, res) => {
    const veh = vehicles.find(v => v.id === req.params.id);
    if (!veh) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    res.json(veh);
  });

  // Add a new vehicle (Agency Side)
  app.post('/api/vehicles', (req, res) => {
    const { agencyId, name, capacity, city, pricePerKm, isAc, photoUrl, condition, details, vehicleImages } = req.body;
    const agency = users.find(u => u.id === agencyId);
    if (!agency) {
      res.status(400).json({ error: 'Invalid travel agency ID' });
      return;
    }

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      agencyId,
      agencyName: agency.name,
      agencyPhone: agency.phone || '+91 99999 99999',
      name,
      capacity,
      city,
      pricePerKm: Number(pricePerKm) || 15,
      isAc: isAc === true || isAc === 'true',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      vehicleImages: Array.isArray(vehicleImages) ? vehicleImages : [],
      condition: condition || 'Very Good',
      details: details || '',
      rating: 5.0,
      reviews: [],
      isAvailable: true
    };

    vehicles.push(newVehicle);
    res.status(201).json(newVehicle);
  });

  // Edit vehicle details (Agency Side)
  app.put('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    const { name, capacity, city, pricePerKm, isAc, photoUrl, condition, details, vehicleImages, isAvailable } = req.body;
    
    const veh = vehicles.find(v => v.id === id);
    if (!veh) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    
    if (name !== undefined) veh.name = name;
    if (capacity !== undefined) veh.capacity = capacity;
    if (city !== undefined) veh.city = city;
    if (pricePerKm !== undefined) veh.pricePerKm = Number(pricePerKm);
    if (isAc !== undefined) veh.isAc = isAc === true || isAc === 'true';
    if (photoUrl !== undefined) veh.photoUrl = photoUrl;
    if (condition !== undefined) veh.condition = condition;
    if (details !== undefined) veh.details = details;
    if (vehicleImages !== undefined) veh.vehicleImages = Array.isArray(vehicleImages) ? vehicleImages : [];
    if (isAvailable !== undefined) veh.isAvailable = isAvailable === true || isAvailable === 'true';
    
    res.json(veh);
  });

  // Get all Tour Packages
  app.get('/api/packages', (req, res) => {
    res.json(tourPackages);
  });

  // Create a new Tour Package (Agency Side)
  app.post('/api/packages', (req, res) => {
    const {
      agencyId,
      title,
      fromCity,
      toCity,
      stops,
      hotelName,
      hotelRating,
      hotelImages,
      inclusions,
      vehicleName,
      vehicleCapacity,
      vehicleImages,
      pricePerPerson,
      durationDays,
      description,
      photoUrl
    } = req.body;

    const agency = users.find(u => u.id === agencyId);
    if (!agency) {
      res.status(400).json({ error: 'Invalid travel agency ID' });
      return;
    }

    const newPackage: TourPackage = {
      id: `pkg-${Date.now()}`,
      agencyId,
      agencyName: agency.name,
      agencyPhone: agency.phone || '+91 99999 99999',
      title: title || 'Unnamed Tour Package',
      fromCity: fromCity || 'Unknown',
      toCity: toCity || 'Unknown',
      stops: Array.isArray(stops) ? stops : [],
      hotelName: hotelName || 'Comfort Inn Deluxe',
      hotelRating: hotelRating || '3-Star',
      hotelImages: Array.isArray(hotelImages) ? hotelImages : [],
      vehicleName: vehicleName || 'Luxury Tourist Coach',
      vehicleCapacity: vehicleCapacity || '12',
      vehicleImages: Array.isArray(vehicleImages) ? vehicleImages : [],
      inclusions: inclusions || { hotel: true, breakfast: true, lunch: true, dinner: true },
      pricePerPerson: Number(pricePerPerson) || 5000,
      durationDays: Number(durationDays) || 3,
      description: description || '',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
      isAvailable: true,
      createdAt: new Date().toISOString()
    };

    tourPackages.unshift(newPackage);
    res.status(201).json(newPackage);
  });

  // Add review to vehicle
  app.post('/api/vehicles/:id/reviews', (req, res) => {
    const { customerName, rating, comment } = req.body;
    const veh = vehicles.find(v => v.id === req.params.id);
    if (!veh) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      customerName: customerName || 'Anonymous Customer',
      rating: Number(rating) || 5,
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    veh.reviews.unshift(newReview);
    // Recalculate average rating
    const total = veh.reviews.reduce((sum, r) => sum + r.rating, 0);
    veh.rating = parseFloat((total / veh.reviews.length).toFixed(1));

    res.status(201).json(veh);
  });

  // Get Inquiries list
  app.get('/api/inquiries', (req, res) => {
    const { customerId, agencyId } = req.query;
    let filtered = [...inquiries];

    if (customerId) {
      filtered = filtered.filter(i => i.customerId === customerId);
    }
    if (agencyId) {
      filtered = filtered.filter(i => i.agencyId === agencyId);
    }

    res.json(filtered);
  });

  // Get dynamic inquiry by ID
  app.get('/api/inquiries/:id', (req, res) => {
    const inq = inquiries.find(i => i.id === req.params.id);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json(inq);
  });

  // Create an Inquiry (Customer Side)
  app.post('/api/inquiries', (req, res) => {
    const {
      customerId,
      vehicleId,
      fromCity,
      toCity,
      startDate,
      endDate,
      placesToCover,
      isAc,
      tripType,
      durationDays,
      numPassengers,
      remarks
    } = req.body;

    const customer = users.find(u => u.id === customerId);
    if (!customer) {
      res.status(400).json({ error: 'Invalid customer account' });
      return;
    }

    let vehicle = vehicles.find(v => v.id === vehicleId);
    let finalVehicleName = '';
    let finalVehicleCapacity: any = '12';
    let finalAgencyId = '';
    let finalAgencyName = '';

    if (!vehicle) {
      if (vehicleId === 'custom-package-selection' || req.body.agencyId) {
        finalVehicleName = req.body.vehicleName || 'Custom Holiday Coach';
        finalVehicleCapacity = req.body.vehicleCapacity || '12';
        finalAgencyId = req.body.agencyId || 'agency-1';
        const agencyUser = users.find(u => u.id === finalAgencyId);
        finalAgencyName = req.body.agencyName || agencyUser?.name || 'Local Tour Agency';
      } else {
        if (vehicles.length > 0) {
          vehicle = vehicles[0];
          finalVehicleName = vehicle.name;
          finalVehicleCapacity = vehicle.capacity;
          finalAgencyId = vehicle.agencyId;
          finalAgencyName = vehicle.agencyName;
        } else {
          res.status(400).json({ error: 'Selected vehicle not found and no vehicles in database' });
          return;
        }
      }
    } else {
      finalVehicleName = vehicle.name;
      finalVehicleCapacity = vehicle.capacity;
      finalAgencyId = vehicle.agencyId;
      finalAgencyName = vehicle.agencyName;
    }

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone || '+91 98765 00000',
      customerEmail: customer.email,
      vehicleId: vehicleId || (vehicle ? vehicle.id : 'custom-package-selection'),
      vehicleName: finalVehicleName,
      vehicleCapacity: finalVehicleCapacity,
      agencyId: finalAgencyId,
      agencyName: finalAgencyName,
      fromCity: fromCity || 'Unknown',
      toCity: toCity || 'Unknown',
      startDate: startDate || '',
      endDate: endDate || '',
      placesToCover: Array.isArray(placesToCover) ? placesToCover : [],
      isAc: isAc === true || isAc === 'true',
      tripType: tripType || 'round-trip',
      durationDays: Number(durationDays) || 1,
      numPassengers: Number(numPassengers) || 1,
      remarks: remarks || '',
      passengerList: [],
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    inquiries.unshift(newInquiry);

    // Automatically send a system welcome message in the thread
    const welcomeMsg: Message = {
      id: `msg-sys-${Date.now()}`,
      inquiryId: newInquiry.id,
      senderId: 'system',
      senderName: 'System Bot',
      senderType: 'agency',
      content: `Inquiry successfully raised for ${newInquiry.vehicleName}. Under review by ${newInquiry.agencyName}. Use the chat below to clarify mileage estimates, itineraries, driver accommodations/board, tolls, or menu expectations!`,
      createdAt: new Date().toISOString()
    };
    messages.push(welcomeMsg);

    res.status(201).json(newInquiry);
  });

  // Accept or Decline status
  app.post('/api/inquiries/:id/status', (req, res) => {
    const { status } = req.body;
    if (!['accepted', 'declined', 'confirmed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status update' });
      return;
    }

    const inq = inquiries.find(i => i.id === req.params.id);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    inq.status = status;
    if (status === 'accepted') {
      inq.quotedAt = new Date().toISOString();
    }

    // Send visual confirmation chat message
    const notificationText = status === 'accepted'
      ? `🎉 Travel agency accepted the initial inquiry! Proposing cost breakdown and expenses detailing now...`
      : `🛑 Inquiry has been marked as ${status} by the travel partner.`;

    messages.push({
      id: `msg-notif-${Date.now()}`,
      inquiryId: inq.id,
      senderId: 'system',
      senderName: 'System Bot',
      senderType: 'agency',
      content: notificationText,
      createdAt: new Date().toISOString()
    });

    res.json(inq);
  });

  // Propose quotes
  app.post('/api/inquiries/:id/quote', (req, res) => {
    const { driverStay, meals, tolls, otherCharges, explanation, estimatedTotalDistanceKm, customPricePerKm } = req.body;
    const inq = inquiries.find(i => i.id === req.params.id);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    const parsedPricePerKm = Number(customPricePerKm) || 15;
    const parsedDistance = Number(estimatedTotalDistanceKm) || 200;

    const costs = {
      driverStay: Number(driverStay) || 0,
      meals: Number(meals) || 0,
      tolls: Number(tolls) || 0,
      otherCharges: Number(otherCharges) || 0,
      explanation: String(explanation) || ''
    };

    inq.tripCosts = costs;
    inq.customPricePerKm = parsedPricePerKm;
    inq.estimatedTotalDistanceKm = parsedDistance;

    // Calculate final price: (distance * price_per_km) + driver_stay + meals + tolls + other
    const baseVehiclePrice = parsedPricePerKm * parsedDistance;
    const extraPrice = costs.driverStay + costs.meals + costs.tolls + costs.otherCharges;
    
    if (req.body.finalQuote !== undefined) {
      inq.finalTotalQuote = Number(req.body.finalQuote);
    } else if (req.body.finalTotalQuote !== undefined) {
      inq.finalTotalQuote = Number(req.body.finalTotalQuote);
    } else {
      inq.finalTotalQuote = baseVehiclePrice + extraPrice;
    }

    // Status goes to accepted automatically once quote is finalized by Agent
    if (inq.status === 'pending') {
      inq.status = 'accepted';
      inq.quotedAt = new Date().toISOString();
    } else if (inq.status === 'accepted') {
      inq.quotedAt = new Date().toISOString();
    }

    // Add visual chat explanation so customer clearly sees what is included
    const quoteMsgContent = `💼 **QUOTED TRIP PRICING ENCLOSED** 💼\n\n` +
      `- **Price per Km**: ₹${parsedPricePerKm}/km\n` +
      `- **Estimated Distance**: ${parsedDistance} Km\n` +
      `- **Base Vehicle Fare**: ₹${baseVehiclePrice}\n` +
      `---------------------------------------\n` +
      `**Extra Expense Breakdown Proposed:**\n` +
      `- Driver Night Stay/Allowances: ₹${costs.driverStay}\n` +
      `- Driver Meals/Board: ₹${costs.meals}\n` +
      `- Tolltaxes & Parking: ₹${costs.tolls}\n` +
      `- Misc / Other State Border Tax: ₹${costs.otherCharges}\n\n` +
      `*Explanation*: ${costs.explanation || 'Calculated matching requested days and coverage cities.'}\n\n` +
      `**GRAND TOTAL SECURE BOOKING ESTIMATE:** ₹${inq.finalTotalQuote}`;

    messages.push({
      id: `msg-quote-${Date.now()}`,
      inquiryId: inq.id,
      senderId: inq.agencyId,
      senderName: inq.agencyName,
      senderType: 'agency',
      content: quoteMsgContent,
      createdAt: new Date().toISOString()
    });

    res.json(inq);
  });

  // Complete Booking with real online payment simulation and passenger attachment
  app.post('/api/inquiries/:id/book', (req, res) => {
    const { passengerList, amountPaid } = req.body;
    const inq = inquiries.find(i => i.id === req.params.id);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    if (!Array.isArray(passengerList) || passengerList.length === 0) {
      res.status(400).json({ error: 'Please enlist at least 1 passenger detail to complete booking.' });
      return;
    }

    inq.status = 'confirmed';
    inq.passengerList = passengerList;

    const receiptNo = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      inquiryId: inq.id,
      customerId: inq.customerId,
      customerName: inq.customerName,
      agencyId: inq.agencyId,
      agencyName: inq.agencyName,
      vehicleId: inq.vehicleId,
      vehicleName: inq.vehicleName,
      amountPaid: Number(amountPaid) || inq.finalTotalQuote || 5000,
      paymentReceiptNo: receiptNo,
      bookedAt: new Date().toISOString(),
      tripDetails: {
        fromCity: inq.fromCity,
        toCity: inq.toCity,
        startDate: inq.startDate,
        endDate: inq.endDate,
        tripType: inq.tripType,
        durationDays: inq.durationDays
      },
      passengerList
    };

    bookings.unshift(newBooking);

    // Create a confirmation message
    messages.push({
      id: `msg-book-notif-${Date.now()}`,
      inquiryId: inq.id,
      senderId: 'system',
      senderName: 'Payment Gate',
      senderType: 'agency',
      content: `💳 **PAYMENT COMPLETED SUCCESSFULLY** 🎉\n\n` +
        `- **Transaction ID**: ${receiptNo}\n` +
        `- **Amount Paid**: ₹${newBooking.amountPaid}\n` +
        `- **Passenger Count**: ${passengerList.length} persons\n` +
        `Trip is officially confirmed! Complete Booking Receipt has been issued for client. Vehicle ${inq.vehicleName} is successfully registered for your dates!`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ inquiry: inq, booking: newBooking });
  });

  // Get Bookings list
  app.get('/api/bookings', (req, res) => {
    const { customerId, agencyId } = req.query;
    let filtered = [...bookings];

    if (customerId) {
      filtered = filtered.filter(b => b.customerId === customerId);
    }
    if (agencyId) {
      filtered = filtered.filter(b => b.agencyId === agencyId);
    }

    res.json(filtered);
  });

  // Edit Tour Package (Agency Side)
  app.put('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    const { title, fromCity, toCity, stops, hotelName, hotelRating, hotelImages, inclusions, vehicleName, vehicleCapacity, vehicleImages, pricePerPerson, durationDays, description, photoUrl, isAvailable } = req.body;
    
    const pkg = tourPackages.find(p => p.id === id);
    if (!pkg) {
      res.status(404).json({ error: 'Tour package not found' });
      return;
    }

    if (title !== undefined) pkg.title = title;
    if (fromCity !== undefined) pkg.fromCity = fromCity;
    if (toCity !== undefined) pkg.toCity = toCity;
    if (stops !== undefined) pkg.stops = Array.isArray(stops) ? stops : [];
    if (hotelName !== undefined) pkg.hotelName = hotelName;
    if (hotelRating !== undefined) pkg.hotelRating = hotelRating;
    if (hotelImages !== undefined) pkg.hotelImages = Array.isArray(hotelImages) ? hotelImages : [];
    if (inclusions !== undefined) pkg.inclusions = inclusions;
    if (vehicleName !== undefined) pkg.vehicleName = vehicleName;
    if (vehicleCapacity !== undefined) pkg.vehicleCapacity = vehicleCapacity;
    if (vehicleImages !== undefined) pkg.vehicleImages = Array.isArray(vehicleImages) ? vehicleImages : [];
    if (pricePerPerson !== undefined) pkg.pricePerPerson = Number(pricePerPerson);
    if (durationDays !== undefined) pkg.durationDays = Number(durationDays);
    if (description !== undefined) pkg.description = description;
    if (photoUrl !== undefined) pkg.photoUrl = photoUrl;
    if (isAvailable !== undefined) pkg.isAvailable = !!isAvailable;

    res.json(pkg);
  });

  // Edit Inquiry (Customer/Agency Side)
  app.put('/api/inquiries/:id', (req, res) => {
    const { id } = req.params;
    const { fromCity, toCity, startDate, endDate, placesToCover, isAc, tripType, durationDays, numPassengers, remarks, vehicleId, vehicleName, vehicleCapacity, status } = req.body;
    
    const inq = inquiries.find(i => i.id === id);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    if (fromCity !== undefined) inq.fromCity = fromCity;
    if (toCity !== undefined) inq.toCity = toCity;
    if (startDate !== undefined) inq.startDate = startDate;
    if (endDate !== undefined) inq.endDate = endDate;
    if (placesToCover !== undefined) inq.placesToCover = Array.isArray(placesToCover) ? placesToCover : [];
    if (isAc !== undefined) inq.isAc = isAc;
    if (tripType !== undefined) inq.tripType = tripType;
    if (durationDays !== undefined) inq.durationDays = Number(durationDays);
    if (numPassengers !== undefined) inq.numPassengers = Number(numPassengers);
    if (remarks !== undefined) inq.remarks = remarks;
    if (status !== undefined) inq.status = status;

    if (vehicleId !== undefined) {
      inq.vehicleId = vehicleId;
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        inq.vehicleName = vehicle.name;
        inq.vehicleCapacity = vehicle.capacity;
        inq.agencyId = vehicle.agencyId;
        inq.agencyName = vehicle.agencyName;
      }
    } else {
      if (vehicleName !== undefined) inq.vehicleName = vehicleName;
      if (vehicleCapacity !== undefined) inq.vehicleCapacity = vehicleCapacity;
    }

    res.json(inq);
  });

  // Chat messages API
  app.get('/api/chat/messages/:inquiryId', (req, res) => {
    const thread = messages.filter(m => m.inquiryId === req.params.inquiryId);
    res.json(thread);
  });

  app.post('/api/chat/messages', (req, res) => {
    const { inquiryId, senderId, senderName, senderType, content } = req.body;
    if (!inquiryId || !senderId || !content) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    const inq = inquiries.find(i => i.id === inquiryId);
    if (!inq) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      inquiryId,
      senderId,
      senderName,
      senderType,
      content,
      createdAt: new Date().toISOString()
    };
    messages.push(newMsg);

    res.status(201).json(newMsg);
  });

  // Check Gemini status
  app.get('/api/gemini/status', (req, res) => {
    const isConfigured = !!process.env.GEMINI_API_KEY;
    res.json({ configured: isConfigured });
  });

  // AI assistant integration
  app.post('/api/chat/ai', async (req, res) => {
    const { promptString, tripDetails, history } = req.body;
    
    // Lazy initialize
    const gemini = getGeminiClient();
    if (!gemini) {
      // Return beautiful response mock-free when API key is missing
      res.json({
        text: `### 🗺️ AI Travel Consultation
        
*(Note: Gemini API key is not yet configured in Settings > Secrets, displaying sample professional suggestion)*

Hello travelling group! 🌟 Based on your inquiry regarding **${tripDetails?.fromCity || 'your source'} to ${tripDetails?.toCity || 'destination'}** for **${tripDetails?.numPassengers || 'your'} passengers**:

1. **Capacity Recommendation**: For **${tripDetails?.numPassengers || 10} passengers**, a **12 Seater or 14 Seater Tempo Traveller** is extremely ideal. It leaves ample luggage safety and comfort leeway!
2. **Places to Cover Suggestion**: You can cover scenic spots like historical landmarks, local food hubs, and viewpoints.
3. **Budget Estimation**: Standard rates are about ₹18 to ₹24 per km. Feel free to request the travel agency for flat rates including tolls!

*To get personalized AI travel plans, please plug in your GEMINI_API_KEY in the bottom-left/top secrets drawer.*`
      });
      return;
    }

    try {
      // Build structured system instructions for travelling assistant
      const systemMsg = `You are "OpenCode Travel Assist", an intelligent and highly professional AI Logistics Expert specializing in B2B and B2C vehicle marketplaces. Your goal is to advise customers on:
      1. Best vehicle capacity selection (we only support: 7, 10, 12, 14, 17, 20, 25, 40, 56 Seater).
      2. Itineraries, distance calculation enroute, and scenic stop points.
      3. Explaining agency expenses simply (explain why driver night allowances, parking taxes, toll gates, and state borders add cost, so there are no surprises).
      4. Standard pricing rates, advising how to negotiate respectfully with transport owners.

      Current Trip details context:
      - Origin: ${tripDetails?.fromCity || 'unknown'}
      - Destination: ${tripDetails?.toCity || 'unknown'}
      - Duration: ${tripDetails?.durationDays || 'some'} Days
      - Number of travelers: ${tripDetails?.numPassengers || 'unknown'} Seaters needed
      - Preferences: ${tripDetails?.isAc ? 'AC Luxury' : 'Standard Non-Ac'} comfort
      
      Respond clearly in attractive Markdown format. Mention the custom capacities available. Keep paragraphs highly legible and polite.`;

      const contents = [];
      if (Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.senderType === 'customer' ? 'user' : 'model',
            parts: [{ text: turn.content }]
          });
        }
      }
      contents.push({ role: 'user', parts: [{ text: promptString || "Help me optimize my tour details and propose a reasonable pricing framework for our trip!" }] });

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemMsg,
          temperature: 0.7
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to communicate with AI model. " + error.message });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen explicitly on host 0.0.0.0 and port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started, running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
