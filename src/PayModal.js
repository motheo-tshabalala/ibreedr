import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, Shield, Wallet } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Button } from "./components/ui/button";

const COMMISSION_PERCENT = 5;

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', sublabel: 'Visa • Mastercard', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'samsung_pay', label: 'Samsung Pay', sublabel: 'Tap to pay', icon: <Smartphone className="w-5 h-5" /> },
  { id: 'google_pay', label: 'Google Pay', sublabel: 'Tap to pay', icon: <Wallet className="w-5 h-5" /> },
  { id: 'apple_pay', label: 'Apple Pay', sublabel: 'Tap to pay', icon: <Wallet className="w-5 h-5" /> },
  { id: 'eft', label: 'Instant EFT', sublabel: 'FNB • Standard Bank • ABSA • Nedbank • Capitec', icon: <Building2 className="w-5 h-5" /> },
];

export default function PayModal({ listing, type, user, onClose }) {
  const [step, setStep] = useState('select');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = parseFloat(listing.price || listing.bundle_price || 0);
  const commission = Math.round(amount * COMMISSION_PERCENT / 100 * 100) / 100;
  const sellerAmount = amount - commission;
  const title = listing.farm_name || listing.bundle_name || listing.breed_type || 'Livestock';

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    const { data, error } = await supabase.from('transactions').insert([{
      livestock_id: type === 'individual' ? listing.id : null,
      bundle_id: type === 'bundle' ? listing.id : null,
      buyer_id: user.id,
      seller_id: listing.user_id,
      amount: amount,
      commission_percent: COMMISSION_PERCENT,
      commission_amount: commission,
      seller_amount: sellerAmount,
      transport_responsibility: listing.transport_responsibility || 'buyer',
      status: 'pending_payment',
      payment_method: selectedMethod
    }]).select().single();

    if (error) {
      alert('Failed to create transaction: ' + error.message);
      setIsProcessing(false);
      return;
    }

    setStep('success');
    setIsProcessing(false);

    // TODO: When payment gateway is ready, redirect to PayFast/Ozow here
    // Instead of going straight to success, redirect to payment URL
    // Then handle callback/webhook to update transaction status
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            {step === 'select' ? 'Checkout' : 'Transaction Started'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        {step === 'select' ? (
          <div className="p-5 space-y-4">
            {/* Listing Summary */}
            <div className="p-4 bg-muted rounded-xl">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{listing.breed_type || listing.animal_type}</p>
              <p className="text-2xl font-bold text-primary mt-2">R {amount.toLocaleString()}</p>
            </div>

            {/* Payment Methods */}
            <div>
              <p className="text-sm font-medium mb-2">Select payment method</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${selectedMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                  >
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground">
                      {method.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.sublabel}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Escrow Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">Protected by iBreedr Escrow</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your payment is held safely until you confirm receipt of the animal. The seller receives funds only after your confirmation.
                </p>
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedMethod || isProcessing}
              className="w-full gap-2"
            >
              {isProcessing ? 'Processing...' : `Confirm & Pay R ${amount.toLocaleString()}`}
            </Button>
          </div>
        ) : (
          <div className="p-5 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold">Transaction Initiated</h3>
            <p className="text-sm text-muted-foreground">
              Your payment of <strong>R {amount.toLocaleString()}</strong> for <strong>{title}</strong> is being processed.
            </p>
            <div className="p-4 bg-muted rounded-xl text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">R {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transport</span>
                <span className="font-medium capitalize">{listing.transport_responsibility === 'seller' ? "Seller delivers" : "Buyer arranges"}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-amber-600">Awaiting payment confirmation</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Track this transaction anytime in your profile.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}