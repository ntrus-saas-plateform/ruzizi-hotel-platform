'use client';

import { Building2, MapPin, Plane, ShoppingCart, Waves } from 'lucide-react';
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
  title = 'Contactez-nous',
  subtitle = 'Nous sommes là pour vous aider',
  onSubmit,
}: ContactFormProps) {
  const [language, setLanguage] = useState('fr');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'email',
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
      title: 'Contactez-nous',
      subtitle: 'Nous sommes là pour vous aider',
      name: 'Nom complet',
      email: 'Adresse email',
      phone: 'Numéro de téléphone',
      subject: 'Sujet du message',
      message: 'Votre message',
      preferredContact: 'Moyen de contact préféré',
      contactEmail: 'Email',
      contactPhone: 'Téléphone',
      send: 'Envoyer le message',
      sending: 'Envoi en cours...',
      success: 'Message envoyé avec succès !',
      error: 'Une erreur est survenue. Veuillez réessayer.',
      required: 'Ce champ est requis',
      invalidEmail: 'Adresse email invalide',
      directions: "Obtenir l'itinéraire",
      nearby: 'À proximité',
      nearbyPlaces: [
        { name: 'Aéroport de Bujumbura', distance: '12 km', icon: Plane },
        { name: 'Centre-ville', distance: '2 km', icon: Building2 },
        { name: 'Lac Tanganyika', distance: '5 km', icon: Waves },
        { name: 'Marché central', distance: '3 km', icon: ShoppingCart },
      ],
      subjects: [
        'Réservation',
        'Information générale',
        'Service client',
        'Réclamation',
        'Partenariat',
        'Autre',
      ],
      placeholders: {
        name: 'Votre nom complet',
        email: 'votre@email.com',
        phone: '+257 XX XX XX XX',
        subject: 'Sélectionnez un sujet',
        message: 'Décrivez votre demande en détail...',
      },
    },
    en: {
      title: 'Contact Us',
      subtitle: "We're here to help you",
      name: 'Full name',
      email: 'Email address',
      phone: 'Phone number',
      subject: 'Subject',
      message: 'Your message',
      preferredContact: 'Preferred contact method',
      contactEmail: 'Email',
      contactPhone: 'Phone',
      send: 'Send message',
      sending: 'Sending...',
      success: 'Message sent successfully!',
      error: 'An error occurred. Please try again.',
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      directions: 'Get Directions',
      nearby: 'Nearby',
      nearbyPlaces: [
        { name: 'Bujumbura Airport', distance: '12 km', icon: Plane },
        { name: 'City Center', distance: '2 km', icon: Building2 },
        { name: 'Lake Tanganyika', distance: '5 km', icon: Waves },
        { name: 'Central Market', distance: '3 km', icon: ShoppingCart },
      ],
      subjects: [
        'Booking',
        'General information',
        'Customer service',
        'Complaint',
        'Partnership',
        'Other',
      ],
      placeholders: {
        name: 'Your full name',
        email: 'your@email.com',
        phone: '+257 XX XX XX XX',
        subject: 'Select a subject',
        message: 'Describe your request in detail...',
      },
    },
  };

  const t = content[language as keyof typeof content];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        preferredContact: 'email',
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };
  const coordinates = { lat: -3.3614, lng: 29.3599 };
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-20 bg-[hsl(var(--color-luxury-gold-light))]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
              {title}
            </h2>
            <p className="text-lg text-luxury-text">{subtitle}</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-card-luxury overflow-hidden border border-gray-100">
              {/* Interactive Map Placeholder */}
              <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100">
                {/* Map Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-8 grid-rows-6 h-full">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border border-gray-300"></div>
                    ))}
                  </div>
                </div>

                {/* Hotel Marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-luxury text-luxury-cream rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md border">
                      <p className="text-sm font-semibold text-luxury-dark whitespace-nowrap">
                        Ruzizi Hôtel
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Elements */}
                <div className="absolute top-4 right-4 space-y-2">
                  <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition">
                    <svg
                      className="w-5 h-5 text-luxury-text"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition">
                    <svg
                      className="w-5 h-5 text-luxury-text"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                </div>

                {/* Click to open full map */}
                <button
                  onClick={openGoogleMaps}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 hover:bg-black/10 transition-all duration-300 group"
                >
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                    <p className="text-gray-800 font-medium flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Ouvrir dans Google Maps
                    </p>
                  </div>
                </button>
              </div>
            </div>
            {/* Nearby Places */}
            <div className="bg-white rounded-2xl shadow-card-luxury p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-luxury-dark mb-2">{t.nearby}</h3>
              <div className="space-y-2">
                {t.nearbyPlaces.map((place, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-luxury-cream rounded-lg"
                  >
                    <div className="flex items-center">
                      <place.icon className="text-xl mr-3 text-luxury-gold-light" />
                      <span className="font-medium text-luxury-dark">{place.name}</span>
                    </div>
                    <span className="text-sm text-luxury-text font-medium">{place.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Form */}
          <div className="lg:col-span-3 bg-white backdrop-blur-sm rounded-4xl shadow-luxury  border border-white/20 p-8 lg:p-12">
            {/* Success Message */}
            {success && (
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-green-500 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-green-700 font-medium">{t.success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-red-500 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t.phone}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t.placeholders.phone}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm"
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
                <label className="block text-sm font-semibold text-gray-700">{t.subject} *</label>
                <div className="relative">
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm appearance-none"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    {t.subjects.map((subject, index) => (
                      <option key={index} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-luxury text-luxury-cream rounded-2xl disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-luxury font-semibold flex items-center space-x-3 transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>{t.sending}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.send}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
