import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, Clock, AlertTriangle, Truck } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";

export default function TransactionStatus() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);

      const { data } = await supabase.from('transactions').select('*').eq('id', id).single();
      setTransaction(data);
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  const confirmReceipt = async () => {
    if (!window.confirm('Confirm that you have received the animal? This will release funds to the seller.')) return;
    const { error } = await supabase.from('transactions')
      .update({ status: 'released', buyer_confirmed_at: new Date(), updated_at: new Date() })
      .eq('id', id);
    if (error) alert('Error: ' + error.message);
    else { setTransaction(prev => ({ ...prev, status: 'released', buyer_confirmed_at: new Date() })); alert('Receipt confirmed! Funds will be released to the seller.'); }
  };

  const reportIssue = async () => {
    const reason = prompt('Describe the issue:');
    if (!reason) return;
    const { error } = await supabase.from('transactions')
      .update({ status: 'disputed', dispute_details: reason, disputed_at: new Date(), updated_at: new Date() })
      .eq('id', id);
    if (error) alert('Error: ' + error.message);
    else { setTransaction(prev => ({ ...prev, status: 'disputed', dispute_details: reason })); alert('Issue reported. iBreedr will contact both parties.'); }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" /></div>;
  }

  if (!transaction) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h2 className="text-lg font-semibold mb-2">Transaction not found</h2><Link to="/Browse"><Button>Back to Browse</Button></Link></div></div>;
  }

  const isBuyer = user?.id === transaction.buyer_id;
  const statusSteps = [
    { key: 'pending_payment', label: 'Payment pending', done: false },
    { key: 'paid', label: 'Payment confirmed', done: transaction.status !== 'pending_payment' },
    { key: 'confirmed', label: 'Receipt confirmed', done: ['confirmed', 'released', 'completed'].includes(transaction.status) },
    { key: 'released', label: 'Funds released', done: ['released', 'completed'].includes(transaction.status) },
  ];

  if (transaction.status === 'disputed') {
    statusSteps.splice(2, 0, { key: 'disputed', label: 'Disputed — under review', done: false });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-xl font-bold">Transaction</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Summary */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">iBreedr Escrow</span>
            </div>
            <h2 className="text-xl font-bold">R {Number(transaction.amount).toLocaleString()}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isBuyer ? 'You are buying' : 'You are selling'} livestock
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Truck className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground capitalize">
                Transport: {transaction.transport_responsibility === 'seller' ? 'Seller delivers' : 'Buyer arranges'}
              </span>
            </div>
            <Badge className={`mt-3 ${transaction.status === 'released' || transaction.status === 'completed' ? 'bg-green-100 text-green-700' : transaction.status === 'disputed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {transaction.status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        {/* Status Tracker */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Status</h3>
            <div className="space-y-3">
              {statusSteps.map((step, idx) => (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : step.key === 'disputed' ? 'bg-red-500' : 'bg-muted'}`}>
                    {step.done ? <CheckCircle className="w-4 h-4 text-white" /> : step.key === 'disputed' ? <AlertTriangle className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <span className={`text-sm ${step.done ? 'font-medium' : 'text-muted-foreground'}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {isBuyer && transaction.status === 'paid' && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <Button onClick={confirmReceipt} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4" /> I have received the animal
              </Button>
              <Button onClick={reportIssue} variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50">
                <AlertTriangle className="w-4 h-4" /> Report an issue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Breakdown */}
        {isBuyer ? (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Payment Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Amount paid</span><span className="font-medium">R {Number(transaction.amount).toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Status</span><span className="font-medium">Seller receives R {Number(transaction.seller_amount).toLocaleString()} after confirmation</span></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Payment Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sale price</span><span className="font-medium">R {Number(transaction.amount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">iBreedr fee ({transaction.commission_percent}%)</span><span className="font-medium text-red-600">- R {Number(transaction.commission_amount).toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-medium">You receive</span><span className="font-bold text-green-600">R {Number(transaction.seller_amount).toLocaleString()}</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}