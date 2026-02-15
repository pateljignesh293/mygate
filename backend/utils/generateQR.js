const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

const generateQRCodeString = async (data) => {
  try {
    const qrCodeString = await QRCode.toString(JSON.stringify(data), {
      type: 'utf8'
    });
    return qrCodeString;
  } catch (error) {
    console.error('Error generating QR code string:', error);
    throw error;
  }
};

module.exports = { generateQRCode, generateQRCodeString };
