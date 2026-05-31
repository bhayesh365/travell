/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Vehicle, Inquiry, Message, UserProfile, Booking, TourPackage, VehicleCapacity } from '../types.js';
import { 
  Search, Calendar, MapPin, Wind, Sparkles, Send, 
  MessageSquare, DollarSign, Users, ShieldAlert, 
  CheckCircle, ListFilter, CreditCard, RotateCcw, 
  UserPlus, Trash2, Printer, Star, MessageCircle, AlertCircle,
  ArrowLeft, Utensils, Compass, Bookmark, MoreVertical, Download
} from 'lucide-react';

interface CustomerDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
      mass: 0.8
    } 
  }
};

export default function CustomerDashboard({ user, onLogout }: CustomerDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'search' | 'inquiries' | 'bookings'>('search');

  // Search States
  const [city, setCity] = useState('Surat');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [isAcFilter, setIsAcFilter] = useState<boolean | null>(null);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [citiesList, setCitiesList] = useState<string[]>(['Surat', 'Delhi', 'Goa', 'Mumbai', 'Bangalore', 'Jaipur']);

  // Inquiry form states
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [fromCity, setFromCity] = useState('Surat');
  const [toCity, setToCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [placesToCoverInput, setPlacesToCoverInput] = useState('');
  const [isAcPreference, setIsAcPreference] = useState(true);
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [durationDays, setDurationDays] = useState(3);
  const [numPassengers, setNumPassengers] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [formSuccessMsg, setFormSuccessMsg] = useState('');

  // Active Inquiry detail states (For thread chat & AI)
  const [customerInquiries, setCustomerInquiries] = useState<Inquiry[]>([]);
  const [allSystemInquiries, setAllSystemInquiries] = useState<Inquiry[]>([]);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date(2026, 5, 1)); // Default to June 2026
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryMessages, setInquiryMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Editing Inquiry states
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [editInqFromCity, setEditInqFromCity] = useState('');
  const [editInqToCity, setEditInqToCity] = useState('');
  const [editInqStartDate, setEditInqStartDate] = useState('');
  const [editInqEndDate, setEditInqEndDate] = useState('');
  const [editInqPlacesInput, setEditInqPlacesInput] = useState('');
  const [editInqIsAc, setEditInqIsAc] = useState(true);
  const [editInqNumPassengers, setEditInqNumPassengers] = useState(1);
  const [editInqRemarks, setEditInqRemarks] = useState('');
  const [editInqVehicleCapacity, setEditInqVehicleCapacity] = useState<VehicleCapacity>('12');
  const [editInqVehicleName, setEditInqVehicleName] = useState('');

  const [rightPanel, setRightPanel] = useState<'none' | 'ai' | 'billing'>('none');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Tour Packages States
  const [packagesList, setPackagesList] = useState<TourPackage[]>([]);
  const [pkgSelectedCapacityArr, setPkgSelectedCapacityArr] = useState<Record<string, number>>({});
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [searchMode, setSearchMode] = useState<'packages' | 'custom'>('packages');
  const [bookingPackage, setBookingPackage] = useState<TourPackage | null>(null);
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<TourPackage | null>(null);
  const [detailActivePhoto, setDetailActivePhoto] = useState<string>('');
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState<number>(0);
  const [detailSelectedVehicle, setDetailSelectedVehicle] = useState<string>('');
  const [detailSelectedCapacity, setDetailSelectedCapacity] = useState<number>(12);
  const [detailNumPassengers, setDetailNumPassengers] = useState<number>(2);
  const [detailSelectedDate, setDetailSelectedDate] = useState<string>('');
  const [packageStartDate, setPackageStartDate] = useState('');
  const [packageNumPassengers, setPackageNumPassengers] = useState(1);
  const [packageFormSuccess, setPackageFormSuccess] = useState('');

  // Vehicle detailed selection states
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [vehicleDetailActivePhoto, setVehicleDetailActivePhoto] = useState<string>('');

  const getPackageFleetMultiplier = (capacity: number) => {
    if (capacity <= 7) return 1.00;
    if (capacity <= 12) return 1.08;
    if (capacity <= 17) return 1.18;
    return 1.32;
  };

  const getAdjustedPackagePrice = (pkg: TourPackage, targetCapacity: number) => {
    const defaultCapacity = Number(pkg.vehicleCapacity) || 12;
    const targetMult = getPackageFleetMultiplier(targetCapacity);
    const defaultMult = getPackageFleetMultiplier(defaultCapacity);
    return Math.round(pkg.pricePerPerson * (targetMult / defaultMult));
  };

  // Gemini AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Booking states
  const [passengersList, setPassengersList] = useState<{ name: string; age: number; gender: string }[]>([
    { name: '', age: 25, gender: 'Male' }
  ]);
  const [bookedReceipt, setBookedReceipt] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Reviews
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const handleDownloadInvoice = (inquiry: Inquiry) => {
    try {
      const invoiceNumber = `INV-${inquiry.id.slice(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const passengerCount = inquiry.passengerList?.length || inquiry.numPassengers || 1;
      const finalPrice = inquiry.finalTotalQuote || 5000;
      const subtotal = Math.round(finalPrice / 1.05);
      const taxAmount = finalPrice - subtotal;
      const issuedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      // Create high-fidelity PDF Document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const slateDark = [15, 23, 42];  // #0f172a
      const orangeAccent = [249, 115, 22]; // #f97316
      const slateLight = [100, 116, 139]; // #64748b
      const borderGray = [226, 232, 240]; // #e2e8f0
      const rowBg = [248, 250, 252]; // #f8fafc

      // ==========================================
      // 1. BRAND HEADER & STYLIZED VECTOR LOGO
      // ==========================================
      
      // Shape 1: Left Triangle (Teal-600)
      doc.setFillColor(13, 148, 136); 
      doc.triangle(15, 12, 15, 26, 21, 19, 'F');
      
      // Shape 2: Right Triangle (Orange-500)
      doc.setFillColor(249, 115, 22); 
      doc.triangle(27, 12, 27, 26, 21, 19, 'F');

      // Center Core Dot (Slate-900)
      doc.setFillColor(15, 23, 42); 
      doc.circle(21, 19, 1.2, 'F');

      // Typography beside emblem logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PRVASIQ', 31, 19);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(249, 115, 22);
      doc.text('TRAVEL MARKETPLACE & DISPATCH', 31, 23.5);

      // Tax Invoice Title (aligned right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('B2B TAX INVOICE', 195, 18, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('ORIGINAL CLIENT COPY  |  SECURED INWARD', 195, 23, { align: 'right' });

      // Main Rule Separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 29, 195, 29);

      // ==========================================
      // 2. DOUBLE METADATA PANEL CARDS
      // ==========================================
      
      // Panel Backdrops
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 34, 85, 32, 3, 3, 'F');
      doc.roundedRect(105, 34, 90, 32, 3, 3, 'F');

      // Panel borders
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(15, 34, 85, 32, 3, 3, 'S');
      doc.roundedRect(105, 34, 90, 32, 3, 3, 'S');

      // Column 1 Content: Client Information
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('BILL TO (CLIENT / RECIPIENT)', 20, 40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text((inquiry.customerName || 'Registered Traveler').toUpperCase(), 20, 45.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Phone Contact: ${inquiry.customerPhone || 'N/A'}`, 20, 50.5);
      doc.text(`Email Address: ${inquiry.customerEmail || 'N/A'}`, 20, 54.5);
      doc.text(`Account Reference: ${inquiry.customerId || 'SYS-CUST'}`, 20, 58.5);

      // Column 2 Content: Transaction Metadata
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TRANSACTION & COMPLIANCE DATA', 110, 40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Invoice ID: ${invoiceNumber}`, 110, 45.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Fulfill Date: ${issuedDate}`, 110, 50.5);
      doc.text(`Active Carrier: ${inquiry.agencyName || 'Verified Fleet Operator'}`, 110, 54.5);

      // Secure payment indicator
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Payment Status:', 110, 58.5);
      doc.setTextColor(4, 120, 87); // Emerald 700
      doc.text('PAID (UPI APPROVED)', 132, 58.5);

      // ==========================================
      // 3. JOURNEY TRANSIT DATA
      // ==========================================
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('JOURNEY & VEHICLE TRANSIT DESIGNATION', 15, 74);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 76, 195, 76);

      // Route Box Backdrop
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 80, 180, 22, 3, 3, 'F');
      doc.roundedRect(15, 80, 180, 22, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('DEPARTURE DEPOT', 20, 86);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(inquiry.fromCity.toUpperCase(), 20, 92);

      // Connector line with arrow
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(75, 90, 135, 90);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(13, 148, 136); // Teal-600
      doc.text(`${inquiry.tripType === 'one-way' ? 'ONE WAY VOYAGE' : 'ROUND TRIP VOYAGE'}`, 105, 86, { align: 'center' });
      doc.text('►', 135, 91.2, { align: 'center' }); // Stylized arrow

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('ARRIVING STATION', 190, 86, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(inquiry.toCity.toUpperCase(), 190, 92, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const vehicleDesc = `Traveling: ${inquiry.startDate} to ${inquiry.endDate} (${inquiry.durationDays} days)   |   Fleet Unit: ${inquiry.vehicleName} (${inquiry.isAc ? 'Fully Air Conditioned' : 'Non-Air Conditioned'})`;
      doc.text(vehicleDesc, 20, 97.5);

      // ==========================================
      // 4. CLEAR PASSENGER MANIFEST TABLE
      // ==========================================
      let currentY = 108;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`PASSENGER MANIFEST (${passengerCount} TRAVELLERS)`, 15, currentY);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY + 2, 195, currentY + 2);

      currentY += 6;
      // Header for Passenger table
      doc.setFillColor(15, 23, 42); // slateDark
      doc.rect(15, currentY, 180, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('NO.', 18, currentY + 4.2);
      doc.text('TRAVELLER FULL NAME', 35, currentY + 4.2);
      doc.text('AGE', 115, currentY + 4.2, { align: 'center' });
      doc.text('GENDER SPECIFICATION', 145, currentY + 4.2, { align: 'center' });
      doc.text('DESIGNATION SEATING', 190, currentY + 4.2, { align: 'right' });

      currentY += 6;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);

      const list = inquiry.passengerList || [];
      if (list.length === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, 7, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text('1.', 18, currentY + 5);
        doc.text('Primary Guest Traveler / Fleet Leader', 35, currentY + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${inquiry.numPassengers || 1} Seats`, 115, currentY + 5, { align: 'center' });
        doc.text('Guest Specified', 145, currentY + 5, { align: 'center' });
        doc.text('Reserved Deck Option', 190, currentY + 5, { align: 'right' });

        doc.line(15, currentY + 7, 195, currentY + 7);
        currentY += 7;
      } else {
        list.forEach((p, index) => {
          // Zebra strip bg
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, currentY, 180, 7, 'F');
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${index + 1}.`, 18, currentY + 5);
          doc.text(p.name, 35, currentY + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(String(p.age), 115, currentY + 5, { align: 'center' });
          doc.text((p.gender || 'M').toUpperCase(), 145, currentY + 5, { align: 'center' });
          doc.text(`Seat Row ${index + 1} (Assigned)`, 190, currentY + 5, { align: 'right' });

          doc.line(15, currentY + 7, 195, currentY + 7);
          currentY += 7;
        });
      }

      // ==========================================
      // 5. ITEMIZED FINANCIAL BREAKDOWN TABLE
      // ==========================================
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('ITEMIZED FINANCIAL & TRANSIT BREAKDOWN', 15, currentY);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY + 2, 195, currentY + 2);

      currentY += 6;
      // Header for cost table
      doc.setFillColor(15, 23, 42); // slateDark
      doc.rect(15, currentY, 180, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('TRANSIT LINE ITEM', 18, currentY + 4.2);
      doc.text('RATE CRITERIA', 90, currentY + 4.2);
      doc.text('QUANTITY / DAYS', 135, currentY + 4.2, { align: 'center' });
      doc.text('LINE SUBTOTAL', 190, currentY + 4.2, { align: 'right' });

      currentY += 6;

      // Extract or calculate exact sub-items
      const kmRate = inquiry.customPricePerKm || 18;
      const distance = inquiry.estimatedTotalDistanceKm || 250;
      const vehicleBaseCost = Math.round(kmRate * distance);

      // Outstation costs
      const driverStayCost = inquiry.tripCosts?.driverStay || 0;
      const mealsCost = inquiry.tripCosts?.meals || 0;
      const tollsCost = inquiry.tripCosts?.tolls || 0;
      const otherCost = inquiry.tripCosts?.otherCharges || 0;

      // Mathematical offset check so display sum perfectly equals invoice subtotal
      const calculatedBaseDiff = subtotal - (driverStayCost + mealsCost + tollsCost + otherCost);
      const displayBaseCost = calculatedBaseDiff > 0 ? calculatedBaseDiff : vehicleBaseCost;

      const itemsList = [
        {
          name: 'Core Fleet Vehicle Lease (Base Route Transit)',
          rate: `INR ${kmRate}/km base rate`,
          qty: `${distance} KM (Est.)`,
          val: displayBaseCost
        },
        {
          name: 'Driver Outstation Night Accommodation',
          rate: 'Overnight Stay Allowance',
          qty: `${inquiry.durationDays} Days / Stops`,
          val: driverStayCost
        },
        {
          name: 'Driver Food Boarding & Refreshments',
          rate: 'Meals & Board Allowance',
          qty: `${inquiry.durationDays} Days`,
          val: mealsCost
        },
        {
          name: 'Interstate Highway Tolls & Airport Parking',
          rate: 'Taxes & Parking Receipt',
          qty: 'Transit Lumpsum',
          val: tollsCost
        },
        {
          name: 'Other Surcharges & State Entry Road Permits',
          rate: 'Misc Service Clearances',
          qty: 'Transit Lumpsum',
          val: otherCost
        }
      ];

      itemsList.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY, 180, 7, 'F');
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(15, 23, 42);
        doc.text(item.name, 18, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(item.rate, 90, currentY + 5);
        doc.text(item.qty, 135, currentY + 5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`₹${item.val.toLocaleString('en-IN')}.00`, 190, currentY + 5, { align: 'right' });

        doc.line(15, currentY + 7, 195, currentY + 7);
        currentY += 7;
      });

      // ==========================================
      // 6. TOTALS SECTION & PAYMENT VERIFICATION
      // ==========================================
      currentY += 4;
      const summaryStartX = 110;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(summaryStartX, currentY, 85, 24, 2, 2, 'F');
      doc.roundedRect(summaryStartX, currentY, 85, 24, 2, 2, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Calculated Transit Subtotal:', summaryStartX + 4, currentY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`₹${subtotal.toLocaleString('en-IN')}.00`, 190, currentY + 6, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Tax & Service Charges (5% GST):', summaryStartX + 4, currentY + 12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`₹${taxAmount.toLocaleString('en-IN')}.00`, 190, currentY + 12, { align: 'right' });

      // Highlight row for Grand Total inside card
      doc.setFillColor(241, 245, 249);
      doc.rect(summaryStartX, currentY + 16, 85, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(4, 120, 87); // Emerald 700
      doc.text('Total Paid Amount (Net):', summaryStartX + 4, currentY + 21.5);
      doc.text(`₹${finalPrice.toLocaleString('en-IN')}.00`, 190, currentY + 21.5, { align: 'right' });

      // Left column text beside summary box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('PAYMENT VERIFICATION STAMP', 15, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('• Gate Pass & Payment settled successfully.', 15, currentY + 9);
      doc.text('• Transaction verified via active virtual private routing.', 15, currentY + 13);
      doc.text('• Fully eligible for standard corporate tax credits.', 15, currentY + 17);
      doc.text('• 24/7 client dispatch support line available at center depot.', 15, currentY + 21);

      // ==========================================
      // 7. LEGALLY COMPLIANT TERMS AND FOOTER
      // ==========================================
      currentY += 28;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      
      const footerMsg = "Important Notice: This booking document is a digitally encrypted transit invoice issued on behalf of Prvasiq Travel Marketplace and the respective operating fleet partner. Under standard B2B outstation transit guidelines, this serves as verified proof of payment. For refunds, itinerary reschedulements or driver coordination, please access your private inquiry channel.";
      const wrappedInfo = doc.splitTextToSize(footerMsg, 180);
      doc.text(wrappedInfo, 15, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // light slate gray
      doc.text(`SYSTEM DECRYPTION AUTH HASH CODE: ${inquiry.id.toUpperCase()}-${Math.floor(Date.now() / 100000)}`, 15, currentY + 17);

      // Trigger automatic file download!
      doc.save(`Invoice-${invoiceNumber}.pdf`);

    } catch (error) {
      console.error("PDF generation failed, falling back to basic print dialog:", error);
      // Fallback: If jsPDF fails under browser context, open standard print helper
      try {
        window.print();
      } catch (err) {
        alert("Unable to download invoice: Please verify pop-up or storage settings.");
      }
    }
  };

  const downloadVehicleBrochurePdf = (vehicle: Vehicle) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const slateDark = [15, 23, 42];  // #0f172a
      const orangeAccent = [249, 115, 22]; // #f97316
      const slateLight = [100, 116, 139]; // #64748b
      const borderGray = [226, 232, 240]; // #e2e8f0
      const rowBg = [248, 250, 252]; // #f8fafc

      // ==========================================
      // 1. BRAND HEADER & STYLIZED VECTOR LOGO
      // ==========================================
      
      // Shape 1: Left Triangle (Teal-600)
      doc.setFillColor(13, 148, 136); 
      doc.triangle(15, 12, 15, 26, 21, 19, 'F');
      
      // Shape 2: Right Triangle (Orange-500)
      doc.setFillColor(249, 115, 22); 
      doc.triangle(27, 12, 27, 26, 21, 19, 'F');

      // Center Core Dot (Slate-900)
      doc.setFillColor(15, 23, 42); 
      doc.circle(21, 19, 1.2, 'F');

      // Typography beside emblem logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PRVASIQ', 31, 19);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(249, 115, 22);
      doc.text('TRAVEL MARKETPLACE & DISPATCH', 31, 23.5);

      // Document Title (aligned right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('FLEET SPECIFICATION BROCHURE', 195, 18, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('OFFICIAL VERIFIED CARRIER SPECIFICATIONS', 195, 23, { align: 'right' });

      // Main Rule Separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 29, 195, 29);

      // ==========================================
      // 2. VEHICLE MAIN DETAILS BANNER
      // ==========================================
      doc.setFillColor(15, 23, 42); // dark background
      doc.roundedRect(15, 34, 180, 38, 4, 4, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(vehicle.name.toUpperCase(), 22, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(249, 115, 22); // Orange Accent
      doc.text(`Fleet Operator: ${vehicle.agencyName.toUpperCase()}`, 22, 51);

      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225); // Slate light grey text
      doc.text(`Base Operating Hub: ${vehicle.city} Depot   |   Verified Commercial Unit Class`, 22, 56);
      doc.text(`Configuration: ${vehicle.capacity} Reclining Passenger Seats   |   ${vehicle.isAc ? 'Standard Air Conditioned Cabin (AC)' : 'Sober Ambient Ventilation (Non-AC)'}`, 22, 61);

      // ==========================================
      // 3. PRICING & TARIFF MODEL (GRID ROW)
      // ==========================================
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 78, 180, 26, 3, 3, 'F');
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(15, 78, 180, 26, 3, 3, 'S');

      // Col 1: Standard Rate
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('STANDARD DISTANCE TARIFF', 22, 85);
      doc.setFontSize(16);
      doc.setTextColor(249, 115, 22);
      doc.text(`INR ${vehicle.pricePerKm} / Km`, 22, 94);

      // Col 2: Min Daily Run
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('MINIMUM DAILY RUN COMMITMENT', 95, 85);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('200 Kilometers / Day minimum charge', 95, 93);

      // ==========================================
      // 4. CABIN AMENITIES & FEATURES BOX
      // ==========================================
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('VERIFIED CABIN AMENITIES & SPECS', 15, 112);

      let currentY = 117;
      
      const features = [
        ['🚍 Vehicle Segment Class', Number(vehicle.capacity) <= 10 ? 'Premium SUV Cabin' : Number(vehicle.capacity) <= 17 ? 'Luxury Force Traveller Class' : 'Elite Intercity Coach Bus'],
        ['🔧 Service Integrity State', vehicle.condition ? vehicle.condition.toUpperCase() : 'Excellent (Model Year 2024)'],
        ['💺 Comfort Level', `${vehicle.capacity} Pushback Ergonomic Sleeper-Style Recliners`],
        ['💎 In-Cabin Entertainment', 'Built-in LED Multimedia TV, Bluetooth sound, mobile charge ports'],
        ['🛡 Safety Assurance', 'Real-time GPS security tracking, certified double vaccinated chauffeurs']
      ];

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);

      features.forEach(([title, desc], idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, currentY, 180, 7.5, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(title, 18, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(desc, 70, currentY + 5);

        currentY += 7.5;
      });

      // Description text below specifications table
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('OPERATING DESCRIPTION', 15, currentY);

      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const descVal = vehicle.details || "Luxury passenger vehicle engineered for outstation travel, providing outstanding suspension safety, cushioned ergonomics, high shock absorption suspension systems, and premium cabin ventilation style to elevate group private voyages.";
      const splitDesc = doc.splitTextToSize(descVal, 180);
      doc.text(splitDesc, 15, currentY);
      
      currentY += (splitDesc.length * 4) + 6;

      // ==========================================
      // 5. REVIEWS & END USER EXPERIENCE FEEDBACK
      // ==========================================
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('VERIFIABLE PASSENGER LOGS & RATINGS', 15, currentY);

      currentY += 4;
      if (vehicle.reviews.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('No user reviews have been submitted for this fleet unit yet.', 15, currentY);
        currentY += 8;
      } else {
        const slicedReviews = vehicle.reviews.slice(0, 2);
        slicedReviews.forEach((rev) => {
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, currentY, 180, 15, 2, 2, 'F');

          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.roundedRect(15, currentY, 180, 15, 2, 2, 'S');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(rev.customerName, 18, currentY + 5);

          doc.setTextColor(249, 115, 22);
          doc.text(`Rating: ${rev.rating} / 5 Stars`, 140, currentY + 5);

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`"${rev.comment}"`, 18, currentY + 11);

          currentY += 18;
        });
      }

      // ==========================================
      // 6. BOTTOM LEGAL POLICY NOTES & REGULATION CODES
      // ==========================================
      currentY = Math.max(currentY, 250);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, currentY, 195, currentY);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const disclaimer = "Important Notice: This brochure contains specifications compiled in June 2026 for descriptive client review. All transport deployments are subjected to regional commercial permit regulations and real-time transit garage availability. To raise dynamic inquiries, book this exact fleet, or consult custom billing estimates, please register via your secure Prvasiq Travel Marketplace profile channel.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(splitDisclaimer, 15, currentY + 4);

      // Authenticity hash footer
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`BROCHURE AUTH CODE CODE: PRV-${vehicle.id.toUpperCase()}-${Math.floor(Date.now() / 150000)}`, 15, currentY + 15);

      // Trigger automatic file download!
      doc.save(`Brochure-${vehicle.name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("PDF download crashed:", error);
      alert("Unable to compile PDF Brochure. Please verify browser storage access.");
    }
  };

  // Fetch Vehicles matching query
  const handleSearch = async () => {
    setLoadingVehicles(true);
    try {
      let url = `/api/vehicles?city=${encodeURIComponent(city)}`;
      if (capacityFilter) url += `&capacity=${capacityFilter}`;
      if (isAcFilter !== null) url += `&isAc=${isAcFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      setVehiclesList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleBookPackage = async (e: React.FormEvent, pkg: TourPackage) => {
    e.preventDefault();
    if (!packageStartDate) {
      alert("Please select a travel start date!");
      return;
    }

    try {
      const sDate = new Date(packageStartDate);
      sDate.setDate(sDate.getDate() + pkg.durationDays);
      const calculatedEndDate = sDate.toISOString().split('T')[0];

      // Find suitable vehicle
      const matchVeh = vehiclesList.find(v => v.name === pkg.vehicleName) || vehiclesList[0];
      const selectedVehicleId = matchVeh ? matchVeh.id : 'veh-surat-1';

      const inclusionsStr = [
        pkg.inclusions.hotel ? "Hotel Lodging" : "",
        pkg.inclusions.breakfast ? "Breakfast" : "",
        pkg.inclusions.lunch ? "Lunch" : "",
        pkg.inclusions.dinner ? "Dinner" : ""
      ].filter(Boolean).join(", ");

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          vehicleId: selectedVehicleId || 'custom-package-selection',
          agencyId: pkg.agencyId,
          agencyName: pkg.agencyName,
          vehicleCapacity: pkg.vehicleCapacity,
          vehicleName: pkg.vehicleName,
          fromCity: pkg.fromCity,
          toCity: pkg.toCity,
          startDate: packageStartDate,
          endDate: calculatedEndDate,
          placesToCover: pkg.stops,
          isAc: true,
          tripType: 'round-trip',
          durationDays: pkg.durationDays,
          numPassengers: packageNumPassengers,
          remarks: `[CURATED TOUR PACKAGE] ${pkg.title}. Stays at: ${pkg.hotelName} (${pkg.hotelRating}). Inclusions: ${inclusionsStr}.`
        })
      });

      if (res.ok) {
        const newInq = await res.json();
        const finalPrice = pkg.pricePerPerson * packageNumPassengers;

        // Apply automatic preset quote based on per person pricing
        await fetch(`/api/inquiries/${newInq.id}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customPricePerKm: 0,
            estimatedDistance: 0,
            tripCosts: {
              driverStay: 0,
              meals: 0,
              tolls: 0,
              otherCharges: 0,
              explanation: "All inclusive curated holiday package deal"
            },
            finalQuote: finalPrice
          })
        });

        // Advance to accepted status so chat & checkout are open
        await fetch(`/api/inquiries/${newInq.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' })
        });

        setPackageFormSuccess(`Inquiry for ${pkg.title} raised successfully at a fixed package quote of ₹${finalPrice.toLocaleString('en-IN')}! Redirecting to your active inquiries/chat thread...`);
        fetchInquiries();
        setTimeout(() => {
          setBookingPackage(null);
          setPackageFormSuccess('');
          setActiveTab('inquiries');
        }, 3000);
      }
    } catch (err) {
      console.error("Error booking package:", err);
    }
  };

  const handleBookPackageDetailSubmit = async (e: React.FormEvent, pkg: TourPackage) => {
    e.preventDefault();
    if (!detailSelectedDate) {
      alert("Please select your travel date from the Live Availability calendar first!");
      return;
    }

    try {
      const sDate = new Date(detailSelectedDate);
      sDate.setDate(sDate.getDate() + pkg.durationDays);
      const calculatedEndDate = sDate.toISOString().split('T')[0];

      const adjustedPricePerson = getAdjustedPackagePrice(pkg, detailSelectedCapacity);
      const finalPrice = Math.round(adjustedPricePerson * detailNumPassengers);

      const inclusionsStr = [
        pkg.inclusions.hotel ? "Premium Hotel Lodging" : "",
        pkg.inclusions.breakfast ? "Gourmet Breakfast Options Included" : "",
        pkg.inclusions.lunch ? "Standard High Tea & Buffet Lunch" : "",
        pkg.inclusions.dinner ? "Authentic Dinner Buffet Selection" : ""
      ].filter(Boolean).join(", ");

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          vehicleId: 'custom-package-selection',
          agencyId: pkg.agencyId,
          agencyName: pkg.agencyName,
          vehicleCapacity: detailSelectedCapacity,
          vehicleName: detailSelectedVehicle,
          fromCity: pkg.fromCity,
          toCity: pkg.toCity,
          startDate: detailSelectedDate,
          endDate: calculatedEndDate,
          placesToCover: pkg.stops,
          isAc: true,
          tripType: 'round-trip',
          durationDays: pkg.durationDays,
          numPassengers: detailNumPassengers,
          remarks: `[RESERVED HOLIDAY PACKAGE] Plan ID: ${pkg.id}. Custom Transit Fleet: ${detailSelectedVehicle} (${detailSelectedCapacity} Seater Class). Stays Booked: ${pkg.hotelName} (${pkg.hotelRating}). Inclusive Food Plan: ${inclusionsStr}. Special Meal request and room service is open for inquiry.`
        })
      });

      if (res.ok) {
        const newInq = await res.json();

        // Apply dynamic fixed quote instantly
        await fetch(`/api/inquiries/${newInq.id}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customPricePerKm: 0,
            estimatedDistance: 0,
            tripCosts: {
              driverStay: 0,
              meals: 0,
              tolls: 0,
              otherCharges: 0,
              explanation: `All Inclusive Package Deal with Custom Selected Vehicle Upgrade: ${detailSelectedVehicle}`
            },
            finalQuote: finalPrice
          })
        });

        // Set status to accepted so user can pay/chat immediately
        await fetch(`/api/inquiries/${newInq.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' })
        });

        setPackageFormSuccess(`Voyage for ${pkg.title} successfully booked on ${detailSelectedDate}! Your custom vehicle was set to ${detailSelectedVehicle}. Total quote finalized at ₹${finalPrice.toLocaleString('en-IN')}. Redirecting you to chat...`);
        fetchInquiries();
        setTimeout(() => {
          setSelectedPackageForDetail(null);
          setPackageFormSuccess('');
          setActiveTab('inquiries');
        }, 3200);
      }
    } catch (err) {
      console.error("Error submitting package detail booking:", err);
    }
  };

  // Fetch matching vehicles automatically when filters (city, capacity, AC status) change
  useEffect(() => {
    handleSearch();
  }, [city, capacityFilter, isAcFilter]);

  // Pre-fetch matching cities & inquiries once on load
  useEffect(() => {
    fetchCities();
    fetchInquiries();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/packages');
      if (res.ok) {
        const data = await res.json();
        setPackagesList(data);
      }
    } catch (e) {
      console.error("Error fetching packages:", e);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/cities');
      const data = await res.json();
      if (data.length > 0) setCitiesList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch(`/api/inquiries?customerId=${user.id}`);
      const data = await res.json();
      setCustomerInquiries(data);

      try {
        const sysRes = await fetch('/api/inquiries');
        if (sysRes.ok) {
          const sysData = await sysRes.json();
          setAllSystemInquiries(sysData);
        }
      } catch (sysErr) {
        console.error("Failed to fetch system inquiries", sysErr);
      }

      // Keep current active inquiry refreshed if open
      if (selectedInquiry) {
        const refreshed = data.find((i: Inquiry) => i.id === selectedInquiry.id);
        if (refreshed) {
          setSelectedInquiry(refreshed);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFleetBookingStatus = (capacity: number, dateStr: string) => {
    const activeOverlays = allSystemInquiries.filter(inq => {
      if (inq.status !== 'confirmed' && inq.status !== 'accepted') return false;
      
      const d = new Date(dateStr);
      const start = new Date(inq.startDate);
      const end = new Date(inq.endDate);
      
      d.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      
      if (d < start || d > end) return false;
      
      const cap = Number(inq.vehicleCapacity) || 12;
      if (capacity <= 7) {
        return cap <= 7;
      } else if (capacity <= 17) {
        return cap > 7 && cap <= 17;
      } else {
        return cap > 17;
      }
    });

    const occupiedCount = activeOverlays.length;
    let totalFleet = 3; 
    let className = "Small Sedan SUV (Max 3)";
    if (capacity > 7 && capacity <= 17) {
      totalFleet = 2; 
      className = "AC Force Traveller (Max 2)";
    } else if (capacity > 17) {
      totalFleet = 1; 
      className = "Executive Coach Bus (Max 1)";
    }

    const isBooked = occupiedCount >= totalFleet;
    return {
      isBooked,
      occupiedCount,
      totalFleet,
      className,
      activeOverlays
    };
  };

  const getReservationsForCategory = (capacity: number) => {
    return allSystemInquiries.filter(inq => {
      if (inq.status !== 'confirmed' && inq.status !== 'accepted') return false;
      const cap = Number(inq.vehicleCapacity) || 12;
      if (capacity <= 7) return cap <= 7;
      if (capacity <= 17) return cap > 7 && cap <= 17;
      return cap > 17;
    });
  };

  const startEditingInquiry = (inq: Inquiry) => {
    setEditingInquiry(inq);
    setEditInqFromCity(inq.fromCity);
    setEditInqToCity(inq.toCity);
    setEditInqStartDate(inq.startDate);
    setEditInqEndDate(inq.endDate);
    setEditInqPlacesInput(inq.placesToCover ? inq.placesToCover.join(', ') : '');
    setEditInqIsAc(inq.isAc);
    setEditInqNumPassengers(inq.numPassengers);
    setEditInqRemarks(inq.remarks || '');
    setEditInqVehicleCapacity(inq.vehicleCapacity);
    setEditInqVehicleName(inq.vehicleName || '');
  };

  const handleUpdateInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInquiry) return;

    try {
      const placesArray = editInqPlacesInput.split(',').map(p => p.trim()).filter(Boolean);
      
      const sDate = new Date(editInqStartDate);
      const eDate = new Date(editInqEndDate);
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 1;

      let vName = editInqVehicleName;
      if (!vName) {
        if (Number(editInqVehicleCapacity) <= 7) vName = "Innova Cryta Premium SUV";
        else if (Number(editInqVehicleCapacity) <= 17) vName = "Force Urbania Deluxe Traveller";
        else vName = "Multi-Axle Royal Volvo Coach Autobus";
      }

      const payload = {
        fromCity: editInqFromCity,
        toCity: editInqToCity,
        startDate: editInqStartDate,
        endDate: editInqEndDate,
        placesToCover: placesArray,
        isAc: editInqIsAc,
        numPassengers: Number(editInqNumPassengers),
        remarks: editInqRemarks,
        durationDays,
        vehicleCapacity: editInqVehicleCapacity,
        vehicleName: vName
      };

      const res = await fetch(`/api/inquiries/${editingInquiry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setEditingInquiry(null);
        await fetchInquiries();
        if (selectedInquiry?.id === updated.id) {
          setSelectedInquiry(updated);
        }
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to update inquiry'}`);
      }
    } catch (err) {
      console.error("Error updating inquiry:", err);
    }
  };

  // Chat message fetch and message polling
  const fetchMessages = async (inqId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${inqId}`);
      const data = await res.json();
      setInquiryMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Set up message poller when user opens Chat Thread
  useEffect(() => {
    if (selectedInquiry) {
      fetchMessages(selectedInquiry.id);
      
      const interval = setInterval(() => {
        fetchMessages(selectedInquiry.id);
        // Refresh inquiries state to catch any updated status from travel agency
        fetchInquiries();
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [selectedInquiry?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedInquiry) return;

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          senderId: user.id,
          senderName: user.name,
          senderType: 'customer',
          content: newMessageText.trim()
        })
      });

      if (res.ok) {
        const freshMsg = await res.json();
        setInquiryMessages(prev => [...prev, freshMsg]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Inquiry form
  const handleInquirySubmission = async (vehicle: Vehicle) => {
    if (!vehicle) return;
    setSubmittingInquiry(true);
    setFormSuccessMsg('');

    try {
      const placesArray = placesToCoverInput
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Handle start date and end date calculations safely
      let travelStart = startDate;
      if (!travelStart) {
        travelStart = new Date().toISOString().split('T')[0];
      }
      
      const start = new Date(travelStart);
      start.setDate(start.getDate() + (durationDays || 1));
      const travelEnd = start.toISOString().split('T')[0];

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          vehicleId: vehicle.id,
          fromCity: fromCity || city,
          toCity: toCity || 'Not Specified',
          startDate: travelStart,
          endDate: travelEnd,
          placesToCover: placesArray,
          isAc: isAcPreference,
          tripType,
          durationDays: durationDays || 1,
          numPassengers: numPassengers || 1,
          remarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccessMsg(`Inquiry successfully submitted to ${vehicle.agencyName}! Redirecting to active conversations...`);
        fetchInquiries();
        setTimeout(() => {
          setSelectedVehicle(null);
          setActiveTab('inquiries');
          setFormSuccessMsg('');
        }, 2250);
      } else {
        alert(data.error || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // AI Consultative Helper with Gemini
  const askAIAgent = async () => {
    if (!selectedInquiry) return;
    setAiLoading(true);
    setAiResponse('');

    const contextTrip = {
      fromCity: selectedInquiry.fromCity,
      toCity: selectedInquiry.toCity,
      numPassengers: selectedInquiry.numPassengers,
      durationDays: selectedInquiry.durationDays,
      isAc: selectedInquiry.isAc
    };

    try {
      const res = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptString: aiPrompt || "Please recommend an itinerary, safety checks, and average budget metrics for this specific trip.",
          tripDetails: contextTrip,
          history: inquiryMessages.slice(-5) // pass recent chat context
        })
      });

      const data = await res.json();
      setAiResponse(data.text);
    } catch (err: any) {
      setAiResponse(`Failed to call AI Model helper: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Manage dynamic Passenger input fields
  const addPassengerField = () => {
    setPassengersList([...passengersList, { name: '', age: 25, gender: 'Male' }]);
  };

  const removePassengerField = (index: number) => {
    if (passengersList.length === 1) return;
    setPassengersList(passengersList.filter((_, idx) => idx !== index));
  };

  const updatePassengerValue = (index: number, key: string, val: any) => {
    const updated = [...passengersList];
    updated[index] = { ...updated[index], [key]: val };
    setPassengersList(updated);
  };

  // Complete offline booking action
  const handleBookingConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    // Validation
    const emptyNames = passengersList.some(p => !p.name.trim());
    if (emptyNames) {
      alert('Please fill out the names of all passengers to proceed.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerList: passengersList,
          amountPaid: selectedInquiry.finalTotalQuote
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBookedReceipt(data.booking);
        fetchInquiries();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Review Submissions
  const handlePostReview = async (e: React.FormEvent, vehicleId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.name,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setReviewSuccess('Review submitted successfully! Thank you.');
        setReviewComment('');
        // Refresh corresponding vehicles and lists
        handleSearch();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Format Helper for markdown elements inside the text (e.g. system bot messages)
  const renderMessageContent = (text: string) => {
    if (!text) return '';
    
    // Quick custom parser to capture basic bold stars ** or single line breaks
    // to keep layout pristine without installing extra heavy packages.
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line;
      // Bold highlight
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let temp = formattedLine;
      let match;
      let lastIndex = 0;

      while ((match = boldRegex.exec(temp)) !== null) {
        parts.push(temp.substring(lastIndex, match.index));
        parts.push(<strong key={match.index} className="font-semibold text-slate-800">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      parts.push(temp.substring(lastIndex));

      return (
        <div key={idx} className="min-h-[1rem]">
          {parts.length > 1 ? parts : formattedLine}
        </div>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Dynamic Navigation Head */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <span className="text-xs font-black bg-orange-100 text-orange-700 px-3.5 py-1 rounded-full border border-orange-200 tracking-widest uppercase">
            Customer Dashboard Portal
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-3">
            Compare & Hire <span className="underline decoration-orange-500 decoration-4 underline-offset-4">Group Vehicles</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Welcome back, <span className="font-extrabold text-slate-800 underline decoration-teal-400 decoration-2">{user.name}</span>. Secure private regional fleets directly with zero broker margins.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto bg-white p-1.5 sm:p-2 rounded-full border border-sky-100 shadow-sm shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => { setActiveTab('search'); setSelectedInquiry(null); }}
            className={`flex-1 lg:flex-none px-4 sm:px-5 py-2.5 text-xs font-black rounded-full transition duration-150 shrink-0 ${activeTab === 'search' ? 'bg-orange-500 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Search Fleets
          </button>
          <button
            onClick={() => { setActiveTab('inquiries'); }}
            className={`flex-1 lg:flex-none px-4 sm:px-5 py-2.5 text-xs font-black rounded-full relative transition duration-150 shrink-0 ${activeTab === 'inquiries' ? 'bg-teal-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            My Inquiries
            {customerInquiries.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {customerInquiries.length}
              </span>
            )}
          </button>
          <button
            onClick={onLogout}
            className="px-3 sm:px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition shrink-0"
          >
            Logout
          </button>
        </div>
      </div>

      {/* VIEW 1: SEARCH FLEET ENGINE */}
      {activeTab === 'search' && (
        <div className="space-y-8 animate-fade-in">

          {selectedVehicleForDetail ? (
            <div className="space-y-8 animate-fade-in text-slate-800">
              
              {/* Back to Explore Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicleForDetail(null);
                    setVehicleDetailActivePhoto('');
                  }}
                  className="group flex items-center gap-2 text-slate-600 hover:text-slate-900 font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer border-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition font-black text-slate-700" />
                  <span>← Back to Fleets Directory</span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadVehicleBrochurePdf(selectedVehicleForDetail)}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-full hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-600" />
                    <span>Download Brochure (PDF)</span>
                  </button>
                  <span className="text-[10px] font-black uppercase text-teal-700 tracking-widest bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-150 inline-block font-sans">
                    ★ Premium Verified Partner
                  </span>
                </div>
              </div>

              {/* Cover Photo / Header Segment */}
              <div className="relative rounded-[32px] overflow-hidden shadow-xl bg-slate-900 text-white min-h-[260px] sm:min-h-[350px] flex flex-col justify-end p-6 sm:p-10">
                <img
                  src={vehicleDetailActivePhoto || selectedVehicleForDetail.photoUrl}
                  referrerPolicy="no-referrer"
                  alt={selectedVehicleForDetail.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-75 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                
                <div className="relative z-10 space-y-4 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white px-3 py-1 rounded-full border border-orange-500 shadow-sm flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {selectedVehicleForDetail.capacity} Seater Coach
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white px-3 py-1 rounded-full shadow-sm">
                      {selectedVehicleForDetail.isAc ? 'Fully Air Conditioned (A/C)' : 'Sober Ambient Cabin'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-700 text-white px-3 py-1 rounded-full shadow-sm">
                      Base City: {selectedVehicleForDetail.city}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-sm font-sans">
                    {selectedVehicleForDetail.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 font-semibold opacity-95 flex items-center gap-1.5 leading-none">
                    Provided directly by <span className="text-orange-400 font-extrabold underline decoration-orange-400 decoration-2">{selectedVehicleForDetail.agencyName}</span> • Zero Broker Intermediaries
                  </p>
                </div>
              </div>

              {/* Three-split Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left block (col-span-8): Image display + Description + Reviews */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Photo details container */}
                  <div className="bg-white border border-sky-50 shadow-md p-6 sm:p-8 rounded-[32px] space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>📸 Interactive Fleet Sights & Interior Cabin Showcase</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Click on any high-fidelity thumbnail below to view full-scale details of this passenger vehicle:</p>
                    
                    {(() => {
                      const fallbackImages = [
                        selectedVehicleForDetail.photoUrl,
                        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200", // luxury bus
                        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=1200", // passenger coach
                        "https://images.unsplash.com/photo-1517840901100-8179e982ca41?auto=format&fit=crop&q=80&w=1200", // road trip
                        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",  // scenic road
                        "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=1200"  // group travel
                      ];
                      
                      const items = (selectedVehicleForDetail.vehicleImages && selectedVehicleForDetail.vehicleImages.length > 0)
                        ? [...selectedVehicleForDetail.vehicleImages]
                        : fallbackImages;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {items.map((url, idx) => {
                            const isAct = (vehicleDetailActivePhoto === url) || (!vehicleDetailActivePhoto && idx === 0);
                            return (
                              <div
                                key={idx}
                                onClick={() => setVehicleDetailActivePhoto(url)}
                                className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 relative ${isAct ? 'ring-4 ring-orange-500 border-transparent shadow-md' : 'border-slate-100 hover:border-slate-300 hover:shadow-xs'}`}
                              >
                                <div className="h-20 sm:h-24 bg-slate-100 relative">
                                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition duration-350 group-hover:scale-105" referrerPolicy="no-referrer" />
                                </div>
                                <div className="p-2 sm:p-3 bg-white text-center">
                                  <span className="text-[10px] font-black text-slate-705 uppercase tracking-wider leading-none">Photo #{idx + 1}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Amenities and Features specs card */}
                  <div className="bg-white border border-sky-50 shadow-md p-6 sm:p-8 rounded-[32px] space-y-6">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 font-mono">📋 Cabin Amenities & Fleet Specifications</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold whitespace-pre-line">
                        {selectedVehicleForDetail.details || "Luxury passenger vehicle engineered for interstate voyages, offering absolute safety, cushioned ergonomics, high shock absorption suspension, and premium cabin ventilation style to elevate group tours."}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-sky-50 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">⚙️ Mechanical & Design Features</h4>
                        <ul className="space-y-2 text-xs text-slate-600 font-semibold">
                          <li className="flex items-center gap-2">
                            <span className="text-teal-600 font-bold">🚍 Vehicle Class:</span>
                            <span>{selectedVehicleForDetail.capacity <= 10 ? 'Premium SUV Cabin' : selectedVehicleForDetail.capacity <= 17 ? 'Luxury Force Traveller Class' : 'Elite Intercity Coach Bus'}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-teal-600 font-bold">💺 Seating Layout:</span>
                            <span>{selectedVehicleForDetail.capacity} Seaters pushback recliners</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-teal-600 font-bold">🛠 Build Standard:</span>
                            <span className="capitalize">{selectedVehicleForDetail.condition || 'Excellent (Model Year 2024)'}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-teal-600 font-bold">📍 Regional base:</span>
                            <span>Stationed at {selectedVehicleForDetail.city} garage depot</span>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">✨ Modern Passenger Comforts</h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase">
                          <span className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-sky-50/50">
                            <span className="text-emerald-500">✓</span> Reclining Seats
                          </span>
                          <span className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-sky-50/50">
                            <span className="text-emerald-500">✓</span> Mobile Charging
                          </span>
                          <span className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-sky-50/55">
                            <span className="text-emerald-500">✓</span> Audio Bluetooth
                          </span>
                          <span className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-sky-50/55">
                            <span className="text-emerald-500">✓</span> AC Cooling Vent
                          </span>
                          <span className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-sky-50/55">
                            <span className="text-emerald-500">✓</span> Clean Curtains
                          </span>
                          <span className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-sky-50/55">
                            <span className="text-emerald-500">✓</span> Professional Driver
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Traveler Reviews Component */}
                  <div className="bg-white border border-sky-50 shadow-md p-6 sm:p-8 rounded-[32px] space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                        <Star className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                        <span>Verifiable Passenger Reviews ({selectedVehicleForDetail.reviews.length})</span>
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 text-xs font-black">
                        <span>★</span> <span>{selectedVehicleForDetail.rating || '4.8'} / 5.0 Rating</span>
                      </div>
                    </div>

                    {selectedVehicleForDetail.reviews.length === 0 ? (
                      <div className="text-center py-8 text-slate-450 italic text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                        No reviews submitted yet for this fleet unit.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedVehicleForDetail.reviews.map((rev, rIdx) => (
                          <div key={rev.id || rIdx} className="p-4 bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-2xl transition duration-150 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">
                                  {rev.customerName.charAt(0)}
                                </div>
                                <span className="text-xs font-black text-slate-805">{rev.customerName}</span>
                              </div>
                              <span className="text-xs text-orange-500 font-extrabold flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, starIdx) => (
                                  <span key={starIdx} className={starIdx < rev.rating ? "text-orange-500" : "text-slate-200"}>★</span>
                                ))}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 italic pl-9">"{rev.comment}"</p>
                            <div className="text-right text-[9px] text-slate-400 font-semibold pl-9">
                              Verified Hire Journey • June 2026
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right block (col-span-4): Cost & Inquiry Sticky Widget */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Pricing and booking actions */}
                  <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-[32px] shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest mb-1 font-mono">Standard Fleet Rate</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3.5xl font-black text-orange-400">₹{selectedVehicleForDetail.pricePerKm}</span>
                        <span className="text-xs font-bold text-slate-300">/ Kilometer</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5 font-medium">
                        *Inclusive of professional commercial chauffeur service and vehicle health permit insurance.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-3.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-405 uppercase text-[9px] tracking-wider">
                        <span>Min Daily Run</span>
                        <span className="font-mono text-white text-xs">200 Km / Day limit</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-405 uppercase text-[9px] tracking-wider">
                        <span>Fuel Taxes</span>
                        <span className="text-emerald-400 text-xs">COMMERCIAL FUEL INCLUDED</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-405 uppercase text-[9px] tracking-wider">
                        <span>Driver Stay/Batta</span>
                        <span className="text-slate-200 text-xs font-mono">₹300/Day approx</span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVehicle(selectedVehicleForDetail);
                          setFromCity(selectedVehicleForDetail.city);
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white border-none font-black py-3.5 px-6 rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-orange-950/40 transition flex items-center justify-center gap-2"
                      >
                        Raise Route Inquiry
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[9px] text-slate-400 block text-center mt-3 font-semibold leading-normal font-mono">
                        Launches passenger routes setup & calendars instantly.
                      </span>
                    </div>
                  </div>

                  {/* Certified Garage Status */}
                  <div className="bg-white border border-sky-50 shadow-md p-6 sm:p-8 rounded-[32px] space-y-4 text-xs font-semibold text-slate-700">
                    <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest font-mono">Depot Verification & Compliance</span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-black text-lg">
                        🤝
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{selectedVehicleForDetail.agencyName}</h4>
                        <span className="text-[9px] font-black text-emerald-600 block uppercase tracking-wider mt-0.5">★ Top Verified Partner</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-[10px] leading-relaxed text-slate-500 uppercase tracking-wide font-black">
                      <p className="flex items-start gap-1"><span className="text-emerald-500">✓</span> Commercial Permit Active</p>
                      <p className="flex items-start gap-1"><span className="text-emerald-500">✓</span> Real-Time GPS Tracking Enabled</p>
                      <p className="flex items-start gap-1"><span className="text-emerald-500">✓</span> Verified Double Vaccinated Drivers</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : selectedPackageForDetail ? (
            <div className="space-y-8 animate-fade-in text-slate-800">
              
              {/* Back to Explore Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackageForDetail(null);
                    setDetailActivePhoto('');
                  }}
                  className="group flex items-center gap-2 text-slate-600 hover:text-slate-930 font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer border-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                  <span>← Back to Curated Packages</span>
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block">All-Inclusive Luxury Holiday</span>
                </div>
              </div>

              {/* Main Banner */}
              <div className="relative rounded-[32px] overflow-hidden shadow-xl bg-slate-900 text-white min-h-[220px] sm:min-h-[280px] flex flex-col justify-end p-6 sm:p-10">
                <img
                  src={detailActivePhoto || selectedPackageForDetail.photoUrl}
                  referrerPolicy="no-referrer"
                  alt={selectedPackageForDetail.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="relative z-10 space-y-3 max-w-3xl">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white px-3 py-1 rounded-full inline-block">
                    {selectedPackageForDetail.durationDays} Days • {selectedPackageForDetail.fromCity} ➔ {selectedPackageForDetail.toCity}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none text-white">{selectedPackageForDetail.title}</h1>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium opacity-95">{selectedPackageForDetail.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-[11px] font-bold text-amber-400 pt-2">
                    <span>🏨 {selectedPackageForDetail.hotelName} ({selectedPackageForDetail.hotelRating})</span>
                    <span>•</span>
                    <span>🚍 Transit: {selectedPackageForDetail.vehicleName}</span>
                    <span>•</span>
                    <span className="text-teal-400">Published by: <span className="underline font-black">{selectedPackageForDetail.agencyName}</span></span>
                  </div>
                </div>
              </div>

              {/* Split Content layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Media Gallery, Stops Itinerary, Hotel Specs, Culinary Menu */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Photo Gallery details */}
                  <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">📸 Interactive Hotel rooms & Sights Gallery</h3>
                    <p className="text-xs text-slate-500 font-medium">Click on any thumbnail below to swap the main package showcase photo:</p>
                    
                    {(() => {
                      const items: { title: string; caption: string; url: string }[] = [];
                      
                      // Push uploaded hotel images if they exist
                      if (selectedPackageForDetail.hotelImages && selectedPackageForDetail.hotelImages.length > 0) {
                        selectedPackageForDetail.hotelImages.forEach((img, idx) => {
                          items.push({
                            title: `Staying Photo #${idx + 1}`,
                            caption: `Hotel Suite / Resort view`,
                            url: img
                          });
                        });
                      }
                      
                      // Push uploaded vehicle images if they exist
                      if (selectedPackageForDetail.vehicleImages && selectedPackageForDetail.vehicleImages.length > 0) {
                        selectedPackageForDetail.vehicleImages.forEach((img, idx) => {
                          items.push({
                            title: `Transit Sights #${idx + 1}`,
                            caption: `Vehicle and Seat interior views`,
                            url: img
                          });
                        });
                      }
                      
                      // Fallback elements if there are no custom uploaded hotel/vehicle images
                      if (items.length === 0) {
                        items.push(
                          { title: 'Luxury Resort Lobby', caption: 'Premium hotel lounge', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400' },
                          { title: 'Premium Bedroom Suite', caption: 'Deluxe double bed suite', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=400' },
                          { title: 'Executive Restaurant', caption: 'Buffet and fine dining', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=400' },
                          { title: 'Pilgrimage Sights', caption: 'Spiritual heritage sights', url: 'https://images.unsplash.com/photo-1544227653-83588169c825?auto=format&fit=crop&q=80&w=400' },
                          { title: 'Coastal Scenic Views', caption: 'Beautiful shoreline vistas', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400' },
                          { title: 'Sacred Hill Ranges', caption: 'Peaceful hiking trails & peak', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400' }
                        );
                      }

                      return (
                        <>
                          {/* Desktop Grid Layout (sm and up) */}
                          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-4">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => setDetailActivePhoto(item.url)}
                                className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 relative ${detailActivePhoto === item.url ? 'ring-4 ring-orange-500 border-transparent shadow-md' : 'border-slate-100 hover:border-slate-300 hover:shadow-xs'}`}
                              >
                                <div className="h-24 bg-slate-100 relative">
                                  <img src={item.url} alt={item.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                                </div>
                                <div className="p-3 bg-white">
                                  <span className="text-[10px] font-black text-orange-600 tracking-widest block uppercase leading-none">{item.title}</span>
                                  <span className="text-[9px] font-semibold text-slate-400 block line-clamp-1 mt-1 leading-none">{item.caption}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Mobile 3D Stack / Tinder-style Showcase Carousel (Mobile ONLY) */}
                          <div className="block sm:hidden relative mt-8 pb-6">
                            {/* The 3D Stack Container Stage */}
                            <div className="relative h-[290px] w-full flex items-center justify-center">
                              {items.map((item, idx) => {
                                // Dynamic cyclic stack mapping relative to active mobile image list offset
                                let offset = idx - mobileGalleryIndex;
                                if (offset < 0) {
                                  offset += items.length;
                                }

                                // Visible cards constraint (top 3)
                                const isVisible = offset < 3;
                                
                                // Beautiful structural positions for 3D stack
                                let scale = 1;
                                let translateY = 0;
                                let rotate = 0;
                                let opacity = 1;
                                let zIndex = 30;

                                if (offset === 0) {
                                  scale = 1;
                                  translateY = 0;
                                  rotate = 0;
                                  opacity = 1;
                                  zIndex = 30;
                                } else if (offset === 1) {
                                  scale = 0.93;
                                  translateY = -15;
                                  rotate = 3;
                                  opacity = 0.9;
                                  zIndex = 20;
                                } else if (offset === 2) {
                                  scale = 0.86;
                                  translateY = -30;
                                  rotate = -3;
                                  opacity = 0.7;
                                  zIndex = 10;
                                } else {
                                  scale = 0.8;
                                  translateY = -45;
                                  rotate = 0;
                                  opacity = 0;
                                  zIndex = 0;
                                }

                                const isActiveInStack = idx === mobileGalleryIndex;
                                const isPhotoInShowcase = detailActivePhoto === item.url || (!detailActivePhoto && idx === 0);

                                const handleStackCardClick = () => {
                                  setMobileGalleryIndex(idx);
                                  setDetailActivePhoto(item.url);
                                };

                                return (
                                  <motion.div
                                    key={idx}
                                    onClick={handleStackCardClick}
                                    style={{
                                      transformOrigin: 'bottom center',
                                      zIndex: zIndex,
                                    }}
                                    animate={{
                                      scale: scale,
                                      y: translateY,
                                      rotate: rotate,
                                      opacity: isVisible ? opacity : 0,
                                    }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 300,
                                      damping: 25
                                    }}
                                    className={`absolute w-[82%] max-w-[280px] h-[250px] rounded-3xl overflow-hidden border bg-white shadow-xl cursor-pointer transition-colors duration-150 ${
                                      isActiveInStack 
                                        ? 'border-orange-500 ring-2 ring-orange-500/20' 
                                        : 'border-slate-100'
                                    }`}
                                  >
                                    <div className="relative w-full h-full">
                                      {/* Scenic Room Background Image */}
                                      <img 
                                        src={item.url} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      {/* Tinder Style Ambient Dark Overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                                      {/* Top tag details */}
                                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
                                        {item.title.toLowerCase().includes('stay') || item.title.toLowerCase().includes('resort') || item.title.toLowerCase().includes('bedroom') || item.title.toLowerCase().includes('lobby') ? 'Stay / Room' : 'Local Sight'}
                                      </div>

                                      {isPhotoInShowcase && (
                                        <div className="absolute top-3 right-3 bg-orange-500 text-white text-[8px] font-bold px-2.2 py-0.5 rounded-full uppercase tracking-widest shadow animate-pulse">
                                          Active Showcase
                                        </div>
                                      )}

                                      {/* Bottom metadata tags */}
                                      <div className="absolute bottom-4 left-4 right-14 text-left">
                                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block leading-tight mb-1">
                                          {item.title}
                                        </span>
                                        <span className="text-xs font-bold text-white block line-clamp-1 leading-none">
                                          {item.caption}
                                        </span>
                                      </div>

                                      {/* Interactive hotstar styled control bubbles */}
                                      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                          isPhotoInShowcase
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                                            : 'bg-black/40 border-white/30 text-white'
                                        }`}>
                                          {isPhotoInShowcase ? (
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                            </svg>
                                          ) : (
                                            <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Mobile Swipe Indicators Tray */}
                            <div className="text-center mt-4">
                              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mb-2.5">
                                Tap card to swap cover • Gallery Card: <span className="text-orange-600 font-black">{mobileGalleryIndex + 1}/{items.length}</span>
                              </div>
                              
                              {/* Layout Controls */}
                              <div className="flex items-center justify-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prevIdx = (mobileGalleryIndex - 1 + items.length) % items.length;
                                    setMobileGalleryIndex(prevIdx);
                                    setDetailActivePhoto(items[prevIdx].url);
                                  }}
                                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border-none flex items-center justify-center text-slate-700 font-black cursor-pointer shadow-sm active:scale-95 transition"
                                >
                                  ◀
                                </button>

                                {/* Center Tinder Swipe Next Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextIdx = (mobileGalleryIndex + 1) % items.length;
                                    setMobileGalleryIndex(nextIdx);
                                    setDetailActivePhoto(items[nextIdx].url);
                                  }}
                                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none rounded-full text-white font-extrabold text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>🔥 Swipe Next</span>
                                  <span>➔</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextIdx = (mobileGalleryIndex + 1) % items.length;
                                    setMobileGalleryIndex(nextIdx);
                                    setDetailActivePhoto(items[nextIdx].url);
                                  }}
                                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border-none flex items-center justify-center text-slate-700 font-black cursor-pointer shadow-sm active:scale-95 transition"
                                >
                                  ▶
                                </button>
                              </div>

                              {/* Small Dot Indicators */}
                              <div className="flex items-center justify-center gap-1.5 mt-4">
                                {items.map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      setMobileGalleryIndex(i);
                                      setDetailActivePhoto(items[i].url);
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 border-none p-0 cursor-pointer ${
                                      i === mobileGalleryIndex 
                                        ? 'w-5 bg-orange-500' 
                                        : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Stops Timeline Itinerary */}
                  <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                        <MapPin className="w-5 h-5 text-orange-505" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-slate-800">Complete Itinerary & Sightseeing stops</h3>
                        <p className="text-xs text-slate-500 font-semibold">Custom-crafted step timeline for the entire tour.</p>
                      </div>
                    </div>

                    <div className="relative border-l-4 border-dashed border-orange-100 pl-6 sm:pl-8 ml-4 space-y-8 py-2">
                      <div className="relative">
                        <div className="absolute -left-[34px] sm:-left-[42px] top-0 w-6 h-6 rounded-full bg-slate-900 border-4 border-white shadow flex items-center justify-center text-[8px] text-white font-black">
                          A
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DEPARTURE ROUTE</span>
                          <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">{selectedPackageForDetail.fromCity} Point</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Direct AC transit with on-demand rest stops and professional assistance.</p>
                        </div>
                      </div>

                      {selectedPackageForDetail.stops.map((stop, sIdx) => (
                        <div key={stop} className="relative">
                          <div className="absolute -left-[34px] sm:-left-[42px] top-0 w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow flex items-center justify-center text-[8px] text-white font-black animate-pulse">
                            {sIdx + 1}
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">STAGE STOP NO. {sIdx + 1}</span>
                            <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">{stop} Exploration</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Experience deep historical sightseeing at {stop}. Includes dedicated entry passes, clean local guides, and comfortable shuttle transit.
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="relative">
                        <div className="absolute -left-[34px] sm:-left-[42px] top-0 w-6 h-6 rounded-full bg-slate-900 border-4 border-white shadow flex items-center justify-center text-[8px] text-white font-black">
                          Z
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RETURN ROUTE</span>
                          <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Return Arrival back at {selectedPackageForDetail.toCity}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Returning check-outs, packing guides, souvenir stops, and direct drop-off right at your hometown coordinates.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gourmet Meal Board Catering */}
                  <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Utensils className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-slate-800">🍱 All Inclusive Board Catering Menus</h3>
                        <p className="text-xs text-slate-500 font-semibold">Gourmet meals cooked under stringent quality standards.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                      
                      {/* BREAKFAST */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🍳</span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 font-black">Breakfast Menu</span>
                        </div>
                        <ul className="space-y-2 text-xs font-semibold text-slate-700">
                          <li className="flex items-start gap-1 pb-1.5 border-b border-dashed border-slate-200">
                            <span className="text-emerald-500">✓</span> <span>Hot Puri-Bhaji and Poha</span>
                          </li>
                          <li className="flex items-start gap-1 pb-1.5 border-b border-dashed border-slate-200">
                            <span className="text-emerald-500">✓</span> <span>Authentic Sev-Khaman snacks</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-emerald-500">✓</span> <span>Fresh Ginger Tea / Filter Coffee</span>
                          </li>
                        </ul>
                      </div>

                      {/* LUNCH */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🍛</span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 font-black">Lunch Menu</span>
                        </div>
                        <ul className="space-y-2 text-xs font-semibold text-slate-700">
                          <li className="flex items-start gap-1 pb-1.5 border-b border-dashed border-slate-200">
                            <span className="text-emerald-500">✓</span> <span>Unlimited Gujarati Deluxe Thali</span>
                          </li>
                          <li className="flex items-start gap-1 pb-1.5 border-b border-dashed border-slate-200">
                            <span className="text-emerald-500">✓</span> <span>Butter Roti with 3 Fresh Sabzis</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-emerald-500">✓</span> <span> Bengali Sweets & Chilled Chaas</span>
                          </li>
                        </ul>
                      </div>

                      {/* DINNER */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🍽️</span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 font-black">Dinner Menu</span>
                        </div>
                        <ul className="space-y-2 text-xs font-semibold text-slate-700">
                          <li className="flex items-start gap-1 pb-1.5 border-b border-dashed border-slate-200">
                            <span className="text-emerald-500">✓</span> <span>Kathiyawadi Ringan no Oro</span>
                          </li>
                          <li className="flex items-start gap-1 pb-1.5 border-b border-dashed border-slate-200">
                            <span className="text-emerald-500">✓</span> <span>Bajra no Rotlo with Ghee butter</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-emerald-500">✓</span> <span>Aromatic Khichdi-Kadhi / Paneer Thali</span>
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Interactive Selector & Seats layouts */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Vehicle Selector */}
                  <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-sm space-y-4">
                    <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">VEHICLE CLASSIFICATION</span>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Select Transit Fleet Size</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Choose a vehicle sized for your travel group. Upgrade options available:</p>
                    
                    <div className="space-y-3 pt-1">
                      {[
                        { title: 'Toyota Innova Crysta Class', capacity: 7, icon: '🚘', info: 'Pilot seat cabin' },
                        { title: 'Luxury AC Force Traveller', capacity: 12, icon: '🚐', info: 'Ideal for groups' },
                        { title: 'Elite Executive Coach Bus', capacity: 17, icon: '🚎', info: 'Sofa chairs' },
                        { title: 'Royal Deluxe Volvo Voyager', capacity: 25, icon: '🚌', info: 'Heavy group Bus' },
                      ].map((fleet) => {
                        const isSelected = detailSelectedCapacity === fleet.capacity;
                        const optionPricePerPerson = selectedPackageForDetail 
                          ? getAdjustedPackagePrice(selectedPackageForDetail, fleet.capacity)
                          : 0;
                        const defaultCap = selectedPackageForDetail ? (Number(selectedPackageForDetail.vehicleCapacity) || 12) : 12;
                        const defaultPrice = selectedPackageForDetail ? selectedPackageForDetail.pricePerPerson : 0;
                        const priceDiff = optionPricePerPerson - defaultPrice;
                        const diffText = priceDiff === 0 ? 'Base price' : priceDiff > 0 ? `+₹${priceDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(priceDiff).toLocaleString('en-IN')}`;

                        return (
                          <div
                            key={fleet.capacity}
                            onClick={() => {
                              setDetailSelectedVehicle(fleet.title);
                              setDetailSelectedCapacity(fleet.capacity);
                              if (detailNumPassengers > fleet.capacity) {
                                setDetailNumPassengers(fleet.capacity);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${isSelected ? 'border-orange-500 bg-orange-50/25 shadow-md ring-2 ring-orange-100' : 'border-slate-150 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{fleet.icon}</span>
                              <div className="grow">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-extrabold text-slate-800">{fleet.title}</h4>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    ₹{optionPricePerPerson.toLocaleString('en-IN')} / person
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                  {fleet.capacity} Seats • {fleet.info} • ({diffText})
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Seats Grid Drawer */}
                    <div className="pt-3 border-t border-dashed border-slate-200 space-y-2">
                      <span className="text-[9px] uppercase font-black text-slate-400 block tracking-widest font-black">💺 PHYSICAL CABIN SEAT SCHEMATIC PREVIEW</span>
                      <div className="grid grid-cols-4 gap-1.5 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl items-center justify-center">
                        {Array.from({ length: detailSelectedCapacity }).map((_, seatIdx) => {
                          const seatNo = seatIdx + 1;
                          const isAssigned = seatNo <= detailNumPassengers;
                          return (
                            <div
                              key={seatIdx}
                              className={`h-7 w-7 rounded-lg text-[9px] font-extrabold flex items-center justify-center transition uppercase ${isAssigned ? 'bg-orange-500 text-white shadow shadow-orange-200' : 'bg-slate-200 text-slate-500'}`}
                              title={isAssigned ? `Seat ${seatNo}: Selected` : `Seat ${seatNo}: Available`}
                            >
                              S{seatNo}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-[9px] text-slate-400 text-center block font-semibold leading-none">Driver seat is positioned directly at Front Column</span>
                    </div>
                  </div>

                  {/* calendar indicating when vehicle is free */}
                  <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">LIVE FLEET SCHEDULER</span>
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-805">Vehicle Availability Calendar</h3>
                      </div>
                      <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border border-teal-150">Live Sync</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Select which date you want to depart on. Hand-check busy days in real-time below:
                    </p>

                    {(() => {
                      const year = currentCalendarMonth.getFullYear();
                      const monthIdx = currentCalendarMonth.getMonth(); // 0-11
                      const monthName = currentCalendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                      
                      const totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                      // Day of week index for Day 1: 0 (Sun), 1 (Mon), ..., 6 (Sat)
                      const firstDayIndex = new Date(year, monthIdx, 1).getDay();

                      // Day of the week names
                      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

                      // Let's get active list of busy reservations for the active categories
                      const catActiveReservations = getReservationsForCategory(detailSelectedCapacity);

                      return (
                        <div className="space-y-4">
                          {/* Calendar Month Selector & Grid */}
                          <div className="flex items-center justify-between bg-[#f8f9fa] p-3 rounded-2xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setCurrentCalendarMonth(new Date(year, monthIdx - 1, 1))}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-black rounded-lg cursor-pointer transition uppercase"
                            >
                              ◀ PREV
                            </button>
                            <span className="text-xs font-black uppercase text-slate-800 tracking-tight">
                              📅 {monthName}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCurrentCalendarMonth(new Date(year, monthIdx + 1, 1))}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-black rounded-lg cursor-pointer transition uppercase"
                            >
                              NEXT ▶
                            </button>
                          </div>

                          {/* Grid Headers */}
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {weekdays.map(day => (
                              <div key={day} className="text-[8px] font-black tracking-wider text-slate-400 py-1 font-mono">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Grid Cells */}
                          <div className="grid grid-cols-7 gap-1.5">
                            {/* Empty spacing for offsetting start day of month */}
                            {Array.from({ length: firstDayIndex }).map((_, emptyIdx) => (
                              <div key={`empty-${emptyIdx}`} className="aspect-square bg-slate-50/40 rounded-xl border border-dotted border-slate-100" />
                            ))}

                            {/* Days mapping */}
                            {Array.from({ length: totalDaysInMonth }).map((_, dIdx) => {
                              const day = dIdx + 1;
                              const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              
                              const { isBooked, occupiedCount, totalFleet } = getFleetBookingStatus(detailSelectedCapacity, dateStr);
                              const isChosen = detailSelectedDate === dateStr;

                              return (
                                <button
                                  key={`day-${day}`}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => setDetailSelectedDate(dateStr)}
                                  className={`aspect-square rounded-2xl border transition-all duration-150 p-1 flex flex-col items-center justify-between relative cursor-pointer border-none ${
                                    isBooked
                                      ? 'bg-rose-50 border-rose-100 text-rose-400 opacity-65 cursor-not-allowed'
                                      : isChosen
                                        ? 'bg-orange-500 text-white border-transparent shadow shadow-orange-350 hover:bg-orange-600'
                                        : 'bg-white border text-slate-700 hover:border-slate-350 hover:bg-slate-50'
                                  }`}
                                  title={`${dateStr} Status: ${isBooked ? '🔴 Booked out!' : `🟢 Free (${occupiedCount}/${totalFleet} busy)`}`}
                                >
                                  <span className="text-[10px] font-black block mt-0.5">{day}</span>
                                  
                                  <span className={`text-[6px] font-black uppercase px-0.5 py-0.5 rounded leading-none ${
                                    isBooked 
                                      ? 'bg-rose-100 text-rose-700' 
                                      : isChosen 
                                        ? 'bg-white/25 text-white animate-pulse' 
                                        : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {isBooked ? 'FULL' : `${totalFleet - occupiedCount} FREE`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Current Occupancy Ledger / Reservations List */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mt-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">📋 ACTIVE FLEET OCCUPANCY LEDGER</span>
                              <span className="text-[8px] font-mono font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-700 uppercase">
                                {detailSelectedCapacity <= 7 ? 'Sedan Fleet (3)' : detailSelectedCapacity <= 17 ? 'Traveller Fleet (2)' : 'Bus Coach (1)'}
                              </span>
                            </div>

                            {catActiveReservations.length === 0 ? (
                              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                No active confirmed/accepted bookings for this fleet category on file. 
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-36 overflow-y-auto">
                                {catActiveReservations.map((resv, rIdx) => {
                                  // calculate days
                                  const sDate = new Date(resv.startDate);
                                  const eDate = new Date(resv.endDate);
                                  const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                  return (
                                    <div key={resv.id || rIdx} className="p-2 border border-slate-200 bg-white rounded-xl text-[10px] flex justify-between items-start gap-2">
                                      <div className="space-y-0.5">
                                        <div className="font-extrabold text-slate-800">
                                          👤 {resv.customerName}
                                        </div>
                                        <div className="text-slate-500 font-semibold">
                                          Route: {resv.fromCity} ➔ {resv.toCity}
                                        </div>
                                        <div className="text-[9px] font-mono font-bold text-slate-400">
                                          📅 {resv.startDate} to {resv.endDate} ({diffDays} Days)
                                        </div>
                                      </div>
                                      <span className="text-[8px] uppercase tracking-wide bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-100">
                                        {resv.status}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {detailSelectedDate ? (
                      <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-100 text-[11px] rounded-xl font-bold flex items-center gap-2">
                        <span>🚀 Travel Date:</span>
                        <span className="font-extrabold underline">{new Date(detailSelectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-rose-600 font-extrabold uppercase animate-pulse">
                        ⚠️ Please click one of the GREEN "FREE" calendar tiles above to reserve!
                      </p>
                    )}
                  </div>

                  {/* Traveler counters */}
                  <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] shadow-sm space-y-4">
                    <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest font-black">PASSENGERS</span>
                    <h3 className="text-xs font-black uppercase text-slate-800">Total Group Companions</h3>
                    
                    <div className="flex items-center gap-4 bg-slate-50 p-2 border border-slate-150 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => detailNumPassengers > 1 && setDetailNumPassengers(detailNumPassengers - 1)}
                        className="w-10 h-10 bg-white border border-slate-200 text-slate-700 hover:bg-slate-150 rounded-xl flex items-center justify-center font-black text-lg transition shadow-xs cursor-pointer border-none"
                      >
                        -
                      </button>
                      <div className="grow text-center">
                        <span className="text-base font-black text-slate-800 block leading-none">{detailNumPassengers}</span>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase mt-1 leading-none">Passengers ({detailSelectedCapacity} Max)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => detailNumPassengers < detailSelectedCapacity && setDetailNumPassengers(detailNumPassengers + 1)}
                        className="w-10 h-10 bg-white border border-slate-200 text-slate-700 hover:bg-slate-150 rounded-xl flex items-center justify-center font-black text-lg transition shadow-xs cursor-pointer border-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Finalized Invoices */}
                  <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[32px] shadow-xl space-y-6">
                    <span className="text-[10px] uppercase font-black text-orange-400 block tracking-widest">FINAL STATEMENT INVOICE</span>
                    
                    <div className="space-y-3 border-b border-dashed border-white/10 pb-4 text-xs font-semibold">
                      <div className="flex justify-between items-center text-slate-350">
                        <span>Base price (1 Passenger):</span>
                        <span>₹{getAdjustedPackagePrice(selectedPackageForDetail, detailSelectedCapacity).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-350">
                        <span>Group Travelers counter:</span>
                        <span>{detailNumPassengers} Passengers</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-350">
                        <span>Vehicle Selection Adjustment:</span>
                        <span className="text-teal-400">
                          {(() => {
                            const defaultCap = Number(selectedPackageForDetail.vehicleCapacity) || 12;
                            if (detailSelectedCapacity === defaultCap) {
                              return 'Default Coach Rate';
                            }
                            const ratio = getPackageFleetMultiplier(detailSelectedCapacity) / getPackageFleetMultiplier(defaultCap);
                            const percentChange = Math.round((ratio - 1) * 100);
                            return `${percentChange >= 0 ? '+' : ''}${percentChange}% ${percentChange >= 0 ? 'Upgrade charge' : 'Saver rate'}`;
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase font-extrabold text-slate-200">TOTAL COST ESTIMATE:</span>
                        <span className="text-xl font-black text-emerald-400">
                          ₹{Math.round(
                            getAdjustedPackagePrice(selectedPackageForDetail, detailSelectedCapacity) 
                            * detailNumPassengers
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 opacity-90 block leading-tight font-medium">
                        Covers resort lodging, full board 3-tier food plans, tolls, driver charges, sightseeing guidance, and transfers.
                      </span>
                    </div>

                    {packageFormSuccess && (
                      <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] rounded-xl font-bold leading-normal">
                        {packageFormSuccess}
                      </div>
                    )}

                    <form onSubmit={(e) => handleBookPackageDetailSubmit(e, selectedPackageForDetail)}>
                      <button
                        type="submit"
                        disabled={!detailSelectedDate}
                        className={`w-full py-4 rounded-full uppercase tracking-widest text-[11px] font-black shadow-lg cursor-pointer border-none flex items-center justify-center gap-1.5 transition duration-300 ${
                          detailSelectedDate 
                            ? 'bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white hover:scale-[1.01]' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {detailSelectedDate ? '⚡ Finalize Full Board Package Booking' : '⚠️ Select Live Date Slot above'}
                      </button>
                    </form>

                  </div>

                </div>

              </div>

            </div>
          ) : (
            <>
              {/* SEARCH MODE TOGGLE: Packages vs Custom Plan */}
          <div className="flex bg-slate-100 p-1 rounded-2xl max-w-sm border border-slate-200">
            <button
              onClick={() => setSearchMode('packages')}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${searchMode === 'packages' ? 'bg-orange-500 shadow-md text-white' : 'text-slate-650 hover:text-slate-900'}`}
            >
              🗺️ Curated Packages
            </button>
            <button
              onClick={() => setSearchMode('custom')}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${searchMode === 'custom' ? 'bg-orange-500 shadow-md text-white' : 'text-slate-650 hover:text-slate-900'}`}
            >
              🚐 Custom Planner
            </button>
          </div>

          {searchMode === 'packages' ? (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/20">All-Inclusive Packages</span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-3">Pre-Curated Luxury Holidays</h2>
                <p className="text-xs text-orange-50 opacity-90 mt-1.5 max-w-xl">
                  Save time and money with expert agency itinerary collections featuring pre-booked clean resort hotels, custom fleet transportation, and full board meals (Breakfast, Lunch, Dinner)!
                </p>
              </div>

              {loadingPackages ? (
                <div className="text-center py-12 bg-white rounded-[32px] border border-slate-100 shadow-xs">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-orange-500 rounded-full mb-3" />
                  <p className="text-xs text-slate-500 font-mono">Curating live agency tour packages...</p>
                </div>
              ) : packagesList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[32px] border border-slate-200 p-8 shadow-xs">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-slate-700 font-bold text-sm">No agency-published packages yet!</h4>
                  <p className="text-xs text-slate-500 mt-1">Switch to "Custom Voyage Planner" to map your on-demand itinerary.</p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
                >
                  {packagesList.map(pkg => {
                    const selectedCap = pkgSelectedCapacityArr[pkg.id] || Number(pkg.vehicleCapacity) || 12;
                    const adjustedPricePerson = getAdjustedPackagePrice(pkg, selectedCap);
                    
                    return (
                      <motion.div
                        variants={itemVariants}
                        key={pkg.id}
                        className="bg-white border border-sky-100 rounded-[32px] overflow-hidden shadow-md flex flex-col justify-between hover:shadow-xl transition-all duration-300"
                      >
                        <div>
                          {/* Upper photo section with pricing */}
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                            <img
                              src={pkg.photoUrl}
                              referrerPolicy="no-referrer"
                              alt={pkg.title}
                              className="w-full h-full object-cover opacity-85 hover:scale-105 transition duration-500"
                            />
                            <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md text-amber-400 px-3.5 py-1.5 rounded-full border border-amber-500/30 text-xs font-black flex flex-col items-center">
                              <span className="text-[9px] uppercase tracking-wider text-slate-300 font-extrabold pb-0.5">Varying vehicle price</span>
                              <span className="text-sm font-black">₹{adjustedPricePerson.toLocaleString('en-IN')} <span className="text-slate-350 font-medium text-xs">/ pax</span></span>
                            </div>
                            
                            <div className="absolute bottom-4 left-4 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                              {pkg.durationDays} Days • {pkg.fromCity} ➔ {pkg.toCity}
                            </div>
                          </div>

                          {/* Details section */}
                          <div className="p-6 sm:p-8 space-y-4">
                            <div>
                              <h3 className="text-lg font-black text-slate-805 uppercase tracking-tight line-clamp-1">{pkg.title}</h3>
                              <p className="text-[10px] text-slate-405 font-bold mt-1 uppercase tracking-wide">Published by: <span className="text-teal-600 font-extrabold">{pkg.agencyName}</span></p>
                            </div>

                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{pkg.description}</p>

                            {/* Stops line with beautiful pills */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Transit Stops Route:</span>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black">{pkg.fromCity}</span>
                                {pkg.stops.map((stop, sIdx) => (
                                  <React.Fragment key={stop}>
                                    <span className="text-slate-300 text-[10px] font-black self-center">➔</span>
                                    <span className="px-2 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-lg text-[9px] font-black tracking-wide">{stop}</span>
                                  </React.Fragment>
                                ))}
                                <span className="text-slate-300 text-[10px] font-black self-center">➔</span>
                                <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black">{pkg.toCity}</span>
                              </div>
                            </div>

                            {/* Hotel particulars */}
                            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Resort Accommodation details</span>
                                <span className="text-xs font-extrabold text-slate-805 block mt-0.5">{pkg.hotelName}</span>
                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block mt-0.5">⭐ {pkg.hotelRating}</span>
                              </div>
                            </div>

                            {/* Inclusions Row */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inclusions included:</span>
                              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
                                <div className={`p-2 rounded-xl border ${pkg.inclusions.hotel ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  🏨 HOTELS
                                </div>
                                <div className={`p-2 rounded-xl border ${pkg.inclusions.breakfast ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  🍳 B'FAST
                                </div>
                                <div className={`p-2 rounded-xl border ${pkg.inclusions.lunch ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  🍛 LUNCH
                                </div>
                                <div className={`p-2 rounded-xl border ${pkg.inclusions.dinner ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  🍽️ DINNER
                                </div>
                              </div>
                            </div>

                            {/* Transit Vehicle Selector on Card */}
                            <div className="space-y-2.5 pt-3 border-t border-dashed border-slate-150">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Choose Package Vehicle (Vary Price):</span>
                                <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono">Agency default: {pkg.vehicleCapacity} Pax</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { title: 'Toyota Innova Crysta Class', capacity: 7, label: 'SUV', icon: '🚘' },
                                  { title: 'Luxury AC Force Traveller', capacity: 12, label: 'Traveller', icon: '🚐' },
                                  { title: 'Elite Executive Coach Bus', capacity: 17, label: 'Coach', icon: '🚎' },
                                  { title: 'Royal Deluxe Volvo Voyager', capacity: 25, label: 'Volvo', icon: '🚌' },
                                ].map((fOption) => {
                                  const isAct = selectedCap === fOption.capacity;
                                  const rate = getAdjustedPackagePrice(pkg, fOption.capacity);
                                  return (
                                    <button
                                      key={fOption.capacity}
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPkgSelectedCapacityArr(prev => ({
                                          ...prev,
                                          [pkg.id]: fOption.capacity
                                        }));
                                      }}
                                      className={`py-2 px-1 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                                        isAct
                                          ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-650 shadow-sm scale-[1.03] ring-2 ring-indigo-100'
                                          : 'bg-slate-50 text-slate-650 border-slate-150 hover:bg-slate-100 hover:border-slate-300'
                                      }`}
                                    >
                                      <span className="block text-sm leading-none">{fOption.icon}</span>
                                      <span className="block text-[8px] font-black uppercase leading-normal tracking-tighter mt-1">{fOption.label}</span>
                                      <span className={`block text-[8px] font-bold leading-none mt-0.5 ${isAct ? 'text-indigo-100' : 'text-slate-500 font-extrabold'}`}>
                                        ₹{rate.toLocaleString('en-IN')}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-between text-[9px] py-1 bg-indigo-50/40 px-2.5 rounded-xl border border-indigo-100/40 font-semibold text-slate-500 leading-none">
                                <span className="font-bold">Active Selection:</span>
                                <span className="text-indigo-750 font-black font-mono">
                                  {selectedCap === 7 ? 'Toyota Innova Crysta (7 SEATER)' :
                                   selectedCap === 12 ? 'Luxury AC Force Traveller (12 SEATER)' :
                                   selectedCap === 17 ? 'Elite Executive Coach Bus (17 SEATER)' :
                                   'Royal Deluxe Volvo Voyager (25 SEATER)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inquire/Book command */}
                        <div className="p-6 pt-0">
                          <button
                            onClick={() => {
                              const activeType = selectedCap === 7 ? 'Toyota Innova Crysta Class' :
                                                 selectedCap === 12 ? 'Luxury AC Force Traveller' :
                                                 selectedCap === 17 ? 'Elite Executive Coach Bus' :
                                                 'Royal Deluxe Volvo Voyager';
                              setSelectedPackageForDetail(pkg);
                              setDetailActivePhoto(pkg.photoUrl);
                              setDetailSelectedVehicle(activeType);
                              setDetailSelectedCapacity(selectedCap);
                              setDetailNumPassengers(Math.min(2, selectedCap));
                              setDetailSelectedDate('');
                              setPackageFormSuccess('');
                            }}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-black py-3 rounded-full uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-teal-50 border-none"
                          >
                            <span>⚡ Book With Selected Vehicle</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          ) : (
            <>
              {/* USER ACTION-TRIP REQUIREMENT BUILDER */}
          <div className="bg-white border border-slate-205 rounded-[32px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/15 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="text-sm font-black text-slate-805 mb-6 flex items-center gap-2.5 uppercase tracking-wide">
              <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                <MapPin className="w-5 h-5 text-orange-500" />
              </span>
              Plan Private Voyage & Compare Traveler Options
            </h2>
            
            {/* Row 1: Pickup, Drop, Other Stops */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Pickup Point - Origin City dropdown connected securely to garage list */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Pickup Point (Origin City)</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-orange-500" />
                  <select
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sky-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-150 focus:border-orange-500 text-xs font-bold bg-slate-50 cursor-pointer"
                    value={fromCity}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setFromCity(selected);
                      setCity(selected); // updates garage query instantly
                    }}
                  >
                    {citiesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drop Point - Destination */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Drop Point (Ultimate Destination)</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jaipur Forts / Delhi Airport Drop"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sky-100 text-slate-805 focus:outline-none focus:ring-2 focus:ring-orange-150 focus:border-orange-500 text-xs font-bold bg-slate-50"
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                  />
                </div>
              </div>

              {/* Other Stops They Want Between Trip */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Other stops want between trip (Stops / Places)</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Udaipur City, Mount Abu, Chittorgarh"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sky-100 text-slate-805 focus:outline-none focus:ring-2 focus:ring-orange-150 focus:border-orange-500 text-xs font-bold bg-slate-50"
                    value={placesToCoverInput}
                    onChange={(e) => setPlacesToCoverInput(e.target.value)}
                  />
                </div>
              </div>

            </div>

            {/* Row 2: Duration, One Way vs Two Way, Date, Passengers count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-5">
              
              {/* How Much Days */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">How Much Days (Duration)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sky-100 text-slate-805 focus:outline-none focus:ring-2 focus:ring-orange-150 focus:border-orange-500 text-xs font-bold bg-slate-50 font-mono"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* One Way and Two Way Trip Type toggle */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Trip Style (One Way vs Two Way)</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-sky-50">
                  <button
                    type="button"
                    onClick={() => setTripType('one-way')}
                    className={`py-2 text-[10px] font-black rounded-xl transition-all uppercase ${tripType === 'one-way' ? 'bg-orange-500 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                  >
                    One Way
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('round-trip')}
                    className={`py-2 text-[10px] font-black rounded-xl transition-all uppercase ${tripType === 'round-trip' ? 'bg-orange-500 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                  >
                    Two Way
                  </button>
                </div>
              </div>

              {/* Expected Start Date */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Start Travel Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-sky-100 text-slate-805 focus:outline-none focus:ring-2 focus:ring-orange-150 focus:border-orange-500 text-xs font-bold bg-slate-50 font-mono cursor-pointer"
                  value={startDate || (() => {
                    const today = new Date().toISOString().split('T')[0];
                    return today;
                  })()}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Travelers count */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Travelers Count (Required Seats)</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sky-100 text-slate-805 focus:outline-none focus:ring-2 focus:ring-orange-150 focus:border-orange-500 text-xs font-bold bg-slate-50 font-mono"
                    value={numPassengers}
                    onChange={(e) => setNumPassengers(Number(e.target.value))}
                  />
                </div>
              </div>

            </div>

            {/* Sub-Filters embedded inside to toggle capacities and A/C instantly */}
            <div className="pt-5 mt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mr-1.5">Capacity Shortcuts:</span>
                {['7', '12', '25', '40', '56'].map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setCapacityFilter(size === capacityFilter ? '' : size);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition duration-150 ${capacityFilter === size ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100'}`}
                  >
                    {size} Seater
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Class Selection:</span>
                <select
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-black bg-slate-50 cursor-pointer text-slate-700"
                  value={isAcFilter === null ? '' : String(isAcFilter)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsAcFilter(val === '' ? null : val === 'true');
                  }}
                >
                  <option value="">A/C & Non-A/C Cabins</option>
                  <option value="true">Luxury Air Conditioned (A/C)</option>
                  <option value="false">Non A/C standard cabin</option>
                </select>
              </div>
            </div>

          </div>

          {/* FLEET LOGISTICS RESULTS LIST */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-800 text-lg">
                Available Vehicles in {city} ({vehiclesList.length})
              </h3>
            </div>

            {loadingVehicles ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-3" />
                <p className="text-sm text-slate-500 font-mono">Exploring matching transport garages...</p>
              </div>
            ) : vehiclesList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-slate-700 font-bold text-sm">No vehicles matched your filtered parameters.</h4>
                <p className="text-xs text-slate-500 mt-1">Try broadening your target base cities or selecting "Any Seating Size".</p>
                <button
                  onClick={() => {
                    setCapacityFilter('');
                    setIsAcFilter(null);
                    setCity('Surat');
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                >
                  Reset All Search Filters
                </button>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              >
                {vehiclesList.map(veh => (
                  <motion.div 
                    variants={itemVariants}
                    key={veh.id} 
                    whileHover={{ 
                      y: -8, 
                      scale: 1.015,
                      transition: { duration: 0.25, ease: "easeOut" }
                    }}
                    className="bg-white border border-sky-100 rounded-[32px] overflow-hidden hover:shadow-2xl hover:border-orange-100 transition-all duration-300 flex flex-col justify-between shadow-md"
                  >
                    
                    <div 
                      onClick={() => { setSelectedVehicleForDetail(veh); setVehicleDetailActivePhoto(veh.photoUrl); }}
                      className="cursor-pointer group select-none"
                    >
                      {/* Photo banner */}
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                        <img 
                          src={veh.photoUrl} 
                          alt={veh.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition duration-350 group-hover:scale-105" 
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 text-white font-mono text-[9px] uppercase font-black py-1 px-3 rounded-full flex items-center gap-1 backdrop-blur-md">
                          <Users className="w-3.5 h-3.5" />
                          {veh.capacity} SEATER
                        </div>

                        <div className="absolute top-3 right-3 bg-orange-500 text-white font-mono text-[9px] uppercase font-black py-1 px-3 rounded-full flex items-center gap-1 backdrop-blur-md">
                          {veh.isAc ? 'A/C Class' : 'Non A/C'}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="bg-white/95 text-slate-900 text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1 select-none pointer-events-none">
                            🔍 View Full Details & Photos
                          </span>
                        </div>
                      </div>

                      {/* Info segment */}
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between items-start gap-2 border-b border-dashed border-slate-100 pb-1.5">
                          <h4 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-orange-500 transition duration-150">
                            {veh.name}
                          </h4>
                        </div>

                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <span>Spacer/Fleet Agency:</span>
                          <span className="text-teal-600 font-extrabold uppercase tracking-wide">{veh.agencyName}</span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {veh.details}
                        </p>

                        <div className="pt-3 border-t border-sky-50 grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-400 block uppercase font-black tracking-wider">Base Price</span>
                            <span className="text-orange-500 font-black text-base">₹{veh.pricePerKm}/km</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-black tracking-wider">Condition</span>
                            <span className="text-slate-700 font-extrabold">{veh.condition}</span>
                          </div>
                        </div>

                        {/* Customer Reviews inside vehicle detail view */}
                        <div className="mt-4 pt-4 border-t border-sky-50">
                          <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                            <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                            Reviews & Track Record ({veh.reviews.length})
                          </span>
                          
                          {veh.reviews.length === 0 ? (
                            <span className="text-[10px] text-slate-450 italic block bg-slate-50 p-2 rounded-xl border border-dashed border-slate-100">Zero reviews registered yet.</span>
                          ) : (
                            <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-2xl border border-sky-50">
                              {veh.reviews.slice(0, 2).map((rev, rIdx) => (
                                <div key={rev.id || rIdx} className="text-[10px] leading-snug">
                                  <div className="flex justify-between font-extrabold text-slate-700">
                                    <span>{rev.customerName}</span>
                                    <span className="text-orange-500">★ {rev.rating}</span>
                                  </div>
                                  <p className="text-slate-500 italic mt-0.5">"{rev.comment}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Book / Inquiry command */}
                    <div className="p-6 pt-0">
                      <motion.button
                        whileHover={{ scale: 1.025 }}
                        whileTap={{ scale: 0.975 }}
                        onClick={() => { setSelectedVehicle(veh); setFromCity(veh.city); }}
                        className="w-full bg-teal-600 text-white border-none font-black py-3 px-5 rounded-full hover:bg-teal-700 transition-all duration-150 text-xs flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-teal-100 cursor-pointer"
                      >
                        Raise Route Inquiry
                        <Send className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                  </motion.div>
                ))}
              </motion.div>
            )}

          </div>

        </>
      )}

            </>
          )}

        </div>
      )}

      {/* VIEW 2: MODAL CONFIRMATION DIALOG */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 transform scale-100 transition-all">
            <div className="bg-slate-950 text-white p-6 relative">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest block mb-1">Step 2: Confirm Selection</span>
              <h3 className="text-lg font-black uppercase">Review Voyage & Raise Inquiry</h3>
              <p className="text-xs text-slate-300 mt-1">Direct connect with {selectedVehicle.agencyName}</p>
              <button 
                onClick={() => setSelectedVehicle(null)} 
                className="absolute top-4 right-4 text-white/70 hover:text-white font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formSuccessMsg && (
                <div className="p-4 bg-emerald-50 text-emerald-955 border border-emerald-200 text-xs rounded-2xl font-bold">
                  {formSuccessMsg}
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2 text-xs font-semibold">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                  <span className="text-slate-450">Selected Fleet Unit:</span>
                  <span className="font-extrabold text-slate-805">{selectedVehicle.name}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-450">Pickup Point:</span>
                  <span className="font-bold text-slate-805 uppercase">{fromCity || city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Drop Point:</span>
                  <span className="font-bold text-slate-805 uppercase">{toCity || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Stops Between Trip:</span>
                  <span className="font-bold text-slate-805 text-right max-w-[65%] truncate">{placesToCoverInput || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Travel Duration:</span>
                  <span className="font-bold text-slate-805 font-mono">{durationDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Trip Type:</span>
                  <span className="font-bold text-orange-600 uppercase">{tripType === 'one-way' ? 'One Way' : 'Two Way (Round Trip)'}</span>
                </div>
                <div className="flex justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200 mt-2">
                  <span className="text-slate-500 uppercase font-black text-[9px] tracking-wider leading-none">Vehicle Base Rate:</span>
                  <span className="font-mono font-black text-teal-610">₹{selectedVehicle.pricePerKm}/km</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider ml-1 mb-1 font-displayAndSans">Special Instructions / Remarks (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-805 rounded-xl font-semibold text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="Senior citizens, heavy luggage, GPS tracker requests..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-705 text-xs font-black rounded-full transition uppercase tracking-wider"
                >
                  Change Voyage
                </button>
                <button
                  type="button"
                  disabled={submittingInquiry}
                  onClick={() => handleInquirySubmission(selectedVehicle)}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-full transition uppercase tracking-wider shadow-md shadow-orange-100 flex justify-center items-center gap-2"
                >
                  {submittingInquiry ? 'Sending...' : 'Confirm Inquiry'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MY ACTIVE INQUIRIES & CHAT INTERFACE - WHATSAPP STYLE */}
      {activeTab === 'inquiries' && (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl flex h-[740px] font-sans relative">
          
          {/* WhatsApp Left Sidebar: submitted chats list */}
          <div className={`w-full md:w-80 lg:w-[340px] shrink-0 border-r border-slate-200 flex-col bg-[#f0f2f5] ${selectedInquiry ? 'hidden md:flex' : 'flex'}`}>
            {/* Sidebar header profile */}
            <div className="bg-[#f0f2f5] p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs leading-tight">My Chats</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Customer Thread</p>
                </div>
              </div>
            </div>

            {/* Chats list scroll window */}
            <div className="flex-grow overflow-y-auto bg-white">
              {customerInquiries.length === 0 ? (
                <div className="text-center p-8 mt-12 text-slate-400 text-xs space-y-2">
                  <p>No submitted inquiries found.</p>
                  <p className="text-[10px] text-slate-300 font-bold">Inquire on vehicles from "Search Fleets" to start messaging!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customerInquiries.map(inq => {
                    const isChosen = selectedInquiry?.id === inq.id;
                    return (
                      <button
                        key={inq.id}
                        onClick={() => { setSelectedInquiry(inq); setBookedReceipt(null); setRightPanel('none'); }}
                        className={`w-full text-left p-4 transition-all flex items-center gap-3 border-none cursor-pointer focus:outline-none ${isChosen ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-slate-50'}`}
                      >
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {inq.agencyName.charAt(0).toUpperCase()}
                        </div>
                        {/* Conversation Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-black text-slate-800 text-xs truncate uppercase tracking-tight">{inq.agencyName}</h4>
                            <span className="text-[9px] text-slate-400 font-mono font-bold">{inq.startDate.split('-').slice(1).join('/')}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate font-semibold">
                            Route: {inq.fromCity} ➔ {inq.toCity}
                          </p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              inq.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-250 animate-none' :
                              inq.status === 'accepted' ? 'bg-indigo-100 text-indigo-800 border border-indigo-250 animate-pulse' :
                              inq.status === 'declined' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              'bg-amber-100 text-amber-850 border border-amber-200'
                            }`}>
                              {inq.status}
                            </span>
                            <span className="text-[10px] text-slate-800 font-extrabold font-mono text-right">
                              {inq.finalTotalQuote ? `₹${inq.finalTotalQuote}` : 'Awaiting quote'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Main Workspace on Right */}
          <div className={`flex-grow bg-[#efeae2] relative min-w-0 h-full ${selectedInquiry ? 'flex' : 'hidden md:flex'}`}>
            {!selectedInquiry ? (
              /* WhatsApp Beautiful Idle Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8f9fa] h-full border-r border-[#e9edef]">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6 shadow-md shadow-orange-100 animate-bounce">
                  <MessageSquare className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800 underline decoration-orange-500 decoration-4 underline-offset-4 uppercase tracking-wider">
                  Prvasiq Live Chat Portal
                </h3>
                <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed font-bold">
                  Select a submitted travel inquiry from the left-hand panel thread list to initiate negotiations, map interactive Gemini route suggestions, and finalize secure checkout bookings!
                </p>
                <div className="mt-8 pt-6 border-t border-slate-200/55 w-44 flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-mono tracking-widest font-black uppercase">
                  <span>🔒 Secure Sandbox Exchange</span>
                </div>
              </div>
            ) : (
              /* WhatsApp active chat screen */
              <div className="flex-1 flex min-w-0 h-full relative">
                
                {/* Chat Stream Panel */}
                <div className="flex-grow flex flex-col min-w-0 h-full bg-[#efeae2]">
                  
                  {/* WhatsApp Custom Header */}
                  <div className="bg-[#f0f2f5] px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => { setSelectedInquiry(null); setBookedReceipt(null); setRightPanel('none'); }}
                        className="md:hidden p-2 -ml-2 bg-transparent hover:bg-slate-200 text-slate-600 rounded-full transition-all border-none cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {selectedInquiry.agencyName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-tight truncate">
                          {selectedInquiry.agencyName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          {selectedInquiry.vehicleName} ({selectedInquiry.vehicleCapacity} Seats) • {selectedInquiry.fromCity} ➔ {selectedInquiry.toCity}
                        </p>
                      </div>
                    </div>

                     {/* WhatsApp styled action header tags */}
                     <div className="shrink-0 flex items-center gap-2">
                       {/* Desktop Buttons (SM and wider) */}
                       <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
                         {selectedInquiry.status !== 'confirmed' && (
                           <button
                             type="button"
                             onClick={() => startEditingInquiry(selectedInquiry)}
                             className="px-2 sm:px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 rounded-full text-[9px] sm:text-[10px] font-black uppercase transition-all duration-150 flex items-center gap-1 border-none cursor-pointer"
                           >
                             ✏️ Edit Query
                           </button>
                         )}

                         <button
                           type="button"
                           onClick={() => setRightPanel(rightPanel === 'ai' ? 'none' : 'ai')}
                           className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-150 flex items-center gap-1 border-none cursor-pointer ${
                             rightPanel === 'ai' 
                               ? 'bg-indigo-600 text-white shadow-md' 
                               : 'bg-white border border-slate-200 text-indigo-700 hover:bg-slate-50'
                           }`}
                         >
                           <Sparkles className="w-3.5 h-3.5" />
                           AI Advisor
                         </button>

                         {/* Pay / Receipt button */}
                         {selectedInquiry.status === 'accepted' && selectedInquiry.finalTotalQuote && (
                           <button
                             type="button"
                             onClick={() => setRightPanel(rightPanel === 'billing' ? 'none' : 'billing')}
                             className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-150 flex items-center gap-1 border-none cursor-pointer ${
                               rightPanel === 'billing' 
                                 ? 'bg-[#059669] text-white shadow-md' 
                                 : 'bg-emerald-50 border border-emerald-200 text-[#047857] hover:bg-emerald-100'
                             }`}
                           >
                             <CreditCard className="w-3.5 h-3.5" />
                             Pay & Book
                           </button>
                         )}

                         {selectedInquiry.status === 'confirmed' && (
                           <button
                             type="button"
                             onClick={() => setRightPanel(rightPanel === 'billing' ? 'none' : 'billing')}
                             className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-150 flex items-center gap-1 border-none cursor-pointer ${
                               rightPanel === 'billing' 
                                 ? 'bg-[#059669] text-white shadow-md' 
                                 : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                             }`}
                           >
                             <Printer className="w-3.5 h-3.5 text-emerald-600" />
                             Receipt Voucher
                           </button>
                         )}
                       </div>

                       {/* Mobile 3-Dot Dropdown (Only visible below sm) */}
                       <div className="relative flex lg:hidden items-center">
                         <button
                           type="button"
                           onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                           className={`p-2 bg-transparent hover:bg-slate-200 text-slate-600 rounded-full transition-all border-none cursor-pointer flex items-center justify-center shrink-0 ${headerMenuOpen ? 'bg-slate-200' : ''}`}
                           title="Options"
                         >
                           <MoreVertical className="w-5 h-5" />
                         </button>
 
                         {headerMenuOpen && (
                           <>
                             {/* Close overlay on click away */}
                             <div 
                               className="fixed inset-0 z-40 bg-transparent" 
                               onClick={() => setHeaderMenuOpen(false)}
                             />
                             
                             {/* Dropdown Card */}
                             <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-fade-in text-slate-700 font-sans">
                               {selectedInquiry.status !== 'confirmed' && (
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setHeaderMenuOpen(false);
                                     startEditingInquiry(selectedInquiry);
                                   }}
                                   className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition duration-150 flex items-center gap-3 text-xs font-bold border-none bg-transparent cursor-pointer text-slate-700"
                                 >
                                   <span>✏️</span>
                                   <span>Edit Query</span>
                                 </button>
                               )}
 
                               <button
                                 type="button"
                                 onClick={() => {
                                   setHeaderMenuOpen(false);
                                   setRightPanel(rightPanel === 'ai' ? 'none' : 'ai');
                                 }}
                                 className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition duration-150 flex items-center gap-3 text-xs font-bold border-none bg-transparent cursor-pointer ${rightPanel === 'ai' ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-700'}`}
                               >
                                 <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                                 <span>AI Advisor</span>
                               </button>
 
                               {/* Pay & Book Option */}
                               {selectedInquiry.status === 'accepted' && selectedInquiry.finalTotalQuote && (
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setHeaderMenuOpen(false);
                                     setRightPanel(rightPanel === 'billing' ? 'none' : 'billing');
                                   }}
                                   className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition duration-150 flex items-center gap-3 text-xs font-bold border-none bg-transparent cursor-pointer ${rightPanel === 'billing' ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-700'}`}
                                 >
                                   <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                                   <span>Pay & Book</span>
                                 </button>
                               )}
 
                               {/* Receipt Voucher Option */}
                               {selectedInquiry.status === 'confirmed' && (
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setHeaderMenuOpen(false);
                                     setRightPanel(rightPanel === 'billing' ? 'none' : 'billing');
                                   }}
                                   className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition duration-150 flex items-center gap-3 text-xs font-bold border-none bg-transparent cursor-pointer ${rightPanel === 'billing' ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-700'}`}
                                 >
                                   <Printer className="w-4 h-4 text-emerald-500 shrink-0" />
                                   <span>Receipt Voucher</span>
                                 </button>
                               )}
                             </div>
                           </>
                         )}
                       </div>
                     </div>
                  </div>

                  {/* Messages Window (WhatsApp Wallpaper styled) */}
                  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 shadow-inner bg-[#efeae2]">
                    
                    {/* Centered System Trip Information Banner */}
                    <div className="flex justify-center my-2">
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 max-w-md text-center border border-slate-200 shadow-xs text-[10px] leading-relaxed text-slate-600 space-y-1">
                        <div className="font-black text-slate-800 uppercase tracking-widest text-[9px] mb-1">🏁 Trip Requirements Manifest</div>
                        <div><strong>Origin/Route Stops:</strong> {selectedInquiry.placesToCover && selectedInquiry.placesToCover.length > 0 ? selectedInquiry.placesToCover.join(' ➔ ') : `${selectedInquiry.fromCity} ➔ ${selectedInquiry.toCity}`}</div>
                        <div className="flex justify-center gap-4 mt-1 font-mono text-[9px] font-bold">
                          <span>Dates: {selectedInquiry.startDate} to {selectedInquiry.endDate}</span>
                          <span>Guests: {selectedInquiry.numPassengers} travellers</span>
                          <span>AC: {selectedInquiry.isAc ? 'Luxury A/C' : 'Standard'}</span>
                        </div>
                        {selectedInquiry.remarks && (
                          <div className="mt-2 text-slate-400 bg-slate-50 p-2 rounded-xl text-[10px] italic">
                            " {selectedInquiry.remarks} "
                          </div>
                        )}
                      </div>
                    </div>

                    {inquiryMessages.map(msg => {
                      const isMe = msg.senderId === user.id;
                      const isSystem = msg.senderId === 'system' || msg.senderId === 'Payment Gate';
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col ${isSystem ? 'items-center my-3' : isMe ? 'items-end' : 'items-start'}`}
                        >
                          {isSystem ? (
                            <div className="bg-amber-100 text-amber-950 font-bold border border-amber-200 uppercase tracking-wider text-[9px] px-4 py-1.5 rounded-full inline-block text-center max-w-[90%] font-mono leading-relaxed shadow-xs">
                              {renderMessageContent(msg.content)}
                            </div>
                          ) : (
                            <>
                              <span className="text-[9px] text-slate-400 px-1 font-bold mb-0.5">
                                {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              
                              <div className={`p-3 text-xs rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                                isMe ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                              }`}>
                                {renderMessageContent(msg.content)}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Compose form (WhatsApp style) */}
                  <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] p-3 border-t border-slate-250 flex items-center gap-2.5 shrink-0">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold shadow-xs"
                      placeholder="Type a message to discuss rates, stops, tolls, overnight driver boarding, etc..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="bg-teal-600 text-white p-2.5 rounded-full hover:bg-teal-700 transition duration-150 shadow-md flex items-center justify-center shrink-0 border-none cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </form>

                </div>

                {/* Right Slider Drawer Column (mimics WhatsApp info details layout) */}
                {rightPanel !== 'none' && (
                  <div className="absolute md:relative inset-y-0 right-0 w-full md:w-80 lg:w-[350px] border-l border-slate-250 md:border-l border-slate-200 bg-[#fbfbfb] flex flex-col shrink-0 h-full overflow-y-auto z-20 shadow-xl md:shadow-none">
                    
                    {/* Drawer Header */}
                    <div className="bg-[#f0f2f5] p-3.5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 shrink-0">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        {rightPanel === 'ai' ? (
                          <>
                            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                            AI Route Itinerary
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            Secure Fleet Billing
                          </>
                        )}
                      </h4>
                      <button
                        onClick={() => setRightPanel('none')}
                        className="text-slate-400 hover:text-slate-650 font-black text-xs uppercase bg-transparent border-none cursor-pointer hover:underline"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="p-4 space-y-4">
                      
                      {/* 1. AI AGENT CONTENT */}
                      {rightPanel === 'ai' && (
                        <div className="space-y-4">
                          <div className="bg-indigo-950 text-white rounded-3xl p-5 space-y-3 shadow-md border border-indigo-900">
                            <span className="text-[9px] bg-indigo-800 text-indigo-100 font-black tracking-widest px-3 py-1 rounded-full uppercase">Powered by Gemini AI</span>
                            <p className="text-[11px] text-indigo-200 leading-relaxed font-semibold">
                              Draft custom queries to calculate safety guidelines, landmark options, regional expressway speeds, or budget validation.
                            </p>
                            
                            <div className="space-y-2 pt-1.5">
                              <input
                                type="text"
                                className="w-full bg-indigo-900/40 border border-indigo-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-indigo-300 focus:outline-none focus:border-indigo-400 font-medium font-semibold"
                                placeholder="e.g. List 3 scenic stops between Surat & Goa"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                              />
                              <button
                                onClick={askAIAgent}
                                disabled={aiLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 px-3 rounded-xl transition text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md border-none cursor-pointer"
                              >
                                {aiLoading ? 'GenAI Processing...' : 'Ask AI Agent Assist'}
                              </button>
                            </div>
                          </div>

                          {aiResponse && (
                            <div className="bg-white p-4 rounded-3xl border border-slate-200 font-sans text-xs leading-relaxed space-y-2 text-slate-700 shadow-xs">
                              <h5 className="font-black text-[10px] uppercase tracking-wider text-indigo-700 border-b border-indigo-50 pb-1.5 mb-2">Gemini Response Log</h5>
                              <div className="max-h-[350px] overflow-y-auto pr-1">
                                {renderMessageContent(aiResponse)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. SECURE BOOKING CHECKOUT OR RECEIPT VIEW */}
                      {rightPanel === 'billing' && (
                        <div className="space-y-4">
                          
                          {/* Case A: Accepted, Needs Payment and passenger lists */}
                          {selectedInquiry.status === 'accepted' && selectedInquiry.finalTotalQuote && (
                            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-4 shadow-xs">
                              <h5 className="font-extrabold text-[#059669] text-xs uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-[#059669]" />
                                Pay & Secure Booking Slot
                              </h5>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[11px]">
                                <div className="flex justify-between font-black text-slate-800">
                                  <span>Base Price Quote:</span>
                                  <span>₹{selectedInquiry.finalTotalQuote}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 italic block mt-1">(Quotations computed by {selectedInquiry.agencyName})</span>
                              </div>

                              <form onSubmit={handleBookingConfirm} className="space-y-4">
                                <span className="text-xs font-extrabold text-slate-700 block uppercase tracking-wide">Traveller Passengers List</span>
                                
                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                  {passengersList.map((passenger, pIdx) => (
                                    <div key={pIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">Guest #{pIdx + 1}</span>
                                        {passengersList.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removePassengerField(pIdx)}
                                            className="text-rose-500 hover:text-rose-700 bg-transparent border-none cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-6">
                                          <input
                                            type="text"
                                            placeholder="Full Name"
                                            required
                                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                            value={passenger.name}
                                            onChange={(e) => updatePassengerValue(pIdx, 'name', e.target.value)}
                                          />
                                        </div>
                                        <div className="col-span-3 font-mono">
                                          <input
                                            type="number"
                                            placeholder="Age"
                                            required
                                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                                            value={passenger.age}
                                            onChange={(e) => updatePassengerValue(pIdx, 'age', Number(e.target.value))}
                                          />
                                        </div>
                                        <div className="col-span-3">
                                          <select
                                            className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                            value={passenger.gender}
                                            onChange={(e) => updatePassengerValue(pIdx, 'gender', e.target.value)}
                                          >
                                            <option value="Male">M</option>
                                            <option value="Female">F</option>
                                            <option value="Other">O</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center">
                                  <button
                                    type="button"
                                    onClick={addPassengerField}
                                    className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline uppercase bg-transparent border-none cursor-pointer"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Add Passenger Row
                                  </button>
                                  <span className="text-[9px] font-bold text-slate-400">Total: {passengersList.length} guest(s)</span>
                                </div>

                                <button
                                  type="submit"
                                  disabled={bookingLoading}
                                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 border-none cursor-pointer"
                                >
                                  💳 {bookingLoading ? 'Simulating UPI...' : `Proceed payment ₹${selectedInquiry.finalTotalQuote}`}
                                </button>
                              </form>
                            </div>
                          )}

                          {/* Case B: Confirmed and Paid Receipt details */}
                          {(selectedInquiry.status === 'confirmed' || bookedReceipt) && (
                            <div className="space-y-4">
                              
                              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl space-y-1 bg-emerald-50/20">
                                <div className="flex items-center gap-2 text-[#047857]">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-black uppercase tracking-wider">UPI Payments Locked</span>
                                </div>
                                <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                                  UPI balance settles instantly. Present tax manifestation voucher below to transport checkpoint boundaries enroute.
                                </p>
                              </div>

                              {/* Simulated Printable Ticket Receipt */}
                              <div className="bg-white border border-slate-250 p-4 rounded-2xl space-y-3 font-mono text-[10px] text-slate-700 shadow-xs relative">
                                <div className="text-center font-black border-b border-dashed border-slate-200 pb-2.5">
                                  <div>B2B STATIONS TAX RECEIPT</div>
                                  <div className="text-[9px] text-[#059669] font-black mt-1 uppercase">UPI APPROVED IN full</div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between">
                                    <span>Route Stations:</span>
                                    <span className="font-bold underline text-right">{selectedInquiry.fromCity} ➔ {selectedInquiry.toCity}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Allocated Bus:</span>
                                    <span className="font-bold text-right">{selectedInquiry.vehicleName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Travel Dates:</span>
                                    <span className="font-bold text-right">{selectedInquiry.startDate}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Price Paid:</span>
                                    <span className="font-bold text-emerald-600 text-right">₹{selectedInquiry.finalTotalQuote || 5000}</span>
                                  </div>
                                </div>

                                {selectedInquiry.passengerList && selectedInquiry.passengerList.length > 0 && (
                                  <div className="border-t border-dashed border-slate-200 pt-2.5">
                                    <p className="font-black text-[9px] text-slate-450 uppercase mb-1.5">Passengers Declared:</p>
                                    <div className="space-y-1">
                                      {selectedInquiry.passengerList.map((psg: any, psIdx: number) => (
                                        <div key={psIdx} className="flex justify-between text-[9px] text-slate-500">
                                          <span>{psIdx + 1}. {psg.name}</span>
                                          <span>({psg.age}, {psg.gender})</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Download PDF Invoice Button */}
                              <button
                                onClick={() => handleDownloadInvoice(selectedInquiry)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-3 rounded-2xl text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 border border-slate-800 cursor-pointer"
                              >
                                <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Download PDF Invoice</span>
                              </button>

                              {/* Customer Rating form */}
                              <div className="bg-white p-4 border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wide block">Rate & Review Vehicle</span>
                                
                                {reviewSuccess ? (
                                  <div className="text-[10px] text-[#047857] bg-emerald-50 p-2.5 rounded-xl font-bold border border-emerald-150">{reviewSuccess}</div>
                                ) : (
                                  <form onSubmit={(e) => handlePostReview(e, selectedInquiry.vehicleId)} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-455">Stars:</span>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(st => (
                                          <button
                                            key={st}
                                            type="button"
                                            onClick={() => setReviewRating(st)}
                                            className={`text-base font-bold transition-all border-none bg-transparent cursor-pointer ${reviewRating >= st ? 'text-amber-500 scale-110' : 'text-slate-200'}`}
                                          >
                                            ★
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Friendly driver, extremely clean..."
                                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-orange-500"
                                      value={reviewComment}
                                      onChange={(e) => setReviewComment(e.target.value)}
                                    />
                                    <button
                                      type="submit"
                                      className="w-full bg-slate-900 text-white font-black py-2 rounded-xl text-[9px] uppercase tracking-wider hover:bg-slate-800 transition border-none cursor-pointer"
                                    >
                                      Submit Public Review
                                    </button>
                                  </form>
                                )}
                              </div>

                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 4: MY CONFIRMED TRIPS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <h2 className="font-display font-bold text-slate-800 text-lg">My Confirmed Trip Receipts</h2>
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-xs text-slate-400">
            You can print booking vouchers directly inside each confirmed thread under the "My Inquiries" tab.
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER INQUIRY MODAL DIALOG */}
      {editingInquiry && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-[32px] p-6 sm:p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Modify Inquiry Parameters</h3>
              <button 
                type="button"
                onClick={() => setEditingInquiry(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateInquirySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Starting Point (From City)</label>
                  <input
                    type="text"
                    required
                    value={editInqFromCity}
                    onChange={(e) => setEditInqFromCity(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Destination Target (To City)</label>
                  <input
                    type="text"
                    required
                    value={editInqToCity}
                    onChange={(e) => setEditInqToCity(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Departure Date (Start Date)</label>
                  <input
                    type="date"
                    required
                    value={editInqStartDate}
                    onChange={(e) => setEditInqStartDate(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Return Date (End Date)</label>
                  <input
                    type="date"
                    required
                    value={editInqEndDate}
                    onChange={(e) => setEditInqEndDate(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Detailed Itinerary Sightseeing Plan (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Somnath Temple, Dwarkadhish Mandir, Bet Dwarka"
                  value={editInqPlacesInput}
                  onChange={(e) => setEditInqPlacesInput(e.target.value)}
                  className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Passenger Count (In Group)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editInqNumPassengers}
                    onChange={(e) => setEditInqNumPassengers(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Coach Air Conditioning (AC)</label>
                  <select
                    value={editInqIsAc ? 'true' : 'false'}
                    onChange={(e) => setEditInqIsAc(e.target.value === 'true')}
                    className="w-full text-xs font-bold border border-sky-100 bg-white rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  >
                    <option value="true">AC Coach Service (Requested)</option>
                    <option value="false">Non-AC Coach Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Transit Coach Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Force Urbania Deluxe"
                    value={editInqVehicleName}
                    onChange={(e) => setEditInqVehicleName(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Class Seat Size</label>
                  <select
                    value={editInqVehicleCapacity}
                    onChange={(e) => setEditInqVehicleCapacity(e.target.value as any)}
                    className="w-full text-xs font-bold border border-sky-100 bg-white rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  >
                    <option value="7">7 Seater SUV Cruiser</option>
                    <option value="10">10 Seater Traveler</option>
                    <option value="12">12 Seater Executive Traveler</option>
                    <option value="14">14 Seater Premium Coach</option>
                    <option value="17">17 Seater Super LX Coach</option>
                    <option value="20">20 Seater Tourist Shuttle</option>
                    <option value="25">25 Seater Group Bus</option>
                    <option value="40">40 Seater Royal Volvo</option>
                    <option value="56">56 Seater Multi-Axle Volvo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Special instructions / Requests</label>
                <textarea
                  rows={3}
                  value={editInqRemarks}
                  onChange={(e) => setEditInqRemarks(e.target.value)}
                  placeholder="e.g. Request driver with fluent Hindi speaking, low night driving pattern preferred."
                  className="w-full text-xs font-semibold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingInquiry(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-full transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-full transition shadow-lg shadow-indigo-100 cursor-pointer border-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
