
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PDFDocument } from 'pdf-lib'; 

const PdfSplitter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ranges, setRanges] = useState('');
  const [convertedFile, setConvertedFile] = useState(null);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  const onFileChange = async (e) => { 
    const file = e.target.files[0];
    const maxFileSize = 10 * 1024 * 1024; 

    if (!file) {
      setSelectedFile(null);
      setTotalPages(0); 
      setError('');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error(`Invalid file type: ${file.name}. Only PDF files are allowed.`);
      setSelectedFile(null);
      setTotalPages(0); 
      e.target.value = ''; 
      setError('Invalid file type.');
      return;
    }
    if (file.size > maxFileSize) {
      toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
      setSelectedFile(null);
      setTotalPages(0); 
      e.target.value = ''; 
      setError('File too large.');
      return;
    }

    setError('');
    setSelectedFile(file);

    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setTotalPages(pdfDoc.getPageCount());
    } catch (err) {
      console.error('Error reading PDF for page count:', err);
      toast.error('Could not read PDF for page count. It might be corrupted or encrypted.');
      setSelectedFile(null);
      setTotalPages(0);
      e.target.value = '';
      setError('PDF read error.');
    }
  };

  const onRangeChange = (e) => {
    setRanges(e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please upload a PDF file.');
      return;
    }
    if (!ranges) {
      toast.error('Please enter page ranges to split.');
      return;
    }

    
    if (totalPages > 0) {
      const parsedRanges = [];
      const parts = ranges.split(',').map(p => p.trim());
      let isValidRange = true;
      let coveredPages = new Set();

      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          if (isNaN(start) || isNaN(end) || start <= 0 || end > totalPages || start > end) {
            isValidRange = false;
            break;
          }
          for (let i = start; i <= end; i++) {
            coveredPages.add(i);
          }
        } else {
          const pageNum = Number(part);
          if (isNaN(pageNum) || pageNum <= 0 || pageNum > totalPages) {
            isValidRange = false;
            break;
          }
          coveredPages.add(pageNum);
        }
      }

      if (!isValidRange) {
        toast.error(`Invalid page ranges. Please ensure all pages are within 1-${totalPages} and ranges are correctly formatted.`);
        return;
      }

      
    }


    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('ranges', ranges);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/convert/split-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setConvertedFile(res.data);
      toast.success('PDF split successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'Failed to split PDF. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">PDF Splitter</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-4 py-4">
          <label className="block mb-2 text-sm font-medium text-gray-900 text-black" htmlFor="single_file">Upload a PDF file</label>
          <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" id="single_file" type="file" onChange={onFileChange} /* Re-applied styling */ />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {selectedFile && totalPages > 0 && (
            <p className="text-sm text-gray-600 mt-2">Total pages: {totalPages}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900 text-black" htmlFor="ranges">Page Ranges (e.g. 1, 3-5, 8)</label>
                    <input type="text" id="ranges" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 1, 3-5, 8" value={ranges} onChange={onRangeChange} />
        </div>
        <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Split PDF</button>
      </form>

      {convertedFile && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">Split File:</h3>
          <a href={`${convertedFile.path}`} download={convertedFile.originalname} className="text-blue-500 hover:underline">Download Split PDF</a>
        </div>
      )}
    </div>
  );
};

export default PdfSplitter;
