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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 mb-4">
                        Réservation Complète
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                        Finalisez votre réservation en quelques étapes simples
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-amber-600 uppercase tracking-wide">
                                Étape {currentStep} sur {totalSteps}
                            </span>
                            <span className="text-sm font-semibold text-slate-700">{stepTitles[currentStep - 1]}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            ></div>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex justify-between mt-6">
                            {stepTitles.map((title, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${index + 1 <= currentStep
                                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg scale-110'
                                            : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <span className={`mt-2 text-xs font-semibold transition-all duration-300 ${index + 1 <= currentStep ? 'text-amber-600' : 'text-slate-500'
                                        }`}>
                                        {title}
                                    </span>
                                </div>
                            ))}
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
                            <div className="space-y-8">
                                {/* Dates Section */}
                                <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-8 border-2 border-amber-200/50 shadow-lg">
                                    <div className="flex items-center mb-8 pb-6 border-b-2 border-amber-200">
                                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 mb-1">Dates de séjour</h2>
                                            <p className="text-slate-600 font-medium">Sélectionnez vos dates d'arrivée et de départ</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Date d'arrivée */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Date d'arrivée <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={checkInDate}
                                                onChange={(e) => setCheckInDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 shadow-sm hover:border-amber-400 hover:shadow-md"
                                                required
                                            />
                                        </div>

                                        {/* Date de départ */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Date de départ <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={checkOutDate}
                                                onChange={(e) => setCheckOutDate(e.target.value)}
                                                min={checkInDate || new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 shadow-sm hover:border-amber-400 hover:shadow-md"
                                                required
                                            />
                                        </div>

                                        {/* Nombre de nuits */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Nombre de nuits
                                            </label>
                                            <div className="w-full px-4 py-3.5 border-3 border-amber-400 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-md">
                                                <div className="text-center">
                                                    <div className="text-4xl font-black text-amber-700">{numberOfNights}</div>
                                                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-1">
                                                        {numberOfNights === 1 ? 'Nuit' : 'Nuits'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Heure d'arrivée */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Heure d'arrivée
                                            </label>
                                            <input
                                                type="time"
                                                value={arrivalTime}
                                                onChange={(e) => setArrivalTime(e.target.value)}
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 shadow-sm hover:border-amber-400 hover:shadow-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Étape 2: Informations des invités */}
                        {currentStep === 2 && (
                            <div className="space-y-8">
                                {/* Nombre de personnes */}
                                <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-8 border-2 border-blue-200/50 shadow-lg">
                                    <div className="flex items-center mb-8 pb-6 border-b-2 border-blue-200">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 mb-1">Nombre de personnes</h2>
                                            <p className="text-slate-600 font-medium">Indiquez le nombre total de voyageurs</p>
                                        </div>
                                    </div>

                                    <div className="max-w-md">
                                        <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                            Nombre total de personnes (incluant vous) <span className="text-red-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={numberOfGuests}
                                                onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:border-blue-400 hover:shadow-md"
                                                required
                                            >
                                                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 1 ? 'personne' : 'personnes'}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Client Principal */}
                                <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-8 border-2 border-purple-200/50 shadow-lg">
                                    <div className="flex items-center mb-8 pb-6 border-b-2 border-purple-200">
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 mb-1">Informations personnelles</h2>
                                            <p className="text-slate-600 font-medium">Vos coordonnées principales</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Prénom */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Prénom <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={mainClient.firstName}
                                                onChange={(e) => setMainClient({ ...mainClient, firstName: e.target.value })}
                                                placeholder="Votre prénom"
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-400 hover:shadow-md placeholder:text-slate-400 placeholder:font-normal"
                                                required
                                            />
                                        </div>

                                        {/* Nom */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Nom <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={mainClient.lastName}
                                                onChange={(e) => setMainClient({ ...mainClient, lastName: e.target.value })}
                                                placeholder="Votre nom"
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-400 hover:shadow-md placeholder:text-slate-400 placeholder:font-normal"
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Email <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={mainClient.email}
                                                onChange={(e) => setMainClient({ ...mainClient, email: e.target.value })}
                                                placeholder="exemple@email.com"
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-400 hover:shadow-md placeholder:text-slate-400 placeholder:font-normal"
                                                required
                                            />
                                        </div>

                                        {/* Téléphone */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                                                Téléphone <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={mainClient.phone}
                                                onChange={(e) => setMainClient({ ...mainClient, phone: e.target.value })}
                                                placeholder="+257 00 00 00 00"
                                                className="w-full px-4 py-3.5 text-base font-semibold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm hover:border-purple-400 hover:shadow-md placeholder:text-slate-400 placeholder:font-normal"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Demandes spéciales */}
                                <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-8 border-2 border-green-200/50 shadow-lg">
                                    <div className="flex items-center mb-8 pb-6 border-b-2 border-green-200">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 mb-1">Demandes spéciales</h2>
                                            <p className="text-slate-600 font-medium">Partagez vos besoins particuliers</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">
                                            Avez-vous des demandes particulières pour votre séjour ?
                                        </label>
                                        <textarea
                                            value={specialRequests}
                                            onChange={(e) => setSpecialRequests(e.target.value)}
                                            rows={5}
                                            className="w-full px-4 py-3.5 text-base font-medium text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 resize-none shadow-sm hover:border-green-400 hover:shadow-md placeholder:text-slate-400"
                                            placeholder="Exemples : Régime alimentaire spécial, besoins d'accessibilité, préférences de chambre (étage élevé, vue mer), célébration spéciale (anniversaire, lune de miel), etc."
                                        />
                                        <div className="flex items-start text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-medium">Nous ferons de notre mieux pour répondre à vos demandes selon nos disponibilités.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Étape 3: Confirmation */}
                        {currentStep === 3 && (
                            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border-2 border-slate-200 shadow-lg">
                                <div className="flex items-center mb-8 pb-6 border-b-2 border-slate-200">
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 mb-1">Confirmation</h2>
                                        <p className="text-slate-600 font-medium">Vérifiez votre réservation avant de confirmer</p>
                                    </div>
                                </div>

                                <div className="space-y-6 text-slate-700">
                                    <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Date d'arrivée</p>
                                            <p className="text-lg font-bold text-slate-900">{checkInDate || 'Non défini'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Date de départ</p>
                                            <p className="text-lg font-bold text-slate-900">{checkOutDate || 'Non défini'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Nombre de nuits</p>
                                            <p className="text-lg font-bold text-amber-600">{numberOfNights}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Nombre de personnes</p>
                                            <p className="text-lg font-bold text-blue-600">{numberOfGuests}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-purple-50 rounded-xl">
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Client principal</p>
                                        <p className="text-xl font-bold text-slate-900">{mainClient.firstName} {mainClient.lastName}</p>
                                        <p className="text-slate-600 font-medium">{mainClient.email}</p>
                                        <p className="text-slate-600 font-medium">{mainClient.phone}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t-2 border-slate-200 space-y-4 sm:space-y-0">
                            <div className="flex space-x-4">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        className="px-6 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-bold flex items-center space-x-2 shadow-sm hover:shadow-md"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span>Précédent</span>
                                    </button>
                                )}
                            </div>

                            <div>
                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 transform hover:scale-105"
                                    >
                                        <span>Suivant</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3.5 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 transform hover:scale-105 disabled:transform-none"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Traitement...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Confirmer la réservation</span>
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