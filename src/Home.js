import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 mb-2">
            iBreedr
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-stone-600">
            Your trusted livestock marketplace
          </p>
        </motion.div>

        {/* Buying / Selling Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Buying */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/Browse">
              <div className="bg-white hover:bg-stone-50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-amber-400 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-green-100 group-hover:bg-green-200 rounded-full p-3 sm:p-4 transition-colors">
                    <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-stone-800 mb-1">
                      I'm Buying
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-stone-600">
                      Browse livestock for sale
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Selling */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/SellerUpload">
              <div className="bg-white hover:bg-stone-50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-amber-400 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-amber-100 group-hover:bg-amber-200 rounded-full p-3 sm:p-4 transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-stone-800 mb-1">
                      I'm Selling
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-stone-600">
                      List your livestock for sale
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs sm:text-sm md:text-base text-stone-500"
        >
          <p>Secure payments • Verified sellers • Trusted platform</p>
        </motion.div>
      </div>
    </div>
  );
}