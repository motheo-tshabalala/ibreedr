import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bookmark, Building2 } from 'lucide-react';
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/Badge";

export default function LivestockCard({ livestock, onWishlist, isInWishlist }) {
  if (!livestock) return null;

  const getAgeDisplay = () => {
    if (livestock.teeth_age) return livestock.teeth_age;
    const years = livestock.age_years || 0;
    const months = livestock.age_months || 0;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
    return null;
  };

  const getWeightDisplay = () => {
    if (livestock.weight_min && livestock.weight_max) return `${livestock.weight_min} - ${livestock.weight_max} kg`;
    if (livestock.weight_min) return `${livestock.weight_min} kg`;
    if (livestock.weight_max) return `Up to ${livestock.weight_max} kg`;
    return null;
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) onWishlist(livestock);
  };

  const farmName = livestock.profiles?.farm_name || livestock.farm_name || 'Farm';
  const isVerified = livestock.profiles?.verified_farmer || false;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <Link to={`/BreedDetails?id=${livestock.id}`}>
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          {livestock.images && livestock.images[0] ? (
            <img
              src={livestock.images[0]}
              alt={livestock.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-green/10 to-primary-green/5">
              <svg className="w-16 h-16 text-primary-green/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-white text-primary-green font-bold text-sm px-3 py-1 rounded-full shadow">
            R {Number(livestock.price).toLocaleString()}
          </div>

          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:scale-105 transition"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Bookmark className={`w-4 h-4 ${isInWishlist ? 'fill-primary-green text-primary-green' : 'text-gray-500'}`} />
          </button>

          <div className="absolute bottom-3 right-3 flex gap-2">
            {livestock.pure_cross === 'pure' && (
              <Badge className="bg-primary-green text-white text-xs">Pure</Badge>
            )}
            {livestock.pregnancy_status === 'pregnant' && (
              <Badge className="bg-pink-500 text-white text-xs">Pregnant</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 className="w-3.5 h-3.5 text-primary-green" />
            <span className="font-medium text-gray-700">{farmName}</span>
            {isVerified && <span className="text-primary-green text-[10px]">✓ Verified</span>}
          </div>

          <h3 className="text-[15px] font-medium text-gray-900">
            {livestock.name || livestock.breed_type}
          </h3>

          <p className="text-xs text-gray-400 capitalize">{livestock.animal_type}</p>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />
            <span>{livestock.location?.split(',')[0] || 'Location not set'}</span>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {getAgeDisplay() && <Badge variant="outline" className="text-xs">{getAgeDisplay()}</Badge>}
            {getWeightDisplay() && <Badge variant="outline" className="text-xs">{getWeightDisplay()}</Badge>}
            {livestock.pure_cross === 'cross' && <Badge variant="outline" className="text-xs">Cross</Badge>}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}