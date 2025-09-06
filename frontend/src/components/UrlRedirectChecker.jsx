import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UrlRedirectChecker = () => {
  const [url, setUrl] = useState('');
  const [redirectChain, setRedirectChain] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const copyToClipboard = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRedirectChain([]);
    setError(null);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/redirect-checker`, { url });
      setRedirectChain(res.data.chain);
      toast.success('Redirect chain retrieved successfully!');
    } catch (err) {
      console.error('Error checking redirects:', err);
      setError(err.response?.data?.msg || 'Failed to check redirects. Please check the URL and try again.');
      toast.error(err.response?.data?.msg || 'Failed to check redirects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">URL Redirect Checker</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="urlInput" className="block mb-2 text-sm font-medium text-gray-900">URL to Check</label>
          <input
            type="url"
            id="urlInput"
            className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., https://bit.ly/example"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Redirects'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {redirectChain.length > 0 && (
        <div className="mt-4 p-4 border rounded-md bg-white shadow">
          <h3 className="text-xl font-bold mb-2">Redirect Chain:</h3>
          <ol className="list-decimal list-inside">
            {redirectChain.map((step, index) => (
              <li key={index} className="mb-1 flex items-center">
                <span className="font-semibold">{step.status}</span>: <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all mr-2">{step.url}</a>
                <button onClick={() => copyToClipboard(step.url)} className="text-sm text-blue-500 hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default UrlRedirectChecker;
