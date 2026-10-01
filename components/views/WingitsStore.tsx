'use client';

import { useStore } from '@/lib/contexts/StoreContext';
import { Sparkles, Coins, Zap, Shield, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { addWingitsAction, getWingitsTransactionsAction } from '@/app/actions/wingits';

const WINGIT_PACKAGES = [
  { id: 'pkg_1', amount: 100, price: 100, popular: false },
  { id: 'pkg_2', amount: 500, price: 500, popular: true },
  { id: 'pkg_3', amount: 1000, price: 1000, popular: false },
  { id: 'pkg_4', amount: 2000, price: 2000, popular: false },
];

export default function WingitsStore() {
  const { currentUser } = useStore();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    getWingitsTransactionsAction().then(txs => {
      setTransactions(txs || []);
    });
  }, []);

  const handlePurchase = async (pkg: typeof WINGIT_PACKAGES[0]) => {
    setLoadingPkg(pkg.id);
    // Simulate Dialog Pay integration delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, this would redirect to Dialog Ideamart Sandbox
    // and the callback would trigger addWingitsAction.
    // For now, we simulate a successful sandbox payment.
    const paymentRef = `DLG-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const result = await addWingitsAction(pkg.amount, `Bought ${pkg.amount} Wingits via Dialog`, paymentRef);
    
    setLoadingPkg(null);

    if (result.ok) {
      toast.success(`Successfully added ${pkg.amount} Wingits!`);
      // Page reload to reflect db changes since we don't optimistically add wingits here yet
      window.location.reload();
    } else {
      toast.error(result.error || 'Payment failed');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Coins className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Get More Wingits</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Wingits are your currency for premium features. Stand out with Secret Wingles, unlock more matches, and boost your profile.
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-6 mb-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Your current balance</p>
            <p className="text-3xl font-bold">{currentUser?.wingitsBalance || 0} <span className="text-lg text-muted-foreground font-normal">Wingits</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {WINGIT_PACKAGES.map((pkg) => (
          <div 
            key={pkg.id} 
            className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-md ${pkg.popular ? 'border-primary bg-primary/5' : 'bg-card border-border hover:border-primary/50'}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Most Popular
              </div>
            )}
            
            <div className="text-center mb-6 mt-2">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-3xl font-bold">{pkg.amount}</span>
              </div>
              <p className="text-muted-foreground">Wingits</p>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-2xl font-bold">Rs. {pkg.price}</p>
            </div>
            
            <button
              onClick={() => handlePurchase(pkg)}
              disabled={loadingPkg === pkg.id}
              className={`w-full mt-auto py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${pkg.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {loadingPkg === pkg.id ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Buy Now <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Instant Unlock</h3>
            <p className="text-sm text-muted-foreground">Wingits are added to your balance immediately after payment.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Secure Payments</h3>
            <p className="text-sm text-muted-foreground">Powered safely by Dialog Ideamart. Your transactions are 100% secure.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Never Expire</h3>
            <p className="text-sm text-muted-foreground">Your Wingits stay in your account forever until you decide to spend them.</p>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Usage History</h2>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
