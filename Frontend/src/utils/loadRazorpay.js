/**
 * Asynchronously ensures the Razorpay checkout script is loaded in the browser DOM
 * @returns {Promise<boolean>} Resolves to true when window.Razorpay is available
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }

    // Check if script tag is already in DOM
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[RAZORPAY SCRIPT LOAD ERROR] Unable to load checkout.js from Razorpay CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default loadRazorpayScript;
