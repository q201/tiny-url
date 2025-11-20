
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clipboard, Trash2, BarChart2, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

// --- Configuration ---
// Accessing environment variables
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api'; 
const API_BASE_REDIRECT = (import.meta as any).env.VITE_API_REDIRECT || 'http://localhost:5000';

// --- Types ---
type LinkItem = {
    short_code: string;
    target_url: string; // Using target_url as per your current definition
    total_clicks: number;
    last_clicked_time: string | null;
    created_at: string; // Assuming this field is also returned
}

// Helper to convert fetch Response to JSON or throw error
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw { status: response.status, error: errorData.error || response.statusText };
    }
    // Handle 204 No Content for DELETE
    if (response.status === 204) return {} as T; 
    return response.json();
}

// --- Dashboard Component ---
export default function Dashboard(){
    const [links, setLinks] = useState<LinkItem[]>([])
    const [longUrl, setLongUrl] = useState('')
    const [customCode, setCustomCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // --- Data Management Functions ---
    const fetchLinks = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await axios.get<LinkItem[]>(`${API_BASE_URL}/links`);
            setLinks(response.data);
        } catch (err: any){
            console.error('Fetch Links Error:', err);
            setError(`Failed to load links: ${err.message || 'Network error'}`);
            setLinks([]);
        }
        setLoading(false)
    }, []);

    useEffect(() => { 
        fetchLinks() 
    }, [fetchLinks]);

    const validUrl = (u:string) => {
        try { new URL(u); return true } catch { return false }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setSuccess(null);

        if (!validUrl(longUrl)) return setError('Please enter a valid URL (e.g., https://...)');
        if (customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode)) return setError('Custom code must be 6-8 alphanumeric characters.');

        setLoading(true);

        try {
            const response = await axios.post<LinkItem>(`${API_BASE_URL}/links`, {
                longUrl,
                customCode: customCode || undefined
            });

            setSuccess(`Link created! Short URL: ${API_BASE_REDIRECT}/${response.data.short_code}`);
            setLongUrl(''); setCustomCode('');
            fetchLinks();
        } catch (err: any){
            console.error('Create Link Error:', err);
            if (err.response?.status === 409) setError('This short code is already in use.');
            else setError(err.response?.data?.error || `Creation failed (Status: ${err.response?.status})`);
        }
        setLoading(false);
    }

    const handleDelete = async (short_code:string) => {
        if (!confirm('Are you sure you want to delete this link?')) return
        try {
            await axios.delete(`${API_BASE_URL}/links/${short_code}`);
            setLinks(l => l.filter(x => x.short_code !== short_code))
        } catch (err) {
            console.error('Delete Link Error:', err);
            alert('Deletion failed. Check console for details.');
        }
    }

    const copyShort = (code:string) => { 
        const url = `${API_BASE_REDIRECT}/${code}`;
        navigator.clipboard?.writeText(url); 
        alert(`Copied: ${url}`);
    }
    
    // --- Render Logic ---
    return (
        <div className="container mx-auto px-4 py-10 min-h-screen bg-gray-50">
            <h1 className="text-5xl font-extrabold text-center text-blue-700 mb-10 tracking-tight">
                🔗 TinyLink Dashboard
            </h1>

            {/* Link Creation Form Section */}
            <section className="bg-white p-6 md:p-8 rounded-xl shadow-2xl border-t-4 border-blue-500 mb-10">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
                    <BarChart2 className="w-6 h-6 mr-3 text-blue-500"/> Create New Link
                </h2>
                
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Long URL Input */}
                    <div className="md:col-span-2">
                        <label htmlFor="longUrl" className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                        <input 
                            id="longUrl"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                            placeholder="https://your-very-long-url.com" 
                            value={longUrl} 
                            onChange={e=>setLongUrl(e.target.value)} 
                        />
                        {longUrl && !validUrl(longUrl) && (
                            <p className="mt-1 text-xs text-red-500">Must be a valid URL.</p>
                        )}
                    </div>
                    
                    {/* Custom Code Input */}
                    <div>
                        <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">Custom Code (6-8 alphanumeric)</label>
                        <input 
                            id="customCode"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                            placeholder="mycode" 
                            value={customCode} 
                            onChange={e=>setCustomCode(e.target.value)} 
                            maxLength={8}
                        />
                        {customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode) && (
                            <p className="mt-1 text-xs text-red-500">Invalid format.</p>
                        )}
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={loading || !validUrl(longUrl) || (customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode))} 
                        className={`w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition duration-200 ${
                            loading || !validUrl(longUrl)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
                        }`}
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin mx-auto"/> : 'Shorten Link'}
                    </button>
                </form>

                {/* Feedback Messages */}
                {error && (
                    <div className="mt-4 flex items-center p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
                        <AlertTriangle className="w-5 h-5 mr-3"/> {error}
                    </div>
                )}
                {success && (
                    <div className="mt-4 flex items-center p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg overflow-x-auto">
                        <CheckCircle className="w-5 h-5 mr-3"/> {success}
                    </div>
                )}
            </section>

            {/* Links List Section */}
            <section className="bg-white p-6 rounded-xl shadow-2xl">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">Your TinyLinks ({links.length})</h3>
                
                {/* Loading State */}
                {loading && (
                    <div className="text-center p-10 text-gray-500">
                        <Loader className="w-8 h-8 animate-spin mx-auto text-blue-500"/>
                        <p className="mt-3">Loading links...</p>
                    </div>
                )}
                
                {/* Empty State */}
                {!loading && links.length === 0 && (
                    <div className="text-center p-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-lg">You haven't created any links yet. Start shortening above!</p>
                    </div>
                )}
                
                {/* Links Table */}
                {!loading && links.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    <th className="p-3 text-left">Code</th>
                                    <th className="p-3 text-left">Target URL</th>
                                    <th className="p-3 text-center">Clicks</th>
                                    <th className="p-3 text-left whitespace-nowrap">Last Clicked</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {links.map(l => (
                                    <tr key={l.short_code} className="hover:bg-blue-50 transition duration-150">
                                        <td className="p-3 font-mono text-sm text-blue-600 hover:text-blue-800">
                                            <Link to={`/code/${l.short_code}`}>{l.short_code}</Link>
                                        </td>
                                        <td className="p-3 text-sm text-gray-600 max-w-xs overflow-hidden truncate" title={l.target_url}>
                                            {l.target_url.length > 50 ? l.target_url.slice(0, 50) + '...' : l.target_url}
                                        </td>
                                        <td className="p-3 text-sm text-center font-semibold text-gray-900">{l.total_clicks}</td>
                                        <td className="p-3 text-sm text-gray-500 whitespace-nowrap">
                                            {l.last_clicked_time ? new Date(l.last_clicked_time).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="p-3 space-x-2 flex justify-center items-center">
                                            <button 
                                                onClick={() => copyShort(l.short_code)} 
                                                className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition"
                                                title="Copy Short URL"
                                            >
                                                <Clipboard className="w-5 h-5" />
                                            </button>
                                            <Link 
                                                to={`/code/${l.short_code}`}
                                                className="p-2 text-green-500 hover:bg-green-100 rounded-full transition"
                                                title="View Statistics"
                                            >
                                                <BarChart2 className="w-5 h-5" />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(l.short_code)} 
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition"
                                                title="Delete Link"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}
