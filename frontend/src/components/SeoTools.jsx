import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SeoTools = () => {
  const [domain, setDomain] = useState('');
  const [robotsTxtContent, setRobotsTxtContent] = useState('');
  const [sitemapXmlContent, setSitemapXmlContent] = useState('');
  const [robotsTxtError, setRobotsTxtError] = useState(null);
  const [sitemapXmlError, setSitemapXmlError] = useState(null);
  const [loadingRobots, setLoadingRobots] = useState(false);
  const [loadingSitemap, setLoadingSitemap] = useState(false);

  const handleDomainChange = (e) => {
    setDomain(e.target.value);
    setRobotsTxtContent('');
    setSitemapXmlContent('');
    setRobotsTxtError(null);
    setSitemapXmlError(null);
  };

  const copyToClipboard = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  const fetchRobotsTxt = async () => {
    setLoadingRobots(true);
    setRobotsTxtContent('');
    setRobotsTxtError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/seo/robots-txt`, { domain });
      if (res.data.exists) {
        setRobotsTxtContent(res.data.content);
        toast.success('robots.txt fetched successfully!');
      } else {
        setRobotsTxtContent(res.data.error || 'robots.txt not found or accessible.');
        toast.info('robots.txt not found or accessible.');
      }
    } catch (err) {
      console.error('Error fetching robots.txt:', err);
      setRobotsTxtError(err.response?.data?.msg || 'Failed to fetch robots.txt.');
      toast.error(err.response?.data?.msg || 'Failed to fetch robots.txt.');
    } finally {
      setLoadingRobots(false);
    }
  };

  const fetchSitemapXml = async () => {
    setLoadingSitemap(true);
    setSitemapXmlContent('');
    setSitemapXmlError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/seo/sitemap-xml`, { domain });
      if (res.data.exists) {
        setSitemapXmlContent(res.data.content);
        toast.success('sitemap.xml fetched successfully!');
      } else {
        setSitemapXmlContent(res.data.error || 'sitemap.xml not found or accessible.');
        toast.info('sitemap.xml not found or accessible.');
      }
    } catch (err) {
      console.error('Error fetching sitemap.xml:', err);
      setSitemapXmlError(err.response?.data?.msg || 'Failed to fetch sitemap.xml.');
      toast.error(err.response?.data?.msg || 'Failed to fetch sitemap.xml.');
    } finally {
      setLoadingSitemap(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Robots.txt / Sitemap.xml Viewer</h2>
      <div className="mb-4">
        <label htmlFor="domainInput" className="block mb-2 text-sm font-medium text-gray-900">Domain (e.g., example.com)</label>
        <input
          type="text"
          id="domainInput"
          className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., example.com"
          value={domain}
          onChange={handleDomainChange}
          required
        />
      </div>
      <div className="mb-4">
        <button
          onClick={fetchRobotsTxt}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          disabled={loadingRobots}
        >
          {loadingRobots ? 'Fetching...' : 'Fetch robots.txt'}
        </button>
        <button
          onClick={fetchSitemapXml}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          disabled={loadingSitemap}
        >
          {loadingSitemap ? 'Fetching...' : 'Fetch sitemap.xml'}
        </button>
      </div>

      {robotsTxtError && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          {robotsTxtError}
        </div>
      )}

      {robotsTxtContent && (
        <div className="mt-4 p-4 border rounded-md bg-white shadow">
          <h3 className="text-xl font-bold mb-2">robots.txt Content:
            <button onClick={() => copyToClipboard(robotsTxtContent)} className="ml-2 text-sm text-blue-500 hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </h3>
          <textarea
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm dark:border-gray-600 h-max"
            rows="10"
            readOnly
            value={robotsTxtContent}
          ></textarea>
        </div>
      )}

      {sitemapXmlError && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          {sitemapXmlError}
        </div>
      )}

      {sitemapXmlContent && (
        <div className="mt-4 p-4 border rounded-md bg-white shadow">
          <h3 className="text-xl font-bold mb-2">sitemap.xml Content:
            <button onClick={() => copyToClipboard(sitemapXmlContent)} className="ml-2 text-sm text-blue-500 hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </h3>
          <textarea
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm dark:border-gray-600 h-max"
            rows="10"
            readOnly
            value={sitemapXmlContent}
          ></textarea>
        </div>
      )}
    </div>
  );
};

export default SeoTools;
