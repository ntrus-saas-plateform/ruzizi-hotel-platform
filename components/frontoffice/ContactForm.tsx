'use client';

import { useState, useEffect } from 'react';

interface ContactFormProps {
    title?: string;
    subtitle?: string;
    onSubmit?: (data: ContactFormData) => void;
}

interface ContactFormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    preferredContact: 'email' | 'phone';
}

export default function ContactForm({
    title = "Contactez-nous",
    subtitle = "Nous sommes là pour vous aider",
    onSubmit
}: ContactFormProps) {
    const [language, setLanguage] = useState('fr');
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        preferredContact: 'email'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') || 'fr';
        setLanguage(savedLanguage);
    }, []);

    const content = {
        fr: {
            title: "Contactez-nous",
            subtitle: "Nous sommes là pour vous aider",
            name: "Nom complet",
            email: "Adresse email",
            phone: "Numéro de téléphone",
            subject: "Sujet du message",
            message: "Votre message",
            preferredContact: "Moyen de contact préféré",
            contactEmail: "Email",
            contactPhone: "Téléphone",
            send: "Envoyer le message",
            sending: "Envoi en cours...",
            success: "Message envoyé avec succès !",
            error: "Une erreur est survenue. Veuillez réessayer.",
            required: "Ce champ est requis",
            invalidEmail: "Adresse email invalide",
            subjects: [
                "Réservation",
                "Information générale",
                "Service client",
                "Réclamation",
                "Partenariat",
                "Autre"
            ],
            placeholders: {
                name: "Votre nom complet",
                email: "votre@email.com",
                phone: "+257 XX XX XX XX",
                subject: "Sélectionnez un sujet",
                message: "Décrivez votre demande en détail..."
            }
        },
        en: {
            title: "Contact Us",
            subtitle: "We're here to help you",
            name: "Full name",
            email: "Email address",
            phone: "Phone number",
            subject: "Subject",
            message: "Your message",
            preferredContact: "Preferred contact method",
            contactEmail: "Email",
            contactPhone: "Phone",
            send: "Send message",
            sending: "Sending...",
            success: "Message sent successfully!",
            error: "An error occurred. Please try again.",
            required: "This field is required",
            invalidEmail: "Invalid email address",
            subjects: [
                "Booking",
                "General information",
                "Customer service",
                "Complaint",
                "Partnership",
                "Other"
            ],
            placeholders: {
                name: "Your full name",
                email: "your@email.com",
                phone: "+257 XX XX XX XX",
                subject: "Select a subject",
                message: "Describe your request in detail..."
            }
        }
    };

    const t = content[language as keyof typeof content];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError(t.required);
            return false;
        }
        if (!formData.email.trim()) {
            setError(t.required);
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError(t.invalidEmail);
            return false;
        }
        if (!formData.subject) {
            setError(t.required);
            return false;
        }
        if (!formData.message.trim()) {
            setError(t.required);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            // Simulate API call
            await Promise.resolve();

            if (onSubmit) {
                onSubmit(formData);
            }

            setSuccess(true);
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                preferredContact: 'email'
            });

            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-amber-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
                        {title}
                    </h2>
                    <p className="text-xl text-gray-600">
                        {subtitle}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12">
                    {/* Success Message */}
                    {success && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-green-700 font-medium">{t.success}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
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

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t.name} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t.placeholders.name}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t.email} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder={t.placeholders.email}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t.phone}
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder={t.placeholders.phone}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t.preferredContact}
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="preferredContact"
                                            value="email"
                                            checked={formData.preferredContact === 'email'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{t.contactEmail}</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="preferredContact"
                                            value="phone"
                                            checked={formData.preferredContact === 'phone'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{t.contactPhone}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                {t.subject} *
                            </label>
                            <div className="relative">
                                <select
                                  name="subject"
                                  value={formData.subject}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                                >
                                  <option value="">Sélectionnez un sujet</option>
                                    {t.subjects.map((subject, index) => (
                                        <option key={index} value={subject}>
                                            {subject}
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

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                {t.message} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows={6}
                                placeholder={t.placeholders.message}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-3 transform hover:scale-105 disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>{t.sending}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span>{t.send}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}