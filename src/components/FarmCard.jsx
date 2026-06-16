import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Users, CheckCircle, Calendar, Package, Building2 } from 'lucide-react';
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/Badge";
import VerificationBadge from './VerificationBadge';

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
    logo_image
  } = farm;

  return (
    <Link to={`/farm/${id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
        {/* Cover Image */}
        <div className="relative h-32 bg-gray-200 overflow-hidden">
          {cover_image ? (
            <img
              src={cover_image}
              alt={farm_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-green/20 to-primary-green/10 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary-green/30" />
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
              <h3 className="font-semibold text-gray-900 truncate">{farm_name || 'Unnamed Farm'}</h3>

              {/* Location */}
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

          {/* Farm Stats - Enhanced */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
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
            <div className="flex flex-col items-center text-center">
              <Users className="w-4 h-4 text-primary-green" />
              <span className="text-sm font-semibold text-gray-900">—</span>
              <span className="text-[10px] text-gray-400">Followers</span>
            </div>
          </div>

          {/* Bio Preview */}
          {farm_bio && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{farm_bio}</p>
          )}

          {/* View Button */}
          <div className="mt-3">
            <span className="text-sm text-primary-green font-medium hover:underline">
              View Farm →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}