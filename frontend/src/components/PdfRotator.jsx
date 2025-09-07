import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PdfRotator = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(90);
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
      setSelectedFile(null);
      toast.error('Please select a PDF file.');
      e.target.value = '';
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('angle', rotationAngle);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/convert/pdf-rotate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { path, originalname } = res.data;

      const link = document.createElement('a');
      link.href = path;
      link.setAttribute('download', originalname);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      toast.success('PDF rotated and downloaded successfully!');

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'Error rotating PDF. Please try again.');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">PDF Rotator</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="pdf_file">Upload PDF</label>
          <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" id="pdf_file" type="file" onChange={onFileChange} accept=".pdf" />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900">Rotation Angle:</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
            value={rotationAngle}
            onChange={(e) => setRotationAngle(parseInt(e.target.value))}
          >
            <option value={90}>90 Degrees</option>
            <option value={180}>180 Degrees</option>
            <option value={270}>270 Degrees</option>
          </select>
        </div>
        <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" disabled={loading}>
          {loading ? 'Rotating...' : 'Rotate PDF'}
        </button>
      </form>
    </div>
  );
};

export default PdfRotator;