
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart2, Zap, Clock, ArrowRight } from 'lucide-react';

// --- Configuration ---
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_REDIRECT = (import.meta as any).env?.VITE_API_REDIRECT || 'http://localhost:5000';

// --- Types ---
// Interface matching the snake_case properties returned by the backend
interface LinkStats {
    short_code: string;
    target_url: string; 
    total_clicks: number; 
    last_clicked_time: string | null;
    created_at: string; // Assuming this field is also returned by the API
}

// --- Stats Component ---
export default function Stats() {
    const { code } = useParams<{ code: string }>(); 
    
    const [data, setData] = useState<LinkStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;
        
        setLoading(true);
        setError(null);

        // Fetching data from the absolute API endpoint
        axios.get(`${API_BASE_URL}/links/${code}`)
            .then(r => {
                setData(r.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Stats Fetch Error:', err);
                const status = err.response?.status;
                
                if (status === 404) {
                    setError(`Link with code '${code}' not found (404)`);
                } else {
                    setError(err.response?.data?.error || 'Failed to load link statistics');
                }
                setLoading(false);
            });
    }, [code]);

    // --- Loading and Error States (Enhanced UI) ---

    if (loading) return (
        <div className="p-10 text-center text-gray-600">
            <BarChart2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/>
            <p className="mt-3">Loading statistics for **/{code}**...</p>
        </div>
    );
    
    if (error) return (
        <div className="p-8 max-w-xl mx-auto mt-12 bg-red-50 border border-red-400 rounded-xl shadow-lg text-red-800 text-center">
            <p className="font-bold text-xl mb-3">❌ Error Loading Stats</p>
            <p className="text-sm">{error}</p>
            <Link 
                to="/" 
                className="mt-6 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition"
            >
                &larr; Go to Dashboard
            </Link>
        </div>
    );

    if (!data) return <div className="p-4 text-center text-gray-500">No data available.</div>;

    // --- Main Content (Redesigned) ---

    // Helper to format the full short URL
    const fullShortUrl = `${API_BASE_REDIRECT}/${data.short_code}`;

    // Handle clicking the short URL to trigger redirect and update stats
    const handleShortLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // Open in new tab, which triggers the redirect and database update
        window.open(fullShortUrl, '_blank');
        // After a brief delay, fetch updated stats to refresh the UI
        setTimeout(() => {
            axios.get(`${API_BASE_URL}/links/${code}`)
                .then(r => setData(r.data))
                .catch(err => {
                    console.error('Error refreshing stats:', err);
                    // Reload page as fallback if fetch fails
                    window.location.reload();
                });
        }, 1500); // Slight delay to ensure DB update completes
    };

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border-t-4 border-blue-500 max-w-2xl mx-auto">

                <h2 className="text-4xl font-extrabold mb-8 text-gray-800 flex items-center justify-center">
                    <BarChart2 className="w-8 h-8 mr-3 text-blue-500"/> Stats for **{data.short_code}**
                </h2>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                    {/* Total Clicks Card */}
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-md">
                        <div className="flex items-center text-blue-700">
                            <Zap className="w-6 h-6 mr-3"/>
                            <span className="text-sm font-semibold uppercase">Total Clicks</span>
                        </div>
                        <p className="text-5xl font-bold mt-2 text-blue-900">{data.total_clicks}</p>
                    </div>

                    {/* Last Clicked Card */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-md">
                        <div className="flex items-center text-gray-700">
                            <Clock className="w-6 h-6 mr-3"/>
                            <span className="text-sm font-semibold uppercase">Last Clicked</span>
                        </div>
                        <p className="text-xl font-medium mt-2 text-gray-900">
                            {data.last_clicked_time ? new Date(data.last_clicked_time).toLocaleString() : 'Never'}
                        </p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4 border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Link Details</h3>

                    {/* Short URL Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 bg-gray-50 p-3 rounded-lg">
                        <strong className="text-gray-600 text-sm sm:w-1/4">Short URL:</strong>
                        <a
                            className="text-blue-600 hover:text-blue-800 break-all font-mono text-base sm:w-3/4 mt-1 sm:mt-0 transition cursor-pointer"
                            href={fullShortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleShortLinkClick}
                        >
                            {fullShortUrl}
                        </a>
                    </div>
                    
                    {/* Target URL Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start py-2">
                        <strong className="text-gray-600 text-sm sm:w-1/4">Target URL:</strong> 
                        <span 
                            className="break-all text-gray-800 text-sm sm:w-3/4 mt-1 sm:mt-0" 
                            title={data.target_url}
                        >
                            {data.target_url}
                        </span>
                    </div>

                    {/* Creation Time Row (Assuming created_at is available) */}
                    {/* <div className="flex flex-col sm:flex-row justify-between items-start py-2">
                        <strong className="text-gray-600 text-sm sm:w-1/4">Created At:</strong> 
                         <span className="text-gray-800 text-sm sm:w-3/4 mt-1 sm:mt-0">
                            {data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}
                        </span>
                    </div> */}
                </div>
                
                {/* Back to Dashboard Link */}
                <div className="mt-8 text-center">
                    <Link 
                        to="/" 
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-150"
                    >
                        Back to Dashboard <ArrowRight className="w-4 h-4 ml-2"/>
                    </Link>
                </div>
            </div>
        </div>
    );
}
