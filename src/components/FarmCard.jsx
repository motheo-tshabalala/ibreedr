import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Calendar, Package, Building2 } from 'lucide-react';
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/Badge";

export default function FarmCard({ farm }) {
  if (!farm) return null;

  const {
    id,
    farm_name,
    farm_location,
    farm_bio,
    verified_farmer,
    years_farming,
    listing_count,
    rating,
    cover_image,
    logo_image,
    phone,
    created_at
  } = farm;

  // Calculate profile strength (80%+ = Strong Profile)
  const profileFields = [
    farm_name,
    farm_location,
    farm_bio,
    phone,
    years_farming > 0,
    logo_image,
    cover_image
  ].filter(Boolean).length;

  const profileStrength = Math.round((profileFields / 7) * 100);
  const isStrongProfile = profileStrength >= 80;

  return (
    <Link to={`/farm/${id}`}>
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 group ${verified_farmer ? 'border-b-4 border-gold-accent rounded-b-xl' : ''
        }`}>
        {/* Cover Image */}
        <div className="relative h-32 bg-gray-200 overflow-hidden">
          {cover_image ? (
            <img
              src={cover_image}
              alt={farm_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-primary-green/10">
              <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <pattern id="farmPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="#1F4D3A" opacity="0.05" />
                  <path d="M20 10 L25 18 L20 26 L15 18 Z" fill="#1F4D3A" opacity="0.1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#farmPattern)" />
              </svg>
            </div>
          )}

          {/* Verification Badge */}
          {verified_farmer && (
            <div className="absolute top-3 right-3 bg-primary-green text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Logo */}
            <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white -mt-6 shadow-md flex-shrink-0 overflow-hidden">
              {logo_image ? (
                <img src={logo_image} alt={farm_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl bg-primary-green/10 text-primary-green">
                  {farm_name?.charAt(0) || 'F'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{farm_name || 'Unnamed Farm'}</h3>
                {/* ✅ Strong Profile Badge */}
                {isStrongProfile && (
                  <span className="text-[10px] bg-gold-accent/20 text-gold-accent px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    ★ Strong Profile
                  </span>
                )}
              </div>

              {farm_location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{farm_location}</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium text-gold-accent">
                <Star className="w-4 h-4 fill-gold-accent" />
                {rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-col items-center text-center">
              <Package className="w-4 h-4 text-primary-green" />
              <span className="text-sm font-semibold text-gray-900">{listing_count || 0}</span>
              <span className="text-[10px] text-gray-400">Listings</span>
            </div>
            {years_farming > 0 && (
              <div className="flex flex-col items-center text-center">
                <Calendar className="w-4 h-4 text-primary-green" />
                <span className="text-sm font-semibold text-gray-900">{years_farming}</span>
                <span className="text-[10px] text-gray-400">Years</span>
              </div>
            )}
          </div>

          {/* Bio Preview */}
          {farm_bio && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{farm_bio}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}