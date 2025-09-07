import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PdfToWordConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [convertedFile, setConvertedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    const maxFileSize = isAuthenticated ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file && file.type === 'application/pdf') {
      if (file.size > maxFileSize) {
        toast.error(`File too large: ${file.name}. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`);
        setSelectedFile(null);
        e.target.value = null;
      } else {
        setSelectedFile(file);
      }
    } else {
      toast.error('Please select a PDF file.');
      setSelectedFile(null);
      e.target.value = null;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a PDF file.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/convert/pdf-to-word`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setConvertedFile(res.data);
      toast.success('PDF converted to Word successfully! Starting download...');
      handleDownload(res.data.path, res.data.originalname);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'Error converting PDF to Word. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">PDF to Word Converter</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="single_file">Upload a PDF file</label>
          <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" id="single_file" type="file" onChange={onFileChange} accept=".pdf" />
        </div>
        <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" disabled={loading}>{loading ? 'Converting...' : 'Convert to Word'}</button>
      </form>
    </div>
  );
};

export default PdfToWordConverter;