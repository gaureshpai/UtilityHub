
import React, { useState } from 'react';
import jsQR from 'jsqr';
import { toast } from 'react-toastify';

const QrCodeScanner = () => {
  const [qrData, setQrData] = useState('');

  const copyToClipboard = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setQrData('');
      return;
    }

    setQrData('Scanning...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1000;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setQrData(code.data);
          toast.success('QR Code detected!');
        } else {
          setQrData('No QR code found.');
          toast.info('No QR code found in the image.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">QR Code Scanner</h2>
      <div className="mb-4 py-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 text-black" htmlFor="qr_image">Upload QR Code Image</label>
        <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" id="qr_image" type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {qrData && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">QR Code Data:
            <button onClick={() => copyToClipboard(qrData)} className="ml-2 text-sm text-blue-500 hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </h3>
          <p className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5">{qrData}</p>
        </div>
      )}
    </div>
  );
};

export default QrCodeScanner;