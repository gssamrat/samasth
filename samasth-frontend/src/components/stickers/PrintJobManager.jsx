import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  TrashIcon,
  ArrowPathIcon,
  PrinterIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { clientPrintAPI } from '../../services/api';

const PrintJobManager = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await clientPrintAPI.getJobs();
      setJobs(response);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch print jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get active jobs for stats
      const activeJobs = await clientPrintAPI.getActiveJobs();
      const allJobs = await clientPrintAPI.getJobs();
      
      // Calculate stats from jobs
      const stats = {
        total: allJobs.length,
        pending: allJobs.filter(job => job.status === 'pending').length,
        printing: allJobs.filter(job => job.status === 'printing').length,
        completed: allJobs.filter(job => job.status === 'completed').length,
        failed: allJobs.filter(job => job.status === 'failed').length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterJobs = () => {
    if (statusFilter === 'all') {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter(job => job.status === statusFilter));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(), fetchStats()]);
    setRefreshing(false);
    toast.success('Jobs refreshed');
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this print job?')) {
      return;
    }

    try {
      // Use status callback to mark job as deleted/cancelled
      await clientPrintAPI.statusCallback({
        jobId: jobId,
        status: 'cancelled',
        message: 'Job cancelled by user'
      });
      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Print job cancelled');
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel print job');
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await clientPrintAPI.statusCallback({
        jobId: jobId,
        status: newStatus,
        message: `Job status updated to ${newStatus}`
      });
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
      toast.success(`Job status updated to ${newStatus}`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'printing':
        return <PrinterIcon className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'printing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <PrinterIcon className="w-5 h-5 text-white" />
              </div>
              Print Job Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor and manage your sticker printing jobs
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.printing || 0}</div>
              <div className="text-sm text-gray-600">Printing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Filter Controls */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('printing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              statusFilter === 'printing' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Printing
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              statusFilter === 'failed' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Failed
          </button>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading print jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <PrinterIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {statusFilter === 'all' ? 'No print jobs found' : `No ${statusFilter} jobs found`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Job #{job.id || job.jobId}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Printer: {job.printer_address || job.printerAddress || 'Unknown'}</span>
                        <span>Copies: {job.copies || 1}</span>
                        <span>Created: {formatDate(job.created_at || job.createdAt || new Date())}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Unknown'}
                    </span>
                    
                    {/* Status Update Buttons */}
                    {job.status === 'pending' && (
                      <button
                        onClick={() => updateJobStatus(job.id, 'printing')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Start Printing
                      </button>
                    )}
                    
                    {job.status === 'printing' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateJobStatus(job.id, 'completed')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, 'failed')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Mark Failed
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete job"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Job Details */}
                {job.zpl && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                        View ZPL Code
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                          {job.zpl}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
                
                {/* Error Message */}
                {job.status === 'failed' && job.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-red-900">Error</h5>
                        <p className="text-sm text-red-700 mt-1">{job.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintJobManager;
