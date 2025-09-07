import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const JsonXmlConverter = () => {
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setOutputData('');
    setError(null);
  };

  const copyToClipboard = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  const convertJsonToXml = async () => {
    setLoading(true);
    setOutputData('');
    setError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/convert/json-to-xml`, { jsonString: inputData });
      setOutputData(res.data.xmlString);
      toast.success('JSON converted to XML successfully!');
    } catch (err) {
      console.error('Error converting JSON to XML:', err);
      setError(err.response?.data?.msg || 'Failed to convert JSON to XML. Please check your input.');
      toast.error(err.response?.data?.msg || 'Failed to convert JSON to XML.');
    } finally {
      setLoading(false);
    }
  };

  const convertXmlToJson = async () => {
    setLoading(true);
    setOutputData('');
    setError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/convert/xml-to-json`, { xmlString: inputData });
      setOutputData(res.data.jsonString);
      toast.success('XML converted to JSON successfully!');
    } catch (err) {
      console.error('Error converting XML to JSON:', err);
      setError(err.response?.data?.msg || 'Failed to convert XML to JSON. Please check your input.');
      toast.error(err.response?.data?.msg || 'Failed to convert XML to JSON.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">JSON &lt;-&gt; XML Converter for Web Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-md bg-white shadow">
          <label htmlFor="inputData" className="block mb-2 text-sm font-medium text-gray-900">Input (JSON or XML for Web Services)</label>
          <textarea
            id="inputData"
            className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white min-h-[200px] overflow-auto"
            placeholder="Enter JSON or XML data for web services, APIs, etc."
            value={inputData}
            onChange={handleInputChange}
          ></textarea>
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={convertJsonToXml}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              disabled={loading}
            >
              {loading ? 'Converting...' : 'JSON to XML'}
            </button>
            <button
              onClick={convertXmlToJson}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              disabled={loading}
            >
              {loading ? 'Converting...' : 'XML to JSON'}
            </button>
          </div>
        </div>
        <div className="p-4 border rounded-md bg-white shadow">
          <label htmlFor="outputData" className="block mb-2 text-sm font-medium text-gray-900">Output
            {outputData && (
              <button onClick={() => copyToClipboard(outputData)} className="ml-2 text-sm text-blue-500 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            )}
          </label>
          <textarea
            id="outputData"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 text-sm min-h-[200px] overflow-auto"
            readOnly
            value={outputData}
          ></textarea>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default JsonXmlConverter;
