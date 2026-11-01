import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { entityAPI } from '../services/api';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [resultSections, setResultSections] = useState([]); // [{ resultType, results }]
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    location: '',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Search function - uses backend /search
  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const data = await entityAPI.search(searchQuery.trim());
      // expected: Array of { resultType: string, results: [] | null }
      if (Array.isArray(data)) {
        setResultSections(data);
      } else if (data && typeof data === 'object' && ('resultType' in data)) {
        setResultSections([data]);
      } else {
        setResultSections([]);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Search failed', e);
      setResultSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      dateRange: ''
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResultSections([]);
  };

  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length >= 3) {
      performSearch();
    } else {
      setResultSections([]);
    }
  }, [searchQuery]);

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search System</h1>
        <p className="text-gray-600">Find and filter your system</p>
      </div>

      {/* Find Pane */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for coupons, entities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery.length>2 && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5 inline mr-2" />
            Filters
          </button>
          
          <button
            onClick={handleSearch}
            disabled={searchQuery.length < 3}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                   <option value="">--Select--</option>
                  <option value="ac">All Coupons</option>
                  <option value="ae">All entities</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Pane */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results
              {resultSections.length > 0 && (
                <span className="ml-2 text-sm text-gray-500">({resultSections.length} items)</span>
              )}
            </h2>
            {resultSections.length > 0 && (
              <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                Export Results
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          ) : searchQuery && resultSections.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : !searchQuery ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-600">Enter a search term above to find items</p>
            </div>
          ) : (
            <div className="space-y-8">
              {resultSections.map((section, sIdx) => {
                const type = (section?.resultType || '').toLowerCase();
                const results = Array.isArray(section?.results) ? section.results : [];
                return (
                  <div key={`${type}-${sIdx}`} className="overflow-x-auto border border-gray-200 rounded-lg">
                    <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">{section?.resultType || 'Results'}</h3>
                      <span className="text-xs text-gray-500">{results.length} item(s)</span>
                    </div>

                    {type === 'coupon' ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exclude Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupons Given</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.length === 0 ? (
                            <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="6">No results</td></tr>
                          ) : results.map((r, idx) => (
                            <tr key={r.OHID || r.CouponCode || idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.Name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.Mobile}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.CouponCode}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.BillAmount}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.BillNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.ExcludeAmount}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.CouponsGiven}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : type === 'entity' ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.length === 0 ? (
                            <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="5">No results</td></tr>
                          ) : results.map((r, idx) => (
                            <tr key={r.EID || idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.EID}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.EName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.EType}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.ECode}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.CreatedAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : type === 'entitydetail' || type === 'entity detail' ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Detail</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.length === 0 ? (
                            <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="2">No results</td></tr>
                          ) : results.map((r, idx) => (
                            <tr key={r.EDID || idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.EDID || r.EID || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{JSON.stringify(r)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : type === 'entitydetailattribute' ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribute</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.length === 0 ? (
                            <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="2">No results</td></tr>
                          ) : results.map((r, idx) => (
                            <tr key={r.EDAID || idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.EDAID || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{JSON.stringify(r)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.length === 0 ? (
                            <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan="2">No results</td></tr>
                          ) : results.map((r, idx) => (
                            <tr key={r.id || idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.name || r.title || r.code || r.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{JSON.stringify(r)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
