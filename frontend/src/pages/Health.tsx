import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Hash, Server, Zap } from 'lucide-react';

// --- Configuration ---
const API_BASE_REDIRECT = (import.meta as any).env.VITE_API_REDIRECT || 'http://localhost:5000';

// --- Types ---
type HealthData = {
    status: 'healthy' | 'unhealthy';
    version: string;
    uptime_seconds: number;
    uptime_formatted: string;
    total_links: number;
    server_platform: string;
    server_pid: number;
    timestamp: string;
    error?: string;
}

// --- Health Component ---
export default function Health() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_REDIRECT}/healthz`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch health data');
            }
            setHealth(data);
        } catch (err: any) {
            console.error('Health Fetch Error:', err);
            setError(`Failed to load health data: ${err.message}`);
            // Set default unhealthy state
            setHealth({
                status: 'unhealthy',
                version: 'unknown',
                uptime_seconds: 0,
                uptime_formatted: '0d 0h 0m 0s',
                total_links: 0,
                server_platform: 'unknown',
                server_pid: 0,
                timestamp: new Date().toISOString(),
                error: err.message
            });
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto px-4 py-10 min-h-screen bg-gray-50">
            <h1 className="text-5xl font-extrabold text-center text-green-700 mb-10 tracking-tight">
                <Activity className="w-12 h-12 inline mr-4" />
                System Health Dashboard
            </h1>

            {/* Refresh Button */}
            <div className="text-center mb-6">
                <button
                    onClick={fetchHealth}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400"
                >
                    {loading ? 'Refreshing...' : 'Refresh Health Status'}
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center p-10 text-gray-500">
                    <Activity className="w-8 h-8 animate-spin mx-auto text-green-500"/>
                    <p className="mt-3">Checking system health...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-white p-6 rounded-xl shadow-2xl border border-red-300">
                    <div className="flex items-center p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
                        <AlertCircle className="w-5 h-5 mr-3" /> {error}
                    </div>
                </div>
            )}

            {/* Health Data */}
            {!loading && health && (
                <div className="space-y-6">
                    {/* Status Overview */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl border-t-4 border-green-500">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
                            <Zap className="w-6 h-6 mr-3 text-green-500" />
                            System Status
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center mb-2">
                                    {health.status === 'healthy' ? (
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                    )}
                                    <span className="font-semibold text-gray-700">Status</span>
                                </div>
                                <p className={`text-xl font-bold capitalize ${
                                    health.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {health.status}
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Clock className="w-5 h-5 text-blue-500 mr-2" />
                                    <span className="font-semibold text-gray-700">Uptime</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{health.uptime_formatted}</p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Hash className="w-5 h-5 text-purple-500 mr-2" />
                                    <span className="font-semibold text-gray-700">Total Links</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{health.total_links.toLocaleString()}</p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Activity className="w-5 h-5 text-orange-500 mr-2" />
                                    <span className="font-semibold text-gray-700">Version</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{health.version}</p>
                            </div>
                        </div>
                    </div>

                    {/* Server Details */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
                            <Server className="w-6 h-6 mr-3 text-blue-500" />
                            Server Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Platform</p>
                                <p className="text-lg font-bold text-gray-900">{health.server_platform}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Process ID</p>
                                <p className="text-lg font-bold text-gray-900">{health.server_pid}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-gray-600 mb-1">Last Checked</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {new Date(health.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
