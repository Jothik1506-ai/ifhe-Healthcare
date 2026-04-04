import React, { useState } from 'react'
import '../Styles/VerifyMedicine.css'
import MedicineVerification from './MedicineVerification';

function VerifyMedicine() {
  const [bookNo,setBookNo] = useState('');
  const [error,setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);


  return (
    <div className="verify-medicine-container">
      <div className='verify-medicine-card'>
        <h1>Medicine Verification</h1>

        <div className='verify-medicine-form-group'>
          <label htmlFor="">Book No: </label>
          <input 
          type="text"
          value={bookNo}
          onChange={(e) => setBookNo(e.target.value)}
          required
          placeholder='Enter Book No'
          disabled = {isLoading}
           />
        </div>

        <div className="medicine-pickup-btn-container">
          <button
            type="button"
            className="medicine-pickup-fetch-btn" 
            onClick={() => setShowVerification(true)}
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? 'Loading...' : 'Verify Medicines'} {/* Show loading text */}
          </button>
        </div>
      </div>


      <MedicineVerification
        bookNo={bookNo}
        showVerification={showVerification}
        setShowVerification={setShowVerification}
      />
    </div>
  )
}

export default VerifyMedicine