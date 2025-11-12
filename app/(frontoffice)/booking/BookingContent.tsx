'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainClientForm from '@/components/booking/MainClientForm';
import GuestForm from '@/components/booking/GuestForm';
import type { CompleteClientInfo, GuestInfo } from '@/types/guest.types';

export default function BookingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accommodationId = searchParams.get('accommodation');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Dates
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [numberOfNights, setNumberOfNights] = useState(0);
    const [arrivalTime, setArrivalTime] = useState('');

    // Client principal
    const [mainClient, setMainClient] = useState<CompleteClientInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: '',
        gender: 'M',
        dateOfBirth: new Date(),
        idType: 'passport',
        idNumber: '',
        address: '',
        city: '',
        country: 'Burundi',
        customerType: 'individual',
    });

    // Invités
    const [numberOfGuests, setNumberOfGuests] = useState(1);
    const [guests, setGuests] = useState<GuestInfo[]>([]);
    const [specialRequests, setSpecialRequests] = useState('');

    // Calcul du nombre de nuits
    useEffect(() => {
        if (checkInDate && checkOutDate) {
            const start = new Date(checkInDate);
            const end = new Date(checkOutDate);
            const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            setNumberOfNights(nights > 0 ? nights : 0);
        }
    }, [checkInDate, checkOutDate]);

    // Gestion des invités
    useEffect(() => {
        const guestCount = numberOfGuests - 1;
        if (guestCount > guests.length) {
            const newGuests = [...guests];
            for (let i = guests.length; i < guestCount; i++) {
                newGuests.push({
                    firstName: '',
                    lastName: '',
                    gender: 'M',
                    dateOfBirth: new Date(),
                    nationality: '',
                    idType: 'passport',
                    idNumber: '',
                    relationshipToMainClient: 'friend',
                    isMinor: false,
                });
            }
            setGuests(newGuests);
        } else if (guestCount < guests.length) {
            setGuests(guests.slice(0, guestCount));
        }
    }, [numberOfGuests, guests.length]);

    const updateGuest = (index: number, guest: GuestInfo) => {
        const updated = [...guests];
        updated[index] = guest;
        setGuests(updated);
    };

    const removeGuest = (index: number) => {
        setGuests(guests.filter((_, i) => i !== index));
        setNumberOfGuests(numberOfGuests - 1);
    };

    const validateForm = () => {
        if (!checkInDate || !checkOutDate) {
            setError('Veuillez sélectionner les dates de séjour');
            return false;
        }

        if (numberOfNights <= 0) {
            setError('La date de départ doit être après la date d\'arrivée');
            return false;
        }

        const requiredClientFields: (keyof CompleteClientInfo)[] = [
            'firstName', 'lastName', 'email', 'phone', 'nationality',
            'idNumber', 'address', 'city', 'country'
        ];

        for (const field of requiredClientFields) {
            if (!mainClient[field]) {
                setError(`Veuillez remplir le champ "${field}" du client principal`);
                return false;
            }
        }

        if (mainClient.customerType === 'corporate' || mainClient.customerType === 'agency') {
            if (!mainClient.companyName) {
                setError('Veuillez fournir le nom de l\'entreprise/agence');
                return false;
            }
        }

        for (let i = 0; i < guests.length; i++) {
            const guest = guests[i];
            if (!guest.firstName || !guest.lastName || !guest.nationality ||
                !guest.idNumber || !guest.relationshipToMainClient) {
                setError(`Veuillez remplir toutes les informations de l'invité ${i + 1}`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const bookingData = {
                accommodationId,
                checkInDate,
                checkOutDate,
                numberOfNights,
                arrivalTime,
                mainClient,
                guests,
                numberOfGuests,
                specialRequests,
            };

            const response = await fetch('/api/public/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erreur lors de la réservation');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/booking-confirmation/${data.data.id}`);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 py-8 pt-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
                        Réservation Complète
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Finalisez votre réservation en quelques étapes simples. Nous nous occupons du reste pour vous offrir un séjour inoubliable.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12">
                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-amber-600">Étape 1 sur 1</span>
                            <span className="text-sm text-gray-500">Informations complètes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full w-full transition-all duration-500"></div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-green-700 font-medium">Réservation effectuée avec succès! Redirection...</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Dates Section */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Dates de séjour</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Date d'arrivée <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={checkInDate}
                                            onChange={(e) => setCheckInDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Date de départ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={checkOutDate}
                                        onChange={(e) => setCheckOutDate(e.target.value)}
                                        min={checkInDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Nombre de nuits
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={numberOfNights}
                                            readOnly
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-semibold shadow-sm"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Heure d'arrivée
                                    </label>
                                    <input
                                        type="time"
                                        value={arrivalTime}
                                        onChange={(e) => setArrivalTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Guests Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Nombre de personnes</h2>
                            </div>
                            <div className="max-w-md">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Nombre total de personnes (incluant vous) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={numberOfGuests}
                                        onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                                        required
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <option key={num} value={num}>
                                                {num} {num === 1 ? 'personne' : 'personnes'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <MainClientForm client={mainClient} onChange={setMainClient} />

                        {guests.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Invités / Accompagnants ({guests.length})
                                    </h2>
                                </div>
                                <div className="space-y-6">
                                    {guests.map((guest, index) => (
                                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                            <GuestForm
                                                guest={guest}
                                                index={index}
                                                onChange={(updated) => updateGuest(index, updated)}
                                                onRemove={() => removeGuest(index)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Special Requests Section */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Demandes spéciales</h2>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Avez-vous des demandes particulières pour votre séjour ?
                                </label>
                                <textarea
                                    value={specialRequests}
                                    onChange={(e) => setSpecialRequests(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm resize-none"
                                    placeholder="Exemples : Régime alimentaire spécial, besoins d'accessibilité, préférences de chambre (étage élevé, vue mer), célébration spéciale (anniversaire, lune de miel), heure d'arrivée tardive, etc."
                                />
                                <p className="text-xs text-gray-500 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Nous ferons de notre mieux pour répondre à vos demandes selon nos disponibilités.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200 space-y-4 sm:space-y-0">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Retour</span>
                            </button>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-2 transform hover:scale-105 disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Traitement en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Confirmer la réservation</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
