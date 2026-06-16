import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bookmark } from 'lucide-react';
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
    if (livestock.weight_min && livestock.weight_max) {
      return `${livestock.weight_min} - ${livestock.weight_max} kg`;
    } else if (livestock.weight_min) {
      return `${livestock.weight_min} kg`;
    } else if (livestock.weight_max) {
      return `Up to ${livestock.weight_max} kg`;
    }
    return null;
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) onWishlist(livestock);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <Link to={`/BreedDetails?id=${livestock.id}`}>
        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {livestock.images && livestock.images[0] ? (
            <img
              src={livestock.images[0]}
              alt={livestock.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
              🐄
            </div>
          )}

          {/* Wishlist Button - Only */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:scale-105 transition"
          >
            <Bookmark className={`w-4 h-4 ${isInWishlist ? 'fill-primary-green text-primary-green' : 'text-gray-500'}`} />
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            {livestock.pure_cross === 'pure' && (
              <Badge className="bg-primary-green text-white">Pure Breed</Badge>
            )}
            {livestock.pregnancy_status === 'pregnant' && (
              <Badge className="bg-pink-500 text-white">🤰 Pregnant</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">{livestock.name}</h3>
              <p className="text-sm text-gray-600">{livestock.breed_type}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin className="w-3 h-3" />
                {livestock.location?.split(',')[0] || 'Location not set'}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-green">R {Number(livestock.price).toLocaleString()}</p>
              <p className="text-xs text-gray-400 capitalize">{livestock.animal_type}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {getAgeDisplay() && (
              <Badge variant="outline" className="text-xs">{getAgeDisplay()}</Badge>
            )}
            {getWeightDisplay() && (
              <Badge variant="outline" className="text-xs">{getWeightDisplay()}</Badge>
            )}
            {livestock.pure_cross === 'cross' && (
              <Badge variant="outline" className="text-xs">Cross</Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}