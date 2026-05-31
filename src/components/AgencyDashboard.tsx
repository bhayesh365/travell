/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Vehicle, Inquiry, Message, UserProfile, TripCosts, TourPackage, VehicleCapacity } from '../types.js';
import { 
  PlusCircle, Bus, Mail, Phone, MapPin, Building,
  Check, X, Send, MessageSquare, DollarSign, ListFilter,
  CheckCircle2, Info, ArrowUpRight, ShieldAlert, Award,
  TrendingUp, BarChart3, PieChart as PieIcon, Activity, Calendar, Users,
  Download, FileSpreadsheet, Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface AgencyDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function AgencyDashboard({ user, onLogout }: AgencyDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'inquiries' | 'fleet' | 'analytics' | 'packages'>('analytics');

  // Analytics Status Segment Variant
  const [statusChartVariant, setStatusChartVariant] = useState<'all' | 'confirmed_pending'>('all');

  // Agency Fleet State
  const [fleetList, setFleetList] = useState<Vehicle[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(false);

  // New fleet register form
  const [showAddForm, setShowAddForm] = useState(false);
  const [vName, setVName] = useState('');
  const [vCapacity, setVCapacity] = useState<'7' | '10' | '12' | '14' | '17' | '20' | '25' | '40' | '56'>('12');
  const [vCity, setVCity] = useState(user.city || 'Surat');
  const [vPriceKm, setVPriceKm] = useState(18);
  const [vIsAc, setVIsAc] = useState(true);
  const [vCondition, setVCondition] = useState('Excellent - Model 2024');
  const [vDetails, setVDetails] = useState('');
  const [vPhotoUrl, setVPhotoUrl] = useState('');
  const [vImages, setVImages] = useState<string[]>([]);
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Sample image template buttons
  const SAMPLE_VEHICLE_IMAGES = [
    { title: 'Tempo Traveller', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800' },
    { title: 'Sleeper Bus', url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800' },
    { title: 'Luxury SUV', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800' }
  ];

  // Inquiries State
  const [agencyInquiries, setAgencyInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryMessages, setInquiryMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [rightPanel, setRightPanel] = useState<'none' | 'quote'>('none');

  // Cost Breakdown Propose Form States
  const [qPricePerKm, setQPricePerKm] = useState(18);
  const [qDistanceKm, setQDistanceKm] = useState(300);
  const [qDriverStay, setQDriverStay] = useState(500);
  const [qMeals, setQMeals] = useState(300);
  const [qTolls, setQTolls] = useState(800);
  const [qOther, setQOther] = useState(0);
  const [qExplanation, setQExplanation] = useState('Custom quote based on route checkpoints and driver night allowance parameters.');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState('');

  // Tour Packages state
  const [packagesList, setPackagesList] = useState<TourPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [showAddPackageForm, setShowAddPackageForm] = useState(false);
  
  // Package form fields
  const [pTitle, setPTitle] = useState('');
  const [pFromCity, setPFromCity] = useState(user.city || 'Surat');
  const [pToCity, setPToCity] = useState('');
  const [pStopsInput, setPStopsInput] = useState('');
  const [pHotelName, setPHotelName] = useState('');
  const [pHotelRating, setPHotelRating] = useState('3-Star Premium Deluxe');
  const [pHotelInclude, setPHotelInclude] = useState(true);
  const [pBreakfastInclude, setPBreakfastInclude] = useState(true);
  const [pLunchInclude, setPLunchInclude] = useState(true);
  const [pDinnerInclude, setPDinnerInclude] = useState(true);
  const [pVehicleName, setPVehicleName] = useState('');
  const [pVehicleCapacity, setPVehicleCapacity] = useState<'7' | '10' | '12' | '14' | '17' | '20' | '25' | '40' | '56'>('12');
  const [pPricePerPerson, setPPricePerPerson] = useState(8500);
  const [pDurationDays, setPDurationDays] = useState(5);
  const [pDescription, setPDescription] = useState('');
  const [pPhotoUrl, setPPhotoUrl] = useState('');
  const [pVehicleImages, setPVehicleImages] = useState<string[]>([]);
  const [pHotelImages, setPHotelImages] = useState<string[]>([]);
  const [publishSuccess, setPublishSuccess] = useState('');

  // Editing package states
  const [editingPackage, setEditingPackage] = useState<TourPackage | null>(null);
  const [editPTitle, setEditPTitle] = useState('');
  const [editPFromCity, setEditPFromCity] = useState('');
  const [editPToCity, setEditPToCity] = useState('');
  const [editPStopsInput, setEditPStopsInput] = useState('');
  const [editPHotelName, setEditPHotelName] = useState('');
  const [editPHotelRating, setEditPHotelRating] = useState('');
  const [editPHotelInclude, setEditPHotelInclude] = useState(true);
  const [editPBreakfastInclude, setEditPBreakfastInclude] = useState(true);
  const [editPLunchInclude, setEditPLunchInclude] = useState(true);
  const [editPDinnerInclude, setEditPDinnerInclude] = useState(true);
  const [editPVehicleName, setEditPVehicleName] = useState('');
  const [editPVehicleCapacity, setEditPVehicleCapacity] = useState<VehicleCapacity>('12');
  const [editPPricePerPerson, setEditPPricePerPerson] = useState(5000);
  const [editPDurationDays, setEditPDurationDays] = useState(3);
  const [editPDescription, setEditPDescription] = useState('');
  const [editPPhotoUrl, setEditPPhotoUrl] = useState('');
  const [editPVehicleImages, setEditPVehicleImages] = useState<string[]>([]);
  const [editPHotelImages, setEditPHotelImages] = useState<string[]>([]);

  // Editing vehicle states
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editVName, setEditVName] = useState('');
  const [editVCapacity, setEditVCapacity] = useState<'7' | '10' | '12' | '14' | '17' | '20' | '25' | '40' | '56'>('12');
  const [editVCity, setEditVCity] = useState('');
  const [editVPriceKm, setEditVPriceKm] = useState(18);
  const [editVIsAc, setEditVIsAc] = useState(true);
  const [editVCondition, setEditVCondition] = useState('Excellent - Model 2024');
  const [editVDetails, setEditVDetails] = useState('');
  const [editVPhotoUrl, setEditVPhotoUrl] = useState('');
  const [editVImages, setEditVImages] = useState<string[]>([]);

  // Base64 file reader helper for drag/drop & click upload
  const handleImageUploadHelper = (files: FileList | null, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Refresh data routines
  const fetchFleet = async () => {
    setLoadingFleet(true);
    try {
      const res = await fetch(`/api/vehicles?city=${encodeURIComponent(user.city || '')}`);
      const data = await res.json();
      // Filter list corresponding to this specific agency identifier
      const filtered = data.filter((v: Vehicle) => v.agencyId === user.id);
      setFleetList(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFleet(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch(`/api/inquiries?agencyId=${user.id}`);
      const data = await res.json();
      setAgencyInquiries(data);

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

  const fetchMessages = async (inqId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${inqId}`);
      const data = await res.json();
      setInquiryMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Lifecycle effects
  useEffect(() => {
    fetchFleet();
    fetchInquiries();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/packages');
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((p: TourPackage) => p.agencyId === user.id);
        setPackagesList(filtered);
      }
    } catch (e) {
      console.error("Error fetching packages:", e);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pToCity || !pPricePerPerson || !pVehicleName) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const stopsArray = pStopsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        agencyId: user.id,
        title: pTitle,
        fromCity: pFromCity,
        toCity: pToCity,
        stops: stopsArray,
        hotelName: pHotelName || 'Royal Comfort Stay Resort',
        hotelRating: pHotelRating,
        inclusions: {
          hotel: pHotelInclude,
          breakfast: pBreakfastInclude,
          lunch: pLunchInclude,
          dinner: pDinnerInclude
        },
        vehicleName: pVehicleName,
        vehicleCapacity: pVehicleCapacity,
        pricePerPerson: Number(pPricePerPerson) || 5000,
        durationDays: Number(pDurationDays) || 3,
        description: pDescription || `${pFromCity} to ${pToCity} curated spiritual and sightseeing tour.`,
        photoUrl: pPhotoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
        hotelImages: pHotelImages,
        vehicleImages: pVehicleImages
      };

      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPublishSuccess('Amazing! Your special tour package has been published successfully. Customers will now see it under Curated Packages.');
        // Reset fields
        setPTitle('');
        setPToCity('');
        setPStopsInput('');
        setPHotelName('');
        setPVehicleName('');
        setPDescription('');
        setPPhotoUrl('');
        setPVehicleImages([]);
        setPHotelImages([]);
        
        fetchPackages();
        setTimeout(() => {
          setShowAddPackageForm(false);
          setPublishSuccess('');
        }, 3000);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to publish package'}`);
      }
    } catch (err) {
      console.error("Error creating package:", err);
    }
  };

  const startEditingPackage = (pkg: TourPackage) => {
    setEditingPackage(pkg);
    setEditPTitle(pkg.title);
    setEditPFromCity(pkg.fromCity);
    setEditPToCity(pkg.toCity);
    setEditPStopsInput(pkg.stops ? pkg.stops.join(', ') : '');
    setEditPHotelName(pkg.hotelName);
    setEditPHotelRating(pkg.hotelRating);
    setEditPHotelInclude(pkg.inclusions?.hotel ?? true);
    setEditPBreakfastInclude(pkg.inclusions?.breakfast ?? true);
    setEditPLunchInclude(pkg.inclusions?.lunch ?? true);
    setEditPDinnerInclude(pkg.inclusions?.dinner ?? true);
    setEditPVehicleName(pkg.vehicleName);
    setEditPVehicleCapacity(pkg.vehicleCapacity);
    setEditPPricePerPerson(pkg.pricePerPerson);
    setEditPDurationDays(pkg.durationDays);
    setEditPDescription(pkg.description);
    setEditPPhotoUrl(pkg.photoUrl);
    setEditPVehicleImages(pkg.vehicleImages || []);
    setEditPHotelImages(pkg.hotelImages || []);
  };

  const handleUpdatePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      const stopsArray = editPStopsInput.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        title: editPTitle,
        fromCity: editPFromCity,
        toCity: editPToCity,
        stops: stopsArray,
        hotelName: editPHotelName,
        hotelRating: editPHotelRating,
        inclusions: {
          hotel: editPHotelInclude,
          breakfast: editPBreakfastInclude,
          lunch: editPLunchInclude,
          dinner: editPDinnerInclude
        },
        vehicleName: editPVehicleName,
        vehicleCapacity: editPVehicleCapacity,
        pricePerPerson: Number(editPPricePerPerson) || 5000,
        durationDays: Number(editPDurationDays) || 3,
        description: editPDescription || `${editPFromCity} to ${editPToCity} curated spiritual and sightseeing tour.`,
        photoUrl: editPPhotoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
        hotelImages: editPHotelImages,
        vehicleImages: editPVehicleImages
      };

      const res = await fetch(`/api/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingPackage(null);
        fetchPackages();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to update package'}`);
      }
    } catch (err) {
      console.error("Error updating package:", err);
    }
  };

  const startEditingVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setEditVName(veh.name);
    setEditVCapacity(veh.capacity as any || '12');
    setEditVCity(veh.city);
    setEditVPriceKm(veh.pricePerKm);
    setEditVIsAc(veh.isAc);
    setEditVCondition(veh.condition);
    setEditVDetails(veh.details);
    setEditVPhotoUrl(veh.photoUrl);
    setEditVImages(veh.vehicleImages || []);
  };

  const handleUpdateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    try {
      const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editVName,
          capacity: editVCapacity,
          city: editVCity,
          pricePerKm: Number(editVPriceKm) || 15,
          isAc: editVIsAc,
          photoUrl: editVPhotoUrl,
          condition: editVCondition,
          details: editVDetails,
          vehicleImages: editVImages
        })
      });

      if (res.ok) {
        setEditingVehicle(null);
        fetchFleet();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to update vehicle'}`);
      }
    } catch (err) {
      console.error("Error updating vehicle:", err);
    }
  };

  // Set up polling for messages and statuses in active Inquiry chat
  useEffect(() => {
    if (selectedInquiry) {
      fetchMessages(selectedInquiry.id);
      
      const poller = setInterval(() => {
        fetchMessages(selectedInquiry.id);
        fetchInquiries();
      }, 3500);

      return () => clearInterval(poller);
    }
  }, [selectedInquiry?.id]);

  // Pre-fill pricing quotes selector whenever active inquiry changes
  useEffect(() => {
    if (selectedInquiry) {
      // Find base vehicle matching coordinates to derive price
      setQPricePerKm(selectedInquiry.customPricePerKm || 18);
      setQDistanceKm(selectedInquiry.estimatedTotalDistanceKm || 250);
      if (selectedInquiry.tripCosts) {
        setQDriverStay(selectedInquiry.tripCosts.driverStay);
        setQMeals(selectedInquiry.tripCosts.meals);
        setQTolls(selectedInquiry.tripCosts.tolls);
        setQOther(selectedInquiry.tripCosts.otherCharges);
        setQExplanation(selectedInquiry.tripCosts.explanation);
      }
    }
  }, [selectedInquiry?.id]);

  // Handle register fleet submission
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName) return;
    setRegisterSuccess('');

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: user.id,
          name: vName,
          capacity: vCapacity,
          city: vCity,
          pricePerKm: vPriceKm,
          isAc: vIsAc,
          photoUrl: vPhotoUrl || SAMPLE_VEHICLE_IMAGES[0].url,
          condition: vCondition,
          details: vDetails,
          vehicleImages: vImages
        })
      });

      if (res.ok) {
        setRegisterSuccess('Vehicle registered successfully in town garage!');
        fetchFleet();
        // Reset states
        setVName('');
        setVDetails('');
        setVPhotoUrl('');
        setVImages([]);
        setTimeout(() => {
          setShowAddForm(false);
          setRegisterSuccess('');
        }, 2200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Accept and decline incoming tickets
  const handleUpdateStatus = async (inqId: string, newStatus: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/inquiries/${inqId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchInquiries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit cost quotes to customers for secure checkout
  const handleProposeQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setQuoteSubmitting(true);
    setQuoteSuccessMsg('');

    try {
      const res = await fetch(`/api/inquiries/${selectedInquiry.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPricePerKm: qPricePerKm,
          estimatedTotalDistanceKm: qDistanceKm,
          driverStay: qDriverStay,
          meals: qMeals,
          tolls: qTolls,
          otherCharges: qOther,
          explanation: qExplanation
        })
      });

      if (res.ok) {
        setQuoteSuccessMsg('Itemized pricing breakdown successfully dispatched! Customer has been updated.');
        fetchInquiries();
        setTimeout(() => setQuoteSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Message Sending
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
          senderType: 'agency',
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

  // Format Helper for chat lines (custom parser capturing bold tags)
  const renderMessageContent = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let temp = formattedLine;
      let match;
      let lastIndex = 0;

      while ((match = boldRegex.exec(temp)) !== null) {
        parts.push(temp.substring(lastIndex, match.index));
        parts.push(<strong key={match.index} className="font-semibold text-slate-805">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      parts.push(temp.substring(lastIndex));

      return (
        <div key={idx} className="min-h-[1.1rem]">
          {parts.length > 1 ? parts : formattedLine}
        </div>
      );
    });
  };

  // Analytics Calculations
  const confirmedInquiries = agencyInquiries.filter(i => i.status === 'confirmed');
  const totalRevenue = confirmedInquiries.reduce((sum, i) => sum + (i.finalTotalQuote || 0), 0);
  const completedTripsCount = confirmedInquiries.length;

  const vehicleMap: Record<string, { name: string; 'Total Earnings (₹)': number; 'Trips': number }> = {};
  confirmedInquiries.forEach(i => {
    const vName = i.vehicleName || 'Standard Vehicle';
    if (!vehicleMap[vName]) {
      vehicleMap[vName] = { name: vName, 'Total Earnings (₹)': 0, Trips: 0 };
    }
    vehicleMap[vName]['Total Earnings (₹)'] += (i.finalTotalQuote || 0);
    vehicleMap[vName].Trips += 1;
  });
  const vehicleProfitData = Object.values(vehicleMap).sort((a, b) => b['Total Earnings (₹)'] - a['Total Earnings (₹)']);

  const statusMap: Record<string, { name: string; value: number }> = {
    confirmed: { name: 'Confirmed Bookings', value: 0 },
    accepted: { name: 'Active Quotations', value: 0 },
    pending: { name: 'Pending Leads', value: 0 },
    declined: { name: 'Declined/Rejected', value: 0 }
  };
  agencyInquiries.forEach(i => {
    if (statusMap[i.status]) {
      statusMap[i.status].value += 1;
    }
  });
  const statusBreakdownData = Object.values(statusMap).filter(item => item.value > 0);

  // Confirmed vs. Pending Leads analysis
  const confirmedCount = statusMap.confirmed.value;
  const pendingCount = statusMap.pending.value;
  const confirmedVsPendingData = [
    { name: 'Confirmed Leads', value: confirmedCount },
    { name: 'Pending Leads', value: pendingCount }
  ];

  const chronologicalRevenueData = [...confirmedInquiries]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map(i => ({
      date: new Date(i.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      'Revenue (₹)': i.finalTotalQuote || 0,
      customer: i.customerName,
      vehicle: i.vehicleName
    }));

  // CSV Downloader for Booking Revenue & Trip Metrics
  const handleDownloadCSV = () => {
    const rows: string[] = [];

    // Header block
    rows.push("=== AGENCY PERFORMANCE METRICS SUMMARY ===");
    rows.push(`Total Volume Selected Earnings,INR ${totalRevenue}`);
    rows.push(`Secured Bookings,${completedTripsCount} Trips`);
    rows.push(`Inward Leads Received,${agencyInquiries.length} Threads`);
    const cr = agencyInquiries.length ? Math.round((completedTripsCount / agencyInquiries.length) * 100) : 0;
    rows.push(`Booking Conversion Rate,${cr}%`);
    rows.push(""); // empty row

    // Vehicle Profitability Table
    rows.push("=== FLEET ASSET PERFORMANCE ===");
    rows.push("Vehicle Type,Total Earnings (INR),Trips Completed");
    vehicleProfitData.forEach(v => {
      const vNameEscaped = `"${v.name.replace(/"/g, '""')}"`;
      rows.push(`${vNameEscaped},${v['Total Earnings (₹)']},${v.Trips}`);
    });
    rows.push(""); // empty row

    // Detail Database Table
    rows.push("=== SECURED BOOKING DETAIL RECORDS ===");
    rows.push("Booking ID,Customer Name,Vehicle Name,From City,To City,Start Date,End Date,Duration (Days),Est Distance (Km),Price Per Km (INR),Total Payment Amount (INR)");
    
    confirmedInquiries.forEach(i => {
      const id = i.id;
      const custName = `"${(i.customerName || '').replace(/"/g, '""')}"`;
      const vehName = `"${(i.vehicleName || '').replace(/"/g, '""')}"`;
      const from = `"${(i.fromCity || '').replace(/"/g, '""')}"`;
      const to = `"${(i.toCity || '').replace(/"/g, '""')}"`;
      const start = i.startDate || '';
      const end = i.endDate || '';
      const duration = i.durationDays || 0;
      const distance = i.estimatedTotalDistanceKm || 0;
      const pricePerKm = i.customPricePerKm || 0;
      const finalQuote = i.finalTotalQuote || 0;

      rows.push(`${id},${custName},${vehName},${from},${to},${start},${end},${duration},${distance},${pricePerKm},${finalQuote}`);
    });

    const csvString = rows.join("\n");
    // Prefix with UTF-8 BOM for proper Excel rendering with symbols
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const timestamp = new Date().toISOString().substring(0, 10);
    link.setAttribute("download", `agency_metrics_report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page numbering & decoration helper
      let pageNum = 1;
      const addPageDecoration = () => {
        // Top dark line
        doc.setFillColor(15, 23, 42);
        doc.rect(15, 10, 180, 1.5, 'F');
        
        // Footer labels
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("PRVASIQ Travel Marketplace • Verified Carrier Operations & Fleet Intel", 15, 287);
        doc.text(`Page ${pageNum}`, 195, 287, { align: 'right' });
      };

      // INITIAL REPORT HEADER
      // Brand Emblem Vector Shapes
      doc.setFillColor(13, 148, 136); 
      doc.triangle(15, 15, 15, 29, 21, 22, 'F');
      
      doc.setFillColor(249, 115, 22); 
      doc.triangle(27, 15, 27, 29, 21, 22, 'F');

      doc.setFillColor(15, 23, 42); 
      doc.circle(21, 22, 1.2, 'F');

      // Typography beside emblem logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PRVASIQ', 31, 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(249, 115, 22);
      doc.text('TRAVEL AGENCY PERFORMANCE PORTAL', 31, 26.5);

      // Report Info (Right Align)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('FLEET PERFORMANCE REPORT', 195, 21, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const todayStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(`Generated: ${todayStr}`, 195, 26, { align: 'right' });

      // Border rule
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 32, 195, 32);

      // PARTNER INFORMATION CARD
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 37, 180, 24, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(15, 37, 180, 24, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('REGISTERED CARRIER', 20, 43);
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(user.name.toUpperCase(), 20, 49);
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Email: ${user.email}   |   Phone: ${user.phone || 'N/A'}`, 20, 55);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('HUB REGION / DEPOSIT STATION', 125, 43);
      doc.setFontSize(10.5);
      doc.setTextColor(249, 115, 22); // Orange location
      doc.text((user.city || 'SURAT').toUpperCase(), 125, 49);
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Active Commercial Transport Depot', 125, 55);

      // KEY PERFORMANCE SUMMARY GRID (4 cards)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('KEY PERFORMANCE INDICATORS (KPIs)', 15, 71);

      // Draw 4 rounded boxes
      const cardWidth = 42;
      const cardHeight = 22;
      const startX = 15;
      const gap = 4;
      const targetY = 76;

      const cr = agencyInquiries.length ? Math.round((completedTripsCount / agencyInquiries.length) * 100) : 0;
      const kpis = [
        { label: 'GROSS SECURED BILLING', value: `INR ${totalRevenue.toLocaleString('en-IN')}`, desc: 'Volume Earnings', color: [79, 70, 229] },
        { label: 'JOURNEY COMPLETED', value: `${completedTripsCount} Trips`, desc: 'Secure Dispatches', color: [13, 148, 136] },
        { label: 'TOTAL INWARD THREADS', value: `${agencyInquiries.length} Inquiries`, desc: 'Leads Multi-Channel', color: [124, 58, 237] },
        { label: 'CONVERSION RATIO', value: `${cr}%`, desc: 'Leads-to-Secured', color: [249, 115, 22] }
      ];

      kpis.forEach((k, idx) => {
        const x = startX + idx * (cardWidth + gap);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, targetY, cardWidth, cardHeight, 2, 2, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, targetY, cardWidth, cardHeight, 2, 2, 'S');

        const highlightColor = k.color;
        doc.setFillColor(highlightColor[0], highlightColor[1], highlightColor[2]);
        doc.rect(x, targetY, 1.5, cardHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(k.label, x + 4, targetY + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(k.value, x + 4, targetY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(k.desc, x + 4, targetY + 18);
      });

      // FLEET ASSET SEGMENTS PERFORMANCE
      let currentY = 109;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('FLEET VEHICLE SEGMENT PROFITABILITY', 15, currentY);

      currentY += 4;
      // Draw Table Header
      doc.setFillColor(15, 23, 42);
      doc.rect(15, currentY, 180, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('VEHICLE / FLEET UNIT NAME', 18, currentY + 5.5);
      doc.text('TOTAL REVENUE SECURITY (INR)', 100, currentY + 5.5);
      doc.text('SECURED JOURNEY COUNT', 150, currentY + 5.5);

      currentY += 8;

      if (vehicleProfitData.length === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, currentY, 180, 10, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('No active vehicle dispatch logs found for this operating carrier.', 20, currentY + 6.5);
        currentY += 10;
      } else {
        vehicleProfitData.forEach((v, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, currentY, 180, 7.5, 'F');
          }
          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 7.5, 195, currentY + 7.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(v.name, 18, currentY + 5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229); // Royal violet blue
          doc.text(`INR ${v['Total Earnings (₹)'].toLocaleString('en-IN')}`, 100, currentY + 5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(13, 148, 136); // Teal for secured numbers
          doc.text(`${v.Trips} Completed Hires`, 150, currentY + 5);

          currentY += 7.5;
        });
      }

      currentY += 8;

      // SECURED BOOKING DETAIL RECORDS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('SECURED TRANSACTION DISPATCH LEDGER', 15, currentY);

      currentY += 4;
      // Draw booking header
      doc.setFillColor(79, 70, 229); // Royal violet header
      doc.rect(15, currentY, 180, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('BOOKING REF / PASSENGER', 18, currentY + 5.5);
      doc.text('FLEET TYPE SELECTED', 65, currentY + 5.5);
      doc.text('TRANSIT ROUTE STOPS', 105, currentY + 5.5);
      doc.text('JOURNEY PERIOD', 145, currentY + 5.5);
      doc.text('TOTAL TARIFF', 175, currentY + 5.5);

      currentY += 8;

      if (confirmedInquiries.length === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, currentY, 180, 10, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('No secured transit hires booked. Awaiting customer inquiries.', 20, currentY + 6.5);
        currentY += 10;
      } else {
        confirmedInquiries.forEach((i, idx) => {
          if (currentY > 265) {
            addPageDecoration();
            doc.addPage();
            pageNum++;
            currentY = 25;
            
            // Re-draw table header
            doc.setFillColor(79, 70, 229);
            doc.rect(15, currentY, 180, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            doc.text('BOOKING REF / PASSENGER', 18, currentY + 5.5);
            doc.text('FLEET TYPE SELECTED', 65, currentY + 5.5);
            doc.text('TRANSIT ROUTE STOPS', 105, currentY + 5.5);
            doc.text('JOURNEY PERIOD', 145, currentY + 5.5);
            doc.text('TOTAL TARIFF', 175, currentY + 5.5);
            currentY += 8;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, currentY, 180, 11, 'F');
          }
          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 11, 195, currentY + 11);

          // Sub line 1: Booking ID & Name
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text((i.id || 'N/A').toUpperCase(), 18, currentY + 4.5);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(i.customerName || 'Anonymous Traveler', 18, currentY + 8.5);

          // Sub line 2: Vehicle Name
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          const slicedVehName = (i.vehicleName || '').substring(0, 22);
          doc.text(slicedVehName, 65, currentY + 4.5);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`${i.estimatedTotalDistanceKm || 0} Km • ${i.durationDays || 0} Days Transit`, 65, currentY + 8.5);

          // Sub line 3: Route Hubs
          doc.setFont('helvetica', 'medium');
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42);
          const routeStr = `${i.fromCity} -> ${i.toCity}`;
          doc.text(routeStr, 105, currentY + 4.5);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text('Direct Hub Carrier Run', 105, currentY + 8.5);

          // Sub line 4: Period Calendar
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(51, 65, 85);
          doc.text(i.startDate || 'N/A', 145, currentY + 4.5);
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`to ${i.endDate}`, 145, currentY + 8.5);

          // Sub line 5: Total Tariff Paid
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(249, 115, 22); // Orange currency highlight
          doc.text(`INR ${(i.finalTotalQuote || 0).toLocaleString('en-IN')}`, 175, currentY + 6.5);

          currentY += 11;
        });
      }

      addPageDecoration();

      const reportTimestamp = new Date().toISOString().substring(0, 10);
      doc.save(`Prvasiq_Agency_Performance_Report_${reportTimestamp}.pdf`);
    } catch (err) {
      console.error("PDF generator error:", err);
      alert("Error building performance PDF card brochure.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header section with profile parameters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <span className="text-xs font-black bg-teal-105 text-teal-700 px-3.5 py-1 rounded-full border border-teal-200 tracking-widest uppercase font-mono">
            Travel Partner Panel (B2B)
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-3">
            Manage <span className="underline decoration-orange-500 decoration-4 underline-offset-4">{user.name}</span> Fleet
          </h1>
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4 text-orange-500" />
            Primary Location: <span className="font-extrabold text-slate-850">{user.city || 'Surat'}</span>
            • Phone coordinate: <span className="font-extrabold text-slate-850">{user.phone}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto bg-white p-2 rounded-full border border-sky-50 shadow-sm">
          <button
            onClick={() => { setActiveTab('analytics'); }}
            className={`flex-grow md:flex-none px-5 py-2.5 text-xs font-black rounded-full transition duration-150 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Analytics
          </button>

          <button
            onClick={() => { setActiveTab('inquiries'); }}
            className={`flex-grow md:flex-none px-5 py-2.5 text-xs font-black rounded-full transition duration-150 ${activeTab === 'inquiries' ? 'bg-orange-500 text-white' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Inquiries ({agencyInquiries.length})
          </button>
          
          <button
            onClick={() => { setActiveTab('fleet'); }}
            className={`flex-grow md:flex-none px-5 py-2.5 text-xs font-black rounded-full transition duration-150 ${activeTab === 'fleet' ? 'bg-teal-600 text-white shadow-md shadow-teal-100' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Manage Fleet ({fleetList.length})
          </button>

          <button
            onClick={() => { setActiveTab('packages'); }}
            className={`flex-grow md:flex-none px-5 py-2.5 text-xs font-black rounded-full transition duration-150 ${activeTab === 'packages' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Tour Packages ({packagesList.length})
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* VIEW 0: ANALYTICS DASHBOARD SECTION */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Action Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-[28px] p-6.5 shadow-xl shadow-indigo-950/10 border border-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg md:text-xl font-extrabold flex items-center gap-2">
                <BarChart3 className="w-5.5 h-5.5 text-indigo-400" />
                Fleet & Business Analytics
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Monitor total revenue, trip conversions, and asset yields in real-time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadCSV}
                id="btn-download-analytics-csv"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-xs font-black bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl shadow-sm active:scale-95 transition-all duration-150 border border-slate-700 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Export CSV Report</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                id="btn-download-analytics-pdf"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-950/20 active:scale-95 transition-all duration-150 border border-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0 animate-bounce" />
                <span>Export PDF Report</span>
              </button>
            </div>
          </div>

          {/* Header & Metric Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-sky-100 rounded-[28px] p-6 shadow-md shadow-indigo-50/20 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Volume Earnings</span>
                <h3 className="text-2xl font-black text-slate-850 font-mono">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Gross secured billing
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-sky-100 rounded-[28px] p-6 shadow-md shadow-teal-50/20 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Secured Bookings</span>
                <h3 className="text-2xl font-black text-slate-855 font-mono">{completedTripsCount} Trips</h3>
                <p className="text-[10px] text-teal-600 font-bold">Locks confirmed in directory</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-sky-100 rounded-[28px] p-6 shadow-md shadow-purple-50/20 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inward Leads Received</span>
                <h3 className="text-2xl font-black text-slate-855 font-mono">{agencyInquiries.length} Threads</h3>
                <p className="text-[10px] text-purple-600 font-bold">Combined channel count</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-650 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-sky-100 rounded-[28px] p-6 shadow-md shadow-orange-50/20 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Booking CR Metric</span>
                <h3 className="text-2xl font-black text-slate-855 font-mono">
                  {agencyInquiries.length ? Math.round((completedTripsCount / agencyInquiries.length) * 100) : 0}%
                </h3>
                <p className="text-[10px] text-orange-600 font-bold">Proposal-to-checkout ratio</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* MAIN GRAPH GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Timeline Area (7 Cols) */}
            <div className="lg:col-span-8 bg-white border border-sky-100 p-6 rounded-[32px] shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-650" />
                  Secured Revenue Curve
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Trajectory of cleared checkout values sorted chronologically by dispatch date</p>
              </div>

              <div className="h-80 w-full mt-6">
                {chronologicalRevenueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    No confirmed bookings to plot yet. Complete checkout payments to populate charts!
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chronologicalRevenueData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`} />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Secured Revenue']}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Area type="monotone" dataKey="Revenue (₹)" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status Split (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-sky-100 p-6 rounded-[32px] shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Funnel Status Split
                  </h4>
                  <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-0.5 text-[9px] font-black border border-slate-200">
                    <button
                      onClick={() => setStatusChartVariant('all')}
                      id="btn-status-chart-all"
                      className={`px-2 py-0.5 rounded-lg transition duration-150 ${statusChartVariant === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusChartVariant('confirmed_pending')}
                      id="btn-status-chart-vs"
                      className={`px-2 py-0.5 rounded-lg transition duration-150 ${statusChartVariant === 'confirmed_pending' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      C vs P
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium font-sans">
                  {statusChartVariant === 'all' 
                    ? "Volume division of raw inward tickets across pipeline states" 
                    : "Proportion ratio of confirmed bookings vs pending consumer leads"}
                </p>
              </div>

              <div className="h-64 w-full mt-4 flex items-center justify-center relative">
                {statusChartVariant === 'all' ? (
                  statusBreakdownData.length === 0 ? (
                    <div className="text-slate-400 text-xs font-medium">No ticket information inside directory</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={statusBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusBreakdownData.map((entry, index) => {
                            const COLORS = {
                              'Confirmed Bookings': '#10b981',
                              'Active Quotations': '#6366f1',
                              'Pending Leads': '#f59e0b',
                              'Declined/Rejected': '#f43f5e'
                            };
                            const col = (COLORS as any)[entry.name] || '#94a3b8';
                            return <Cell key={`cell-${index}`} fill={col} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  (confirmedCount + pendingCount) === 0 ? (
                    <div className="text-slate-400 text-[11px] font-semibold text-center px-4 leading-normal">
                      No confirmed or pending leads inside directory
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={confirmedVsPendingData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {confirmedVsPendingData.filter(d => d.value > 0).map((entry, index) => {
                            const COLORS = {
                              'Confirmed Leads': '#10b981',
                              'Pending Leads': '#f59e0b'
                            };
                            const col = (COLORS as any)[entry.name] || '#94a3b8';
                            return <Cell key={`cell-${index}`} fill={col} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                )}
                {/* Center label */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black uppercase text-slate-400">
                    {statusChartVariant === 'all' ? "Total Leads" : "C + P Subset"}
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {statusChartVariant === 'all' ? agencyInquiries.length : (confirmedCount + pendingCount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-4">
                {statusChartVariant === 'all' ? (
                  statusBreakdownData.map((entry, idx) => {
                    const COLORS = {
                      'Confirmed Bookings': 'bg-emerald-500',
                      'Active Quotations': 'bg-indigo-500',
                      'Pending Leads': 'bg-amber-500',
                      'Declined/Rejected': 'bg-rose-500'
                    };
                    const col = (COLORS as any)[entry.name] || 'bg-slate-500';
                    return (
                      <div key={idx} className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${col} shrink-0`} />
                        <span className="truncate">{entry.name} ({entry.value})</span>
                      </div>
                    );
                  })
                ) : (
                  confirmedVsPendingData.map((entry, idx) => {
                    const COLORS = {
                      'Confirmed Leads': 'bg-emerald-500',
                      'Pending Leads': 'bg-amber-500'
                    };
                    const col = (COLORS as any)[entry.name] || 'bg-slate-500';
                    const ratioPercent = (confirmedCount + pendingCount) > 0 
                      ? Math.round((entry.value / (confirmedCount + pendingCount)) * 100)
                      : 0;
                    return (
                      <div key={idx} className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${col} shrink-0`} />
                          <span className="truncate">{entry.name} ({entry.value})</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold ml-3.5">{ratioPercent}% of subset</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* LOWER ANALYSIS AND VEHICLE PROFITABILITY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Profitability Per Vehicle (8 Cols) */}
            <div className="lg:col-span-8 bg-white border border-sky-105 p-6 rounded-[32px] shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Most Profitable Fleet Assets
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Individual vehicle earnings comparison based on confirmed consumer hire invoices</p>
              </div>

              <div className="h-80 w-full mt-6">
                {vehicleProfitData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    No fleet earnings calculated. Registered units require complete bookings to start tracking indexes.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={vehicleProfitData} barSize={28} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`} />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Earnings']}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9' }}
                      />
                      <Bar dataKey="Total Earnings (₹)" radius={[8, 8, 0, 0]}>
                        {vehicleProfitData.map((entry, index) => {
                          const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899'];
                          return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Business Insights Panel (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-sky-100 p-6 rounded-[32px] shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Commercial Intelligence
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Observations derived from local demand loops and charter checkpoints</p>
              </div>

              {completedTripsCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs font-semibold space-y-2 mt-4">
                  <Info className="w-8 h-8 text-slate-300 animate-pulse" />
                  <p>Awaiting checkout events to trigger strategic advice.</p>
                </div>
              ) : (
                <div className="flex-1 mt-6 space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-100 p-4.5 rounded-2xl">
                    <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                      ⭐ Top Performing Unit
                    </h5>
                    <p className="text-[11px] text-slate-700 mt-1.5 font-semibold leading-relaxed">
                      Your <strong className="text-indigo-650 font-black">{vehicleProfitData[0]?.name || 'Primary unit'}</strong> is your leading cash cow. It generated <strong className="font-bold text-slate-850">₹{(vehicleProfitData[0]?.["Total Earnings (₹)"] || 0).toLocaleString('en-IN')}</strong> in volume bookings across {vehicleProfitData[0]?.Trips || 0} secure hires.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50/40 to-white border border-emerald-100 p-4.5 rounded-2xl">
                    <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                      📈 Revenue Projections
                    </h5>
                    <p className="text-[11px] text-slate-700 mt-1.5 font-semibold leading-relaxed">
                      Secured tickets represent <strong className="text-emerald-700 font-extrabold font-black">₹{totalRevenue.toLocaleString('en-IN')}</strong> in gross billings. Conversion rate stands at <strong className="font-bold">{Math.round((completedTripsCount / agencyInquiries.length) * 100)}%</strong>. Maintain high response rates on threads to increase ticket sizes.
                    </p>
                  </div>

                  <div className="bg-[#fcf8f2] border border-amber-200 p-4.5 rounded-2xl">
                     <h5 className="font-extrabold text-orange-850 text-xs flex items-center gap-1.5 font-sans">
                       💡 Fleet Optimizations
                     </h5>
                     <p className="text-[11px] text-slate-650 mt-1.5 font-semibold leading-relaxed">
                       Trips list indicates route drops are most popular towards multi-day tourist junctions. Ensure driver overnight lodging allowances are bundle quoted enroute for quicker checkout conversions!
                     </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 1: FLEET MANAGER SECTION */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-sky-50 p-6 rounded-[32px] shadow-xl">
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-wider">Fleet Operational Units</h3>
              <p className="text-xs text-slate-450 mt-1 font-medium">Add, update, or manage vehicles available for regional family bookings in {user.city}.</p>
            </div>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-full transition flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-teal-100"
            >
              <PlusCircle className="w-4 h-4" />
              {showAddForm ? 'Close Setup' : 'Register Vehicle'}
            </button>
          </div>

          {/* DYNAMIC REGISTER NEW VEHICLE FORM */}
          {showAddForm && (
            <div className="max-w-xl mx-auto bg-white border border-sky-50 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-slate-950 text-white px-6 py-6 relative">
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">Register Garaged Passenger Fleet</h4>
                <p className="text-[10px] text-slate-300 mt-1 font-medium">Define exact capacities, expected price metrics, and state-quality parameters enroute</p>
              </div>

              <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
                {registerSuccess && (
                  <div className="p-4 bg-orange-50 text-orange-950 border border-orange-200 text-xs rounded-2xl font-bold leading-relaxed">
                    {registerSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Vehicle Marketing Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxurious Force Tempo Traveller (Model 2024)"
                    className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Seating Capacity Selector matching user's image demands */}
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Seating Capacity</label>
                    <select
                      className="w-full px-4 py-3 text-xs text-slate-850 border border-sky-100 rounded-2xl bg-slate-50 font-bold cursor-pointer"
                      value={vCapacity}
                      onChange={(e) => setVCapacity(e.target.value as any)}
                    >
                      <option value="7">7 Seater SUV</option>
                      <option value="10">10 Seater Cruiser</option>
                      <option value="12">12 Seater Tempo Traveller</option>
                      <option value="14">14 Seater Premium</option>
                      <option value="17">17 Seater Coach</option>
                      <option value="20">20 Seater Medium Coach</option>
                      <option value="25">25 Seater Mini Bus</option>
                      <option value="40">40 Seater Air Volvo</option>
                      <option value="56">56 Seater Multi-axle bus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Base Rate / Km (₹)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold font-mono"
                      value={vPriceKm}
                      onChange={(e) => setVPriceKm(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">A/C Cabin Support</label>
                    <select
                      className="w-full px-4 py-3 text-xs text-slate-851 border border-sky-105 rounded-2xl bg-slate-50 font-bold cursor-pointer"
                      value={String(vIsAc)}
                      onChange={(e) => setVIsAc(e.target.value === 'true')}
                    >
                      <option value="true">Fully Air Conditioned (AC)</option>
                      <option value="false">Non Air Conditioned</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Garage City</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-xs text-slate-400 bg-slate-100 border border-sky-100 rounded-2xl cursor-not-allowed font-bold"
                      disabled
                      value={user.city || 'Surat'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider ml-1 mb-1.5">Interiors Condition</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excellent - Super Clean Recliners, GPS tracking"
                    className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold"
                    value={vCondition}
                    onChange={(e) => setVCondition(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider ml-1 mb-1.5">Vessel Specs & Accessories</label>
                  <textarea
                    rows={2}
                    placeholder="Describe boot space, premium sound boards, seat design rules..."
                    className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold"
                    value={vDetails}
                    onChange={(e) => setVDetails(e.target.value)}
                  />
                </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Photo URL link (Cover Image)</label>
                  <input
                    type="text"
                    placeholder="Paste vehicle image link"
                    className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold mb-3"
                    value={vPhotoUrl}
                    onChange={(e) => setVPhotoUrl(e.target.value)}
                  />
                  
                  <div className="flex gap-2 items-center bg-white p-2 border border-sky-50 rounded-xl mb-3">
                    <span className="text-[10px] text-slate-405 font-black uppercase tracking-wider ml-1 font-mono">Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_VEHICLE_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setVPhotoUrl(img.url)}
                          className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 p-1 px-2.5 border border-sky-50 rounded-full transition"
                        >
                          {img.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drag and Drop multiple vehicle images */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1">
                    Upload Extra Vehicle Sights / Interior Images (Multiple)
                  </label>
                  <div 
                    className="border-2 border-dashed border-sky-200 bg-teal-50/20 hover:bg-teal-50/50 rounded-2xl p-5 text-center cursor-pointer transition relative group"
                    onClick={() => document.getElementById('vehicle-image-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageUploadHelper(e.dataTransfer.files, setVImages);
                    }}
                  >
                    <input 
                      type="file" 
                      id="vehicle-image-upload" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUploadHelper(e.target.files, setVImages)}
                    />
                    <span className="text-lg block mb-1">📷</span>
                    <p className="text-xs text-slate-600 font-bold group-hover:text-amber-600 transition">
                      Drag & drop images here or <span className="underline text-indigo-600">click to browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Multiple images of bus seats, driver deck, luxury leg rests, etc.</p>
                  </div>
                  
                  {/* Visual thumbnails of uploaded images */}
                  {vImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {vImages.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-xl border-none cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-6 rounded-full text-xs uppercase tracking-wider transition shadow-lg shadow-orange-100"
                  >
                    Commit Garaged Unit
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACTIVE GARAGED LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleetList.map(veh => (
              <div key={veh.id} className="bg-white border border-sky-50 rounded-[32px] overflow-hidden hover:shadow-2xl hover:border-orange-100 transition-all duration-300 flex flex-col justify-between shadow-md">
                <div>
                  <div className="h-44 bg-slate-100 relative">
                    <img src={veh.photoUrl} alt={veh.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white font-mono text-[9px] uppercase font-black py-1 px-3 rounded-full flex items-center gap-1 backdrop-blur-md">
                      {veh.capacity} SEATER
                    </div>
                    <div className="absolute top-3 right-3 bg-teal-600 text-white font-mono text-[9px] uppercase font-black py-1 px-3 rounded-full flex items-center gap-1 backdrop-blur-md">
                      {veh.isAc ? 'A/C' : 'Non-A/C'}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h4 className="font-extrabold text-slate-855 text-sm leading-tight">{veh.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{veh.details}</p>
                    
                    <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-sky-50">
                      <span className="text-slate-400">Base rate metric:</span>
                      <span className="text-orange-500 font-black text-sm">₹{veh.pricePerKm}/km</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 px-5 text-[10px] text-slate-400 bg-slate-50 border-t border-sky-50 flex justify-between items-center font-bold">
                  <div className="flex flex-col">
                    <span className="font-mono">ID: {veh.id}</span>
                    <span className="text-teal-600 font-extrabold uppercase tracking-wide mt-0.5">{veh.condition}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditingVehicle(veh)}
                    className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[9px] tracking-wider rounded-full transition shadow-sm border-none cursor-pointer"
                  >
                    Edit Unit
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {activeTab === 'packages' && (
        <div className="space-y-8 animate-fade-in text-slate-800">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Published Tour Packages</h2>
              <p className="text-xs text-slate-500 font-medium">Create and publish fixed-price holiday itineraries with full accommodation & transit inclusions.</p>
            </div>
            
            <button
              onClick={() => {
                setShowAddPackageForm(!showAddPackageForm);
                setPublishSuccess('');
              }}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-full flex items-center gap-2 transition shadow-lg shadow-indigo-100 cursor-pointer border-none"
            >
              <PlusCircle className="w-4 h-4" />
              {showAddPackageForm ? 'View Published Packages' : 'Publish New Tour Package'}
            </button>
          </div>

          {showAddPackageForm ? (
            <div className="bg-white border border-sky-100 rounded-[32px] p-6 sm:p-8 shadow-xl max-w-2xl">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-808 border-b pb-4 mb-6">Create New Tour Package</h3>
              
              <form onSubmit={handleCreatePackage} className="space-y-6">
                
                {publishSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-250 text-xs rounded-2xl font-bold">
                    {publishSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Package Title (e.g. Surat ➔ Dwarka Deluxe Pilgrimage)</label>
                    <input
                      type="text"
                      required
                      placeholder="Surat to Dwarka Pilgrimage Tour"
                      value={pTitle}
                      onChange={(e) => setPTitle(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Pickup point (Fixed origin)</label>
                    <input
                      type="text"
                      required
                      value={pFromCity}
                      onChange={(e) => setPFromCity(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 bg-slate-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider mb-2 ml-1">Target Ultimate destination</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dwarka"
                      value={pToCity}
                      onChange={(e) => setPToCity(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider mb-2 ml-1">Key itinerary stops (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Somnath Mandir, Girnar, Bet Dwarka"
                      value={pStopsInput}
                      onChange={(e) => setPStopsInput(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-150"
                    />
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-150 rounded-[24px] space-y-4">
                  <h4 className="text-xs font-black uppercase text-indigo-700">Hotel Resort Stays details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Hotel brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Lords Inn / Somnath Sagar Resort"
                        value={pHotelName}
                        onChange={(e) => setPHotelName(e.target.value)}
                        className="w-full text-xs font-bold border border-sky-100 rounded-xl px-3 py-2 bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1.5 ml-1">Hotel Category / stars</label>
                      <select
                        value={pHotelRating}
                        onChange={(e) => setPHotelRating(e.target.value)}
                        className="w-full text-xs font-bold border border-sky-100 rounded-xl px-3 py-2 bg-white focus:outline-none"
                      >
                        <option value="3-Star Premium Deluxe">3-Star Premium Deluxe</option>
                        <option value="4-Star Luxury Alpine Resort">4-Star Luxury Alpine Resort</option>
                        <option value="5-Star Elite Heritage Stay">5-Star Elite Heritage Stay</option>
                        <option value="Standard Standard Lodging">Standard Standard Lodging</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-dashed border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">All-inclusive inclusions:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pHotelInclude}
                          onChange={(e) => setPHotelInclude(e.target.checked)}
                          className="rounded border-slate-300Accent focus:ring-0"
                        />
                        🏨 HOTEL
                      </label>
                      <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pBreakfastInclude}
                          onChange={(e) => setPBreakfastInclude(e.target.checked)}
                          className="rounded border-slate-300Accent focus:ring-0"
                        />
                        🍳 BREAKFAST
                      </label>
                      <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pLunchInclude}
                          onChange={(e) => setPLunchInclude(e.target.checked)}
                          className="rounded border-slate-300Accent focus:ring-0"
                        />
                        🍛 LUNCH
                      </label>
                      <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pDinnerInclude}
                          onChange={(e) => setPDinnerInclude(e.target.checked)}
                          className="rounded border-slate-300Accent focus:ring-0"
                        />
                        🍽️ DINNER
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Fleet vehicle designation</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium Force Traveller (AC Comfort Coach)"
                      value={pVehicleName}
                      onChange={(e) => setPVehicleName(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider mb-2 ml-1">Vehicle Seater capacity</label>
                    <select
                      value={pVehicleCapacity}
                      onChange={(e) => setPVehicleCapacity(e.target.value as any)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none"
                    >
                      <option value="7">7 Seater Cabin</option>
                      <option value="10">10 Seater Cruiser</option>
                      <option value="12">12 Seater Coach</option>
                      <option value="14">14 Seater Cruiser</option>
                      <option value="17">17 Seater Coach</option>
                      <option value="20">20 Seater Elite Transit</option>
                      <option value="25">25 Seater Premium Bus</option>
                      <option value="40">40 Seater Express Volvo</option>
                      <option value="56">56 Seater Double Axle Grand</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Price per person (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="8500"
                      value={pPricePerPerson}
                      onChange={(e) => setPPricePerPerson(Number(e.target.value))}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Tour duration in days</label>
                    <input
                      type="number"
                      required
                      value={pDurationDays}
                      onChange={(e) => setPDurationDays(Number(e.target.value))}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Tour itinerary summary & Description</label>
                    <textarea
                      rows={3}
                      placeholder="Write brief description coordinates..."
                      value={pDescription}
                      onChange={(e) => setPDescription(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Package Photo URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800"
                      value={pPhotoUrl}
                      onChange={(e) => setPPhotoUrl(e.target.value)}
                      className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider ml-1">
                      Upload Hotel/Resort Images (Multiple)
                    </label>
                    <div 
                      className="border-2 border-dashed border-sky-100 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 text-center cursor-pointer transition relative group"
                      onClick={() => document.getElementById('pkg-hotel-uploads')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleImageUploadHelper(e.dataTransfer.files, setPHotelImages);
                      }}
                    >
                      <input 
                        type="file" 
                        id="pkg-hotel-uploads" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUploadHelper(e.target.files, setPHotelImages)}
                      />
                      <span className="text-base block mb-0.5">🏨</span>
                      <p className="text-xs text-slate-600 font-bold group-hover:text-indigo-600 transition">
                        Drag & drop or <span className="underline text-indigo-600">browse hotels</span>
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">Multiple rooms, lounge, dining etc.</p>
                    </div>
                    {pHotelImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {pHotelImages.map((img, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-xl border-none cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPHotelImages((prev) => prev.filter((_, i) => i !== idx));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider ml-1">
                      Upload Transit Vehicle/Group Bus Images (Multiple)
                    </label>
                    <div 
                      className="border-2 border-dashed border-sky-100 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 text-center cursor-pointer transition relative group"
                      onClick={() => document.getElementById('pkg-vehicle-uploads')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleImageUploadHelper(e.dataTransfer.files, setPVehicleImages);
                      }}
                    >
                      <input 
                        type="file" 
                        id="pkg-vehicle-uploads" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUploadHelper(e.target.files, setPVehicleImages)}
                      />
                      <span className="text-base block mb-0.5">🚌</span>
                      <p className="text-xs text-slate-600 font-bold group-hover:text-indigo-600 transition">
                        Drag & drop or <span className="underline text-indigo-600">browse transit</span>
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">Multiple vehicle angles, seats, exteriors</p>
                    </div>
                    {pVehicleImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {pVehicleImages.map((img, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-xl border-none cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPVehicleImages((prev) => prev.filter((_, i) => i !== idx));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPackageForm(false)}
                    className="px-5 py-3 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer border-none"
                  >
                    Publish Package Deal
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingPackages ? (
                <div className="col-span-full text-center py-12 bg-white rounded-[32px] border border-slate-100">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-505 rounded-full mb-3" />
                  <p className="text-xs text-slate-500 font-mono">Curating packages database...</p>
                </div>
              ) : packagesList.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-[32px] border border-slate-200 p-8">
                  <p className="text-slate-600 font-bold text-sm">No special holiday packages published on this coordinate yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Publish an all-inclusive Surat ➔ Dwarka package to increase bookings!</p>
                </div>
              ) : (
                packagesList.map(pkg => (
                  <div key={pkg.id} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-md flex flex-col justify-between hover:shadow-xl transition-all duration-300">
                    <div>
                      <div className="h-44 bg-slate-100 relative">
                        <img src={pkg.photoUrl} alt={pkg.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 left-3 bg-slate-900/80 text-white font-mono text-[9px] uppercase font-black py-1 px-3 rounded-full flex items-center gap-1 backdrop-blur-md">
                          ₹{pkg.pricePerPerson}/person
                        </div>
                        <div className="absolute top-3 right-3 bg-orange-500 text-white font-mono text-[9px] uppercase font-black py-1 px-3 rounded-full flex items-center gap-1 backdrop-blur-md">
                          {pkg.durationDays} DAYS
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <h4 className="font-extrabold text-slate-855 text-sm leading-tight uppercase">{pkg.title}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{pkg.description}</p>
                        </div>

                        {/* Stops route list */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">ROUTE STOPS:</span>
                          <p className="text-xs font-semibold text-slate-700">
                            {pkg.fromCity} ➔ {pkg.stops.join(' ➔ ')} ➔ {pkg.toCity}
                          </p>
                        </div>

                        {/* Accomodation */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase font-black">STAYS AT:</span>
                            <span className="text-xs font-extrabold text-slate-800">{pkg.hotelName} ({pkg.hotelRating})</span>
                          </div>
                        </div>

                        {/* Food inclusions block */}
                        <div className="pt-2 border-t border-dashed border-slate-200">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">INCLUDED MEALS:</span>
                          <div className="flex flex-wrap gap-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${pkg.inclusions.hotel ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100/60 text-slate-400'}`}>HOTEL</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${pkg.inclusions.breakfast ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100/60 text-slate-400'}`}>🍳 B'FAST</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${pkg.inclusions.lunch ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100/60 text-slate-400'}`}>🍛 LUNCH</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${pkg.inclusions.dinner ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100/60 text-slate-400'}`}>🍽️ DINNER</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="p-4 px-6 text-[10px] text-slate-450 bg-slate-50 border-t border-sky-50 flex justify-between items-center font-black">
                      <span className="font-mono text-indigo-700">{pkg.vehicleCapacity} SEATER • 🚍 {pkg.vehicleName}</span>
                      <button
                        onClick={() => startEditingPackage(pkg)}
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-805 text-indigo-700 rounded-full font-black text-[9px] uppercase cursor-pointer transition flex items-center gap-1 shrink-0"
                      >
                        ✏️ Edit Package
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: CUSTOMER INQUIRIES QUEUE - WHATSAPP STYLE */}
      {activeTab === 'inquiries' && (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl flex h-[740px] font-sans relative">
          
          {/* WhatsApp Left Sidebar: Inward Route Tickets list */}
          <div className="w-full md:w-80 lg:w-[340px] shrink-0 border-r border-slate-200 flex flex-col bg-[#f0f2f5]">
            {/* Sidebar header profile */}
            <div className="bg-[#f0f2f5] p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-850 text-xs leading-tight">Inward Tickets</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Agency Inbox ({agencyInquiries.length})</p>
                </div>
              </div>
            </div>

            {/* Inquiries list scroll window */}
            <div className="flex-grow overflow-y-auto bg-white col-inquiries-list">
              {agencyInquiries.length === 0 ? (
                <div className="text-center p-8 mt-12 text-slate-400 text-xs space-y-2">
                  <p>No inward inquiries discovered yet.</p>
                  <p className="text-[10px] text-slate-350 font-bold">Your vehicles in Surat, Delhi, or Mumbai will receive enquiries from customers once registered.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {agencyInquiries.map((inq, idx) => {
                    const isSelected = selectedInquiry?.id === inq.id;
                    return (
                      <motion.button
                        key={inq.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.4), ease: "easeOut" }}
                        onClick={() => { setSelectedInquiry(inq); setRightPanel('none'); }}
                        className={`w-full text-left p-4 transition-all flex items-center gap-3 border-none cursor-pointer focus:outline-none ${isSelected ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-slate-50'}`}
                      >
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {inq.customerName.charAt(0).toUpperCase()}
                        </div>
                        {/* Ticket Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-black text-slate-805 text-xs truncate uppercase tracking-tight">{inq.customerName}</h4>
                            <span className="text-[9px] text-slate-400 font-mono font-bold">{inq.startDate.split('-').slice(1).join('/')}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate font-semibold">
                            Route: {inq.fromCity} ➔ {inq.toCity} ({inq.durationDays} Days)
                          </p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              inq.status === 'confirmed' ? 'bg-emerald-100 text-emerald-850 border border-emerald-250 animate-none' :
                              inq.status === 'accepted' ? 'bg-indigo-100 text-indigo-850 border border-indigo-250 animate-pulse' :
                              inq.status === 'declined' ? 'bg-rose-100 text-rose-850 border border-rose-200' :
                              'bg-amber-100 text-amber-850 border border-amber-200'
                            }`}>
                              {inq.status}
                            </span>
                            <span className="text-[10px] text-slate-800 font-extrabold font-mono text-right font-mono">
                              {inq.finalTotalQuote ? `₹${inq.finalTotalQuote}` : 'Awaiting Quote'}
                            </span>
                          </div>

                          {inq.status === 'accepted' && (
                            (() => {
                              const baseTimeStr = inq.quotedAt || inq.createdAt;
                              const baseTime = new Date(baseTimeStr).getTime();
                              const now = new Date().getTime();
                              const elapsedHours = (now - baseTime) / (1000 * 60 * 60);
                              const limitHours = 72;
                              const isOverdue = elapsedHours > limitHours;
                              const remaining = Math.max(0, limitHours - elapsedHours);
                              
                              if (isOverdue) {
                                const hoursOver = Math.floor(elapsedHours - limitHours);
                                const timeStr = hoursOver < 24 ? `${hoursOver}h` : `${Math.floor(hoursOver / 24)}d`;
                                return (
                                  <div className="text-[9px] text-rose-600 font-black flex items-center gap-1 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md mt-1 shrink-0 animate-pulse">
                                    <Clock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                    <span>⚠️ OVERDUE ({timeStr} open)</span>
                                  </div>
                                );
                              } else {
                                const remHours = Math.floor(remaining);
                                const timeStr = remHours >= 24 ? `${Math.floor(remHours / 24)}d ${remHours % 24}h` : `${remHours}h`;
                                return (
                                  <div className="text-[9px] text-amber-600 font-black flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md mt-1 shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                    <span>🕒 {timeStr} remaining</span>
                                  </div>
                                );
                              }
                            })()
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Main Workspace on Right */}
          <div className="flex-grow flex bg-[#efeae2] relative min-w-0 h-full">
            {!selectedInquiry ? (
              /* WhatsApp Beautiful Idle Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8f9fa] h-full border-r border-slate-100">
                <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6 shadow-md shadow-teal-100 animate-bounce">
                  <MessageSquare className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-lg font-black text-slate-855 underline decoration-teal-600 decoration-4 underline-offset-4 uppercase tracking-wider font-displayAndSans">
                  Agency Inward Desk
                </h3>
                <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed font-bold">
                  Select an active customer route inquiry from the left panels list to discuss custom distance metrics, state toll permits, and dispatch professional pricing proposals directly!
                </p>
                <div className="mt-8 pt-6 border-t border-slate-200/55 w-44 flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-mono tracking-widest font-black uppercase">
                  <span>🔒 End-to-End Encrypted</span>
                </div>
              </div>
            ) : (
              /* WhatsApp active chat screen */
              <div className="flex-1 flex min-w-0 h-full">
                
                {/* Chat Stream Panel */}
                <div className="flex-grow flex flex-col min-w-0 h-full bg-[#efeae2]">
                  
                  {/* WhatsApp Custom Header */}
                  <div className="bg-[#f0f2f5] px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {selectedInquiry.customerName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-855 text-xs uppercase tracking-tight truncate">
                          Client: {selectedInquiry.customerName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          Coach: {selectedInquiry.vehicleName} • Route: {selectedInquiry.fromCity} ➔ {selectedInquiry.toCity}
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp styled action header tags */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quick Accept/Decline if pending */}
                      {selectedInquiry.status === 'pending' && (
                        <div className="flex gap-1.5 mr-1">
                          <button
                            onClick={() => handleUpdateStatus(selectedInquiry.id, 'declined')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[9px] uppercase px-3 py-1.5 rounded-full transition border-none cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedInquiry.id, 'accepted')}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-black text-[9px] uppercase px-3.5 py-1.5 rounded-full transition shadow-xs border-none cursor-pointer"
                          >
                            Accept
                          </button>
                        </div>
                      )}

                      {/* Propose Invoice toggle */}
                      <button
                        onClick={() => setRightPanel(rightPanel === 'quote' ? 'none' : 'quote')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-155 flex items-center gap-1 border-none cursor-pointer ${rightPanel === 'quote' ? 'bg-[#059669] text-white shadow-md' : 'bg-orange-50 border border-orange-200 text-orange-850 hover:bg-orange-100'}`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Invoice Propose
                      </button>
                    </div>
                  </div>

                  {selectedInquiry.status === 'accepted' && (
                    (() => {
                      const baseTimeStr = selectedInquiry.quotedAt || selectedInquiry.createdAt;
                      const baseTime = new Date(baseTimeStr).getTime();
                      const now = new Date().getTime();
                      const elapsedHours = (now - baseTime) / (1000 * 60 * 60);
                      const limitHours = 72;
                      const isOverdue = elapsedHours > limitHours;
                      const remaining = Math.max(0, limitHours - elapsedHours);
                      
                      if (isOverdue) {
                        const hoursOver = Math.floor(elapsedHours - limitHours);
                        const timeStr = hoursOver < 24 ? `${hoursOver}h overdue` : `${Math.floor(hoursOver / 24)}d overdue`;
                        return (
                          <div className="bg-rose-50 border-b border-rose-100 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-rose-800 z-10 shrink-0 shadow-sm animate-pulse">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                              <span><strong>Proposal Warning:</strong> Customer action is overdue by {timeStr} (limit: 72 hours). Please nudge client!</span>
                            </div>
                            <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono shrink-0">EXPIRED</span>
                          </div>
                        );
                      } else {
                        const remHours = Math.floor(remaining);
                        const timeStr = remHours >= 24 ? `${Math.floor(remHours / 24)}d ${remHours % 24}h` : `${remHours}h`;
                        return (
                          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-800 z-10 shrink-0 shadow-sm">
                            <div className="flex items-center gap-2 font-displayAndSans">
                              <Info className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
                              <span><strong>Proposal Open:</strong> Sent price quote. Awaiting customer checkout payment.</span>
                            </div>
                            <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono shrink-0">
                              🕒 {timeStr} left
                            </span>
                          </div>
                        );
                      }
                    })()
                  )}

                  {/* Messages Window (WhatsApp Wallpaper styled) */}
                  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 shadow-inner bg-[#efeae2]">
                    
                    {/* Centered System Trip Information Banner */}
                    <div className="flex justify-center my-2">
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 max-w-sm text-center border border-slate-200 shadow-xs text-[10px] leading-relaxed text-slate-600 space-y-1">
                        <div className="font-black text-slate-850 uppercase tracking-widest text-[9px] mb-1 font-mono">📋 Live Inquiry Requirements</div>
                        <div><strong>Route Stops:</strong> {selectedInquiry.placesToCover && selectedInquiry.placesToCover.length > 0 ? selectedInquiry.placesToCover.join(' ➔ ') : `${selectedInquiry.fromCity} ➔ ${selectedInquiry.toCity}`}</div>
                        <div className="flex justify-center gap-4 mt-1 font-mono text-[9px] font-bold text-slate-705">
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
                            <div className="bg-amber-100 text-amber-955 font-bold border border-amber-200 uppercase tracking-wider text-[9px] px-4 py-1.5 rounded-full inline-block text-center max-w-[90%] font-mono leading-relaxed shadow-xs">
                              {renderMessageContent(msg.content)}
                            </div>
                          ) : (
                            <>
                              <span className="text-[9px] text-slate-400 px-1 font-bold mb-0.5">
                                {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              
                              <div className={`p-3 text-xs rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                                isMe ? 'bg-[#d9fdd3] text-slate-805 rounded-tr-none' : 'bg-white text-slate-855 rounded-tl-none border border-slate-200'
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
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-805 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold shadow-xs"
                      placeholder="Type a message to discuss custom stops, state permit fees or driver food..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="bg-teal-600 text-white p-2.5 rounded-full hover:bg-teal-700 transition duration-155 shadow-md flex items-center justify-center shrink-0 border-none cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </form>

                </div>

                {/* Right Slider Drawer Column (mimics WhatsApp group specifics drawer) */}
                {rightPanel !== 'none' && (
                  <div className="w-80 lg:w-[350px] border-l border-slate-200 bg-[#fbfbfb] flex flex-col shrink-0 h-full overflow-y-auto duration-150 transition-all">
                    
                    {/* Drawer Header */}
                    <div className="bg-[#f0f2f5] p-3.5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 shrink-0">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        Cost Proposal
                      </h4>
                      <button
                        onClick={() => setRightPanel('none')}
                        className="text-slate-400 hover:text-slate-655 font-black text-xs uppercase bg-transparent border-none cursor-pointer hover:underline"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="p-4 space-y-4 text-slate-705">
                      
                      {/* proposals form */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-4 shadow-xs">
                        <div className="border-b border-slate-100 pb-2">
                          <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
                            Draft per-kilometer parameters and define overnight drivers boardings. This notifies customer thread instantly.
                          </p>
                        </div>

                        <form onSubmit={handleProposeQuote} className="space-y-4">
                          {quoteSuccessMsg && (
                            <div className="p-3 bg-teal-50 text-teal-955 text-xs border border-teal-200 rounded-xl font-bold">
                              {quoteSuccessMsg}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-1 font-mono">Price/Km (₹)</label>
                              <input
                                type="number"
                                className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 text-slate-805 rounded-xl font-bold font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                value={qPricePerKm}
                                onChange={(e) => setQPricePerKm(Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-1 font-mono">Est. Distance (Km)</label>
                              <input
                                type="number"
                                className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 text-slate-855 rounded-xl font-bold font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                value={qDistanceKm}
                                onChange={(e) => setQDistanceKm(Number(e.target.value))}
                              />
                            </div>
                          </div>

                          <div className="text-[8px] font-black text-teal-800 uppercase tracking-wider block bg-teal-50 border border-teal-100 py-1 rounded-full text-center">
                            Driver Accessory Boardings
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold uppercase ml-1 mb-1 font-mono">Driver Room (₹)</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-855 rounded-xl font-bold font-mono text-xs focus:outline-none"
                                value={qDriverStay}
                                onChange={(e) => setQDriverStay(Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold uppercase ml-1 mb-1 font-mono">Driver Boarding (₹)</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-855 rounded-xl font-bold font-mono text-xs focus:outline-none"
                                value={qMeals}
                                onChange={(e) => setQMeals(Number(e.target.value))}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold uppercase ml-1 mb-1 font-mono">Highway Tolls (₹)</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-855 rounded-xl font-bold font-mono text-xs focus:outline-none"
                                value={qTolls}
                                onChange={(e) => setQTolls(Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold uppercase ml-1 mb-1 font-mono">Border Permits (₹)</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 text-slate-855 rounded-xl font-bold font-mono text-xs focus:outline-none"
                                value={qOther}
                                onChange={(e) => setQOther(Number(e.target.value))}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-1 font-sans">Route Remarks / Breakdown description</label>
                            <textarea
                              rows={2}
                              className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 text-slate-855 rounded-xl font-semibold text-xs focus:outline-none"
                              placeholder="e.g. Includes Delhi state border green taxes."
                              value={qExplanation}
                              onChange={(e) => setQExplanation(e.target.value)}
                            />
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-orange-50/50 p-3 rounded-xl text-xs font-bold leading-none">
                            <span className="text-slate-500 font-black uppercase text-[8px] tracking-wider font-mono">Total Quotation:</span>
                            <span className="font-mono font-black text-orange-600 text-[14px]">
                              ₹{((qPricePerKm * qDistanceKm) + qDriverStay + qMeals + qTolls + qOther)}
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={quoteSubmitting}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-2.5 px-4 rounded-xl text-xs flex justify-center items-center gap-1.5 transition uppercase tracking-wider shadow-sm border-none cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4 text-white" />
                            {quoteSubmitting ? 'Dispatching Propose...' : 'Publish Propose Invoice'}
                          </button>
                        </form>
                      </div>

                      {/* confirmed receipt banner */}
                      {selectedInquiry.status === 'confirmed' && (
                        <div className="bg-emerald-50 border border-emerald-250 rounded-3xl p-4 text-center space-y-1 bg-emerald-50/20 shadow-xs">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                          <h4 className="font-bold text-emerald-800 text-xs text-slate-850">Trip Formally Booked!</h4>
                          <p className="text-[10px] text-emerald-600 font-semibold leading-relaxed">
                            The user has successfully settled the booking balance. All slots are locked down. Look out for the travellers list inside the ticket chat header!
                          </p>
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

      {/* EDIT PACKAGE MODAL DIALOG */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-[32px] p-6 sm:p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Edit Tour Package</h3>
              <button 
                type="button"
                onClick={() => setEditingPackage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdatePackageSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Package Title</label>
                  <input
                    type="text"
                    required
                    value={editPTitle}
                    onChange={(e) => setEditPTitle(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Travel Agency Name</label>
                  <input
                    type="text"
                    disabled
                    value={editingPackage.agencyName}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Starting Hub (From City)</label>
                  <input
                    type="text"
                    required
                    value={editPFromCity}
                    onChange={(e) => setEditPFromCity(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Destination Target (To City)</label>
                  <input
                    type="text"
                    required
                    value={editPToCity}
                    onChange={(e) => setEditPToCity(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Intermediate Route Stops (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Udaipur, Ajmer, Jaipur"
                  value={editPStopsInput}
                  onChange={(e) => setEditPStopsInput(e.target.value)}
                  className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Lodging Hotel Name</label>
                  <input
                    type="text"
                    value={editPHotelName}
                    onChange={(e) => setEditPHotelName(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Hotel Star Rating</label>
                  <select
                    value={editPHotelRating}
                    onChange={(e) => setEditPHotelRating(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 bg-white rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  >
                    <option value="2-Star Standard">2-Star Standard</option>
                    <option value="3-Star Premium Deluxe">3-Star Premium Deluxe</option>
                    <option value="4-Star Luxury Heritage">4-Star Luxury Heritage</option>
                    <option value="5-Star Royal Palace Class">5-Star Royal Palace Class</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">Lodging & Boarding Inclusions</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input type="checkbox" checked={editPHotelInclude} onChange={(e) => setEditPHotelInclude(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    <span>Resort Stay</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input type="checkbox" checked={editPBreakfastInclude} onChange={(e) => setEditPBreakfastInclude(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    <span>Breakfast</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input type="checkbox" checked={editPLunchInclude} onChange={(e) => setEditPLunchInclude(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    <span>Lunch</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input type="checkbox" checked={editPDinnerInclude} onChange={(e) => setEditPDinnerInclude(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    <span>Dinner</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Transportation Transit Coach Name</label>
                  <input
                    type="text"
                    required
                    value={editPVehicleName}
                    onChange={(e) => setEditPVehicleName(e.target.value)}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Coach Seat Capacity</label>
                  <select
                    value={editPVehicleCapacity}
                    onChange={(e) => setEditPVehicleCapacity(e.target.value as any)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Price Per Person (₹)</label>
                  <input
                    type="number"
                    required
                    value={editPPricePerPerson}
                    onChange={(e) => setEditPPricePerPerson(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Trip Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={editPDurationDays}
                    onChange={(e) => setEditPDurationDays(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider mb-2 ml-1">Tour Description & Details</label>
                <textarea
                  rows={4}
                  required
                  value={editPDescription}
                  onChange={(e) => setEditPDescription(e.target.value)}
                  className="w-full text-xs font-semibold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider mb-2 ml-1">Promotional Cover Photo Image URL</label>
                <input
                  type="text"
                  value={editPPhotoUrl}
                  onChange={(e) => setEditPPhotoUrl(e.target.value)}
                  className="w-full text-xs font-bold border border-sky-100 rounded-2xl px-4 py-3 focus:outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1">
                    Edit / Upload Hotel/Resort Images (Multiple)
                  </label>
                  <div 
                    className="border-2 border-dashed border-sky-100 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 text-center cursor-pointer transition relative group"
                    onClick={() => document.getElementById('edit-pkg-hotel-uploads')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageUploadHelper(e.dataTransfer.files, setEditPHotelImages);
                    }}
                  >
                    <input 
                      type="file" 
                      id="edit-pkg-hotel-uploads" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUploadHelper(e.target.files, setEditPHotelImages)}
                    />
                    <span className="text-base block mb-0.5">🏨</span>
                    <p className="text-xs text-slate-600 font-bold group-hover:text-indigo-600 transition">
                      Drag & drop or <span className="underline text-indigo-600">browse hotels</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold">Multiple rooms, lounge, dining etc.</p>
                  </div>
                  {editPHotelImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editPHotelImages.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-xl border-none cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPHotelImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1">
                    Edit / Upload Transit Vehicle/Group Bus Images (Multiple)
                  </label>
                  <div 
                    className="border-2 border-dashed border-sky-100 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 text-center cursor-pointer transition relative group"
                    onClick={() => document.getElementById('edit-pkg-vehicle-uploads')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageUploadHelper(e.dataTransfer.files, setEditPVehicleImages);
                    }}
                  >
                    <input 
                      type="file" 
                      id="edit-pkg-vehicle-uploads" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUploadHelper(e.target.files, setEditPVehicleImages)}
                    />
                    <span className="text-base block mb-0.5">🚌</span>
                    <p className="text-xs text-slate-600 font-bold group-hover:text-indigo-600 transition">
                      Drag & drop or <span className="underline text-indigo-600">browse transit</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold">Multiple vehicle angles, seats, exteriors</p>
                  </div>
                  {editPVehicleImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editPVehicleImages.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-xl border-none cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPVehicleImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
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

      {/* EDIT VEHICLE MODAL DIALOG */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-[32px] p-6 sm:p-8 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Edit Garaged Vehicle</h3>
              <button 
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateVehicleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Vehicle Marketing Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxurious Force Tempo Traveller (Model 2024)"
                  className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold"
                  value={editVName}
                  onChange={(e) => setEditVName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Seating Capacity</label>
                  <select
                    className="w-full px-4 py-3 text-xs text-slate-850 border border-sky-100 rounded-2xl bg-slate-50 font-bold cursor-pointer"
                    value={editVCapacity}
                    onChange={(e) => setEditVCapacity(e.target.value as any)}
                  >
                    <option value="7">7 Seater SUV</option>
                    <option value="10">10 Seater Cruiser</option>
                    <option value="12">12 Seater Tempo Traveller</option>
                    <option value="14">14 Seater Premium</option>
                    <option value="17">17 Seater Coach</option>
                    <option value="20">20 Seater Medium Coach</option>
                    <option value="25">25 Seater Mini Bus</option>
                    <option value="40">40 Seater Air Volvo</option>
                    <option value="56">56 Seater Multi-axle bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Base Rate / Km (₹)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold font-mono"
                    value={editVPriceKm}
                    onChange={(e) => setEditVPriceKm(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">A/C Cabin Support</label>
                  <select
                    className="w-full px-4 py-3 text-xs text-slate-851 border border-sky-105 rounded-2xl bg-slate-50 font-bold cursor-pointer"
                    value={String(editVIsAc)}
                    onChange={(e) => setEditVIsAc(e.target.value === 'true')}
                  >
                    <option value="true">Fully Air Conditioned (AC)</option>
                    <option value="false">Non Air Conditioned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Garage City</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-xs text-slate-400 bg-slate-100 border border-sky-100 rounded-2xl cursor-not-allowed font-bold"
                    disabled
                    value={editVCity || user.city || 'Surat'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider ml-1 mb-1.5">Interiors Condition</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excellent - Super Clean Recliners, GPS tracking"
                  className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold"
                  value={editVCondition}
                  onChange={(e) => setEditVCondition(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Vessel Specs & Accessories</label>
                <textarea
                  rows={2}
                  placeholder="Describe boot space, premium sound boards, seat design rules..."
                  className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold"
                  value={editVDetails}
                  onChange={(e) => setEditVDetails(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1 mb-1.5">Photo URL link (Cover Image)</label>
                  <input
                    type="text"
                    placeholder="Paste vehicle image link"
                    className="w-full px-4 py-3 text-xs text-slate-805 border border-sky-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-150 focus:border-teal-500 font-bold mb-3"
                    value={editVPhotoUrl}
                    onChange={(e) => setEditVPhotoUrl(e.target.value)}
                  />
                  
                  <div className="flex gap-2 items-center bg-white p-2 border border-sky-50 rounded-xl mb-3">
                    <span className="text-[10px] text-slate-405 font-black uppercase tracking-wider ml-1 font-mono">Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_VEHICLE_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditVPhotoUrl(img.url)}
                          className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 p-1 px-2.5 border border-sky-50 rounded-full transition"
                        >
                          {img.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drag and Drop multiple vehicle images */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-black text-slate-455 tracking-wider ml-1">
                    Upload Extra Vehicle Sights / Interior Images (Multiple)
                  </label>
                  <div 
                    className="border-2 border-dashed border-sky-200 bg-teal-50/20 hover:bg-teal-50/50 rounded-2xl p-5 text-center cursor-pointer transition relative group"
                    onClick={() => document.getElementById('edit-vehicle-image-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageUploadHelper(e.dataTransfer.files, setEditVImages);
                    }}
                  >
                    <input 
                      type="file" 
                      id="edit-vehicle-image-upload" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUploadHelper(e.target.files, setEditVImages)}
                    />
                    <span className="text-lg block mb-1">📷</span>
                    <p className="text-xs text-slate-600 font-bold group-hover:text-amber-600 transition">
                      Drag & drop images here or <span className="underline text-indigo-600">click to browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Multiple images of bus seats, driver deck, luxury leg rests, etc.</p>
                  </div>
                  
                  {/* Visual thumbnails of uploaded images */}
                  {editVImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {editVImages.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-xl border-none cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditVImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
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
