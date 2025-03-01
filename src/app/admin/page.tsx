'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  // Simple admin check - in a real app, you'd want to check against a list of admin addresses
  const isAdmin = isConnected && address;
  
  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router]);
  
  if (!isAdmin) {
    return <div className="p-8">Checking authentication...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard 
          title="Purchase History" 
          description="View all product purchases and referrals"
          href="/admin/purchases"
          icon="📊"
        />
        
        {/* Add more admin cards here as needed */}
      </div>
    </div>
  );
}

function AdminCard({ 
  title, 
  description, 
  href, 
  icon 
}: { 
  title: string; 
  description: string; 
  href: string; 
  icon: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="text-4xl mb-4">{icon}</div>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
} 