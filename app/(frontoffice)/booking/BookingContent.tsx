'use client';

import { useState, useEffect } from 'react';

// Types simplifiés pour la démo
type CompleteClientInfo = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    gender: string;
    dateOfBirth: Date;
    idType: string;
    idNumber: string;
    address: string;
    city: string;
    country: string;
    customerType: string;
    companyName?: string;
};

type GuestInfo = {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date;
    nationality: string;
    idType: string;
    idNumber: string;
    relationshipToMainClient: string;
    isMinor: boolean;
};

export default function BookingContent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

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

    const totalSteps = 3;
    const stepTitles = ['Sélection', 'Informations', 'Confirmation'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Amélioré */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 mb-4 tracking-tight">
                        Réservation
                    </h1>
                    <p className="text-xl text-slate-700 max-w-2xl mx-auto font-semibold">
                        Complétez votre réservation en 3 étapes simples
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
                    {/* Progress Bar Amélioré */}
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-6 py-8 border-b-2 border-amber-200">
                        {/* Step Indicators Horizontal */}
                        <div className="flex justify-between items-center mb-8 relative">
                            {/* Ligne de connexion */}
                            <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 -z-10">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-700 ease-out"
                                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                                ></div>
                            </div>

                            {stepTitles.map((title, index) => (
                                <div key={index} className="flex flex-col items-center relative z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-black transition-all duration-300 ${index + 1 < currentStep
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-110'
                                            : index + 1 === currentStep
                                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl scale-125 ring-4 ring-amber-200'
                                            : 'bg-white border-3 border-slate-300 text-slate-400'
                                        }`}>
                                        {index + 1 < currentStep ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span className={`mt-3 text-sm font-bold transition-all duration-300 text-center max-w-[100px] ${index + 1 === currentStep ? 'text-amber-600 scale-110' : index + 1 < currentStep ? 'text-green-600' : 'text-slate-500'
                                        }`}>
                                        {title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Titre de l'étape actuelle */}
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">
                                {stepTitles[currentStep - 1]}
                            </h2>
                            <p className="text-slate-600 font-semibold">
                                Étape {currentStep} sur {totalSteps}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="px-8 pt-6">
                        {error && (
                            <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-800 font-semibold">{error}</p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-green-800 font-semibold">Réservation effectuée avec succès! Redirection...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Content */}
                    <form className="p-8 space-y-8">
                        {/* Étape 1: Dates de séjour */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {/* Dates Section Améliorée */}
                                <div className="bg-white rounded-2xl p-8 border-2 border-amber-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                    <div className="flex items-center mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 mb-1">Dates de séjour</h2>
                                            <p className="text-slate-600 font-semibold">Choisissez vos dates d'arrivée et de départ</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Date d'arrivée */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                </svg>
                                                Date d'arrivée <span className="text-red-600 ml-1">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={checkInDate}
                                                onChange={(e) => setCheckInDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-amber-50 border-2 border-amber-300 rounded-xl focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 shadow-sm hover:border-amber-500 hover:shadow-lg group-hover:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Date de départ */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Date de départ <span className="text-red-600 ml-1">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={checkOutDate}
                                                onChange={(e) => setCheckOutDate(e.target.value)}
                                                min={checkInDate || new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-amber-50 border-2 border-amber-300 rounded-xl focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 shadow-sm hover:border-amber-500 hover:shadow-lg group-hover:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Nombre de nuits */}
                                        <div>
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                </svg>
                                                Durée du séjour
                                            </label>
                                            <div className="w-full px-4 py-4 border-3 border-amber-500 rounded-xl bg-gradient-to-br from-amber-100 via-orange-100 to-amber-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
                                                <div className="text-center">
                                                    <div className="text-5xl font-black text-amber-700 mb-1">{numberOfNights}</div>
                                                    <div className="text-xs font-bold text-amber-600 lowercase first-letter:uppercase tracking-widest">
                                                        {numberOfNights === 1 ? 'Nuit' : 'Nuits'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Heure d'arrivée */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Heure d'arrivée
                                            </label>
                                            <input
                                                type="time"
                                                value={arrivalTime}
                                                onChange={(e) => setArrivalTime(e.target.value)}
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-amber-50 border-2 border-amber-300 rounded-xl focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 shadow-sm hover:border-amber-500 hover:shadow-lg group-hover:bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Info supplémentaire */}
                                    <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-bold text-blue-900 mb-1">Informations importantes</p>
                                                <p className="text-sm text-blue-800">Check-in à partir de 14h00 • Check-out avant 11h00</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Étape 2: Informations des invités */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* Nombre de personnes */}
                                <div className="bg-white rounded-2xl p-8 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                    <div className="flex items-center mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 mb-1">Nombre de voyageurs</h2>
                                            <p className="text-slate-600 font-semibold">Combien de personnes voyagent avec vous ?</p>
                                        </div>
                                    </div>

                                    <div className="max-w-md">
                                        <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            Nombre total (vous inclus) <span className="text-red-600 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={numberOfGuests}
                                                onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                                                className="w-full px-5 py-4 text-lg font-bold text-slate-900 bg-blue-50 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:border-blue-500 hover:shadow-lg hover:bg-white"
                                                required
                                            >
                                                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 1 ? 'personne' : 'personnes'}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Client Principal */}
                                <div className="bg-white rounded-2xl p-8 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                    <div className="flex items-center mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 mb-1">Vos informations</h2>
                                            <p className="text-slate-600 font-semibold">Coordonnées du client principal</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Prénom */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Prénom <span className="text-red-600 ml-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={mainClient.firstName}
                                                onChange={(e) => setMainClient({ ...mainClient, firstName: e.target.value })}
                                                placeholder="Votre prénom"
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-purple-50 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-500 hover:shadow-lg placeholder:text-slate-400 placeholder:font-normal group-hover:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Nom */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Nom <span className="text-red-600 ml-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={mainClient.lastName}
                                                onChange={(e) => setMainClient({ ...mainClient, lastName: e.target.value })}
                                                placeholder="Votre nom"
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-purple-50 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-500 hover:shadow-lg placeholder:text-slate-400 placeholder:font-normal group-hover:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Email <span className="text-red-600 ml-1">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={mainClient.email}
                                                onChange={(e) => setMainClient({ ...mainClient, email: e.target.value })}
                                                placeholder="exemple@email.com"
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-purple-50 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-500 hover:shadow-lg placeholder:text-slate-400 placeholder:font-normal group-hover:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Téléphone */}
                                        <div className="group">
                                            <label className="flex items-center text-sm font-bold text-slate-800 mb-3 lowercase first-letter:uppercase tracking-wide">
                                                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Téléphone <span className="text-red-600 ml-1">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={mainClient.phone}
                                                onChange={(e) => setMainClient({ ...mainClient, phone: e.target.value })}
                                                placeholder="+257 00 00 00 00"
                                                className="w-full px-4 py-4 text-base font-bold text-slate-900 bg-purple-50 border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-500 hover:shadow-lg placeholder:text-slate-400 placeholder:font-normal group-hover:bg-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Demandes spéciales */}
                                <div className="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                    <div className="flex items-center mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 mb-1">Demandes spéciales</h2>
                                            <p className="text-slate-600 font-semibold">Faites-nous part de vos besoins</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center text-sm font-bold text-slate-800 lowercase first-letter:uppercase tracking-wide">
                                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Avez-vous des demandes particulières ?
                                        </label>
                                        <textarea
                                            value={specialRequests}
                                            onChange={(e) => setSpecialRequests(e.target.value)}
                                            rows={6}
                                            className="w-full px-4 py-4 text-base font-medium text-slate-900 bg-green-50 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200 resize-none shadow-sm hover:border-green-500 hover:shadow-lg placeholder:text-slate-400 hover:bg-white"
                                            placeholder="Exemples : Régime alimentaire spécial, besoins d'accessibilité, préférences de chambre (étage élevé, vue mer), célébration spéciale (anniversaire, lune de miel), etc."
                                        />
                                        <div className="flex items-start text-sm text-blue-700 bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                                            <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-semibold">Nous ferons de notre mieux pour répondre à vos demandes selon nos disponibilités.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Étape 3: Confirmation */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                    <div className="flex items-center mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
                                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 mb-1">Récapitulatif</h2>
                                            <p className="text-slate-600 font-semibold">Vérifiez les détails de votre réservation</p>
                                        </div>
                                    </div>

                                    {/* Détails du séjour */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Détails du séjour
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center mb-2">
                                                    <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                    </svg>
                                                    <p className="text-xs font-bold text-amber-700 lowercase first-letter:uppercase tracking-wider">Date d'arrivée</p>
                                                </div>
                                                <p className="text-2xl font-black text-slate-900">{checkInDate || 'Non défini'}</p>
                                                {arrivalTime && <p className="text-sm font-semibold text-slate-600 mt-1">à {arrivalTime}</p>}
                                            </div>
                                            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center mb-2">
                                                    <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <p className="text-xs font-bold text-amber-700 lowercase first-letter:uppercase tracking-wider">Date de départ</p>
                                                </div>
                                                <p className="text-2xl font-black text-slate-900">{checkOutDate || 'Non défini'}</p>
                                            </div>
                                            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center mb-2">
                                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                    </svg>
                                                    <p className="text-xs font-bold text-blue-700 lowercase first-letter:uppercase tracking-wider">Durée</p>
                                                </div>
                                                <p className="text-2xl font-black text-blue-700">{numberOfNights} {numberOfNights === 1 ? 'nuit' : 'nuits'}</p>
                                            </div>
                                            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center mb-2">
                                                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-xs font-bold text-purple-700 lowercase first-letter:uppercase tracking-wider">Voyageurs</p>
                                                </div>
                                                <p className="text-2xl font-black text-purple-700">{numberOfGuests} {numberOfGuests === 1 ? 'personne' : 'personnes'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations du client */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Informations du client
                                        </h3>
                                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-bold text-purple-700 lowercase first-letter:uppercase tracking-wider mb-1">Nom complet</p>
                                                    <p className="text-xl font-black text-slate-900">{mainClient.firstName} {mainClient.lastName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-purple-700 lowercase first-letter:uppercase tracking-wider mb-1">Email</p>
                                                    <p className="text-lg font-semibold text-slate-700">{mainClient.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-purple-700 lowercase first-letter:uppercase tracking-wider mb-1">Téléphone</p>
                                                    <p className="text-lg font-semibold text-slate-700">{mainClient.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demandes spéciales */}
                                    {specialRequests && (
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                                Demandes spéciales
                                            </h3>
                                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-shadow">
                                                <p className="text-base font-medium text-slate-700 whitespace-pre-wrap">{specialRequests}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Note importante */}
                                    <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg">
                                        <div className="flex items-start">
                                            <svg className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-black text-amber-900 mb-2">Avant de confirmer</p>
                                                <p className="text-sm text-amber-800 font-semibold">Veuillez vérifier attentivement toutes les informations. Un email de confirmation vous sera envoyé après validation.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons Améliorés */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-4">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="w-full sm:w-auto px-8 py-4 border-3 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-black text-lg flex items-center justify-center space-x-3 shadow-md hover:shadow-xl transform hover:scale-105"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Retour</span>
                                </button>
                            )}

                            <div className={`w-full sm:w-auto ${currentStep === 1 ? 'sm:ml-auto' : ''}`}>
                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 transition-all duration-300 shadow-xl hover:shadow-2xl font-black text-lg flex items-center justify-center space-x-3 transform hover:scale-105"
                                    >
                                        <span>Continuer</span>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl font-black text-lg flex items-center justify-center space-x-3 transform hover:scale-105 disabled:transform-none disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Traitement en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Confirmer ma réservation</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
