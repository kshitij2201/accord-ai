import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api';

interface DatasetStats {
  totalResponses: number;
  totalCategories: number;
  categoryStats: Record<string, number>;
}

interface DatasetMatch {
  response: string;
  category: string;
  confidence: number;
  matchType: string;
  matchedKey?: string;
}

export const DatasetManager: React.FC = () => {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryResponses, setCategoryResponses] = useState<Record<string, string>>({});
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<DatasetMatch | null>(null);
  const [newResponse, setNewResponse] = useState({
    category: '',
    key: '',
    response: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
    loadCategories();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dataset/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dataset/categories`);
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCategoryResponses = async (category: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dataset/category/${category}`);
      if (response.data.success) {
        setCategoryResponses(response.data.responses);
        setSelectedCategory(category);
      }
    } catch (error) {
      console.error('Error loading category responses:', error);
    }
  };

  const testDataset = async () => {
    if (!testMessage.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/dataset/test`, {
        message: testMessage
      });
      
      if (response.data.success) {
        setTestResult(response.data.match);
      }
    } catch (error) {
      console.error('Error testing dataset:', error);
      setMessage('Error testing message');
    } finally {
      setLoading(false);
    }
  };

  const addResponse = async () => {
    if (!newResponse.category || !newResponse.key || !newResponse.response) {
      setMessage('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/dataset/add`, newResponse);
      
      if (response.data.success) {
        setMessage('Response added successfully!');
        setNewResponse({ category: '', key: '', response: '' });
        loadStats();
        loadCategories();
        if (selectedCategory === newResponse.category) {
          loadCategoryResponses(selectedCategory);
        }
      }
    } catch (error: any) {
      console.error('Error adding response:', error);
      setMessage(error.response?.data?.message || 'Error adding response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dataset Manager</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total Responses</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.totalResponses || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Categories</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.totalCategories || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Largest Category</h3>
          <p className="text-sm text-purple-600">
            {stats?.categoryStats ? 
              Object.entries(stats.categoryStats).reduce((a, b) => a[1] > b[1] ? a : b)[0] 
              : 'None'}
          </p>
        </div>
      </div>

      {/* Test Dataset Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test Dataset</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a message to test..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && testDataset()}
          />
          <button
            onClick={testDataset}
            disabled={loading || !testMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Test
          </button>
        </div>
        
        {testResult && (
          <div className="mt-3 p-3 bg-white rounded border">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-green-600">Match Found!</span>
              <span className="text-sm text-gray-500">
                {testResult.matchType} match ({(testResult.confidence * 100).toFixed(1)}% confidence)
              </span>
            </div>
            <p className="text-gray-700 mb-2">{testResult.response}</p>
            <div className="text-xs text-gray-500">
              Category: {testResult.category}
              {testResult.matchedKey && ` | Key: ${testResult.matchedKey}`}
            </div>
          </div>
        )}
        
        {testMessage && testResult === null && !loading && (
          <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
            <span className="text-yellow-700">No match found in dataset</span>
          </div>
        )}
      </div>

      {/* Add New Response Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Add New Response</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={newResponse.category}
              onChange={(e) => setNewResponse({...newResponse, category: e.target.value})}
              placeholder="e.g., greetings, technical, general"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key/Trigger</label>
            <input
              type="text"
              value={newResponse.key}
              onChange={(e) => setNewResponse({...newResponse, key: e.target.value})}
              placeholder="e.g., hello, what is react"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
          <textarea
            value={newResponse.response}
            onChange={(e) => setNewResponse({...newResponse, response: e.target.value})}
            placeholder="Enter the response text..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={addResponse}
          disabled={loading}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          Add Response
        </button>
      </div>

      {/* Categories and Responses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => loadCategoryResponses(category)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category}</span>
                  <span className="text-sm text-gray-500">
                    {stats?.categoryStats[category] || 0} responses
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">
            {selectedCategory ? `Responses in "${selectedCategory}"` : 'Select a category'}
          </h3>
          {selectedCategory && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(categoryResponses).map(([key, response]) => (
                <div key={key} className="p-3 bg-white rounded border">
                  <div className="font-medium text-sm text-gray-600 mb-1">{key}</div>
                  <div className="text-gray-800 text-sm">{response}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};