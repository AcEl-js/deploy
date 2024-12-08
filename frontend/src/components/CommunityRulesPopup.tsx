import React, { useState } from 'react';
import axios from 'axios';

interface CommunityRulesPopupProps {
  userId: string;
  onAgree: () => void;
}

const CommunityRulesPopup: React.FC<CommunityRulesPopupProps> = ({ userId, onAgree }) => {
  const [checkedRules, setCheckedRules] = useState({
    noHarassment: false,
    noSpam: false
  });

  const handleCheckboxChange = (rule: keyof typeof checkedRules) => {
    setCheckedRules(prev => ({
      ...prev,
      [rule]: !prev[rule]
    }));
  };

  const handleAgree = async () => {
    if (checkedRules.noHarassment && checkedRules.noSpam) {
      try {
        const API_BASE_URL = "http://localhost:8080";
        await axios.post(`${API_BASE_URL}/agree-to-rules`, 
          { userId }, 
          { withCredentials: true }
        );
        onAgree();
      } catch (error) {
        console.error('Failed to update community rules agreement', error);
      }
    }
  };

  const isAgreementDisabled = !checkedRules.noHarassment || !checkedRules.noSpam;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Community Rules</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="noHarassment" 
              checked={checkedRules.noHarassment}
              onChange={() => handleCheckboxChange('noHarassment')}
              className="mr-2"
            />
            <label htmlFor="noHarassment" className="text-gray-700">
              No harassment
            </label>
          </div>

          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="noSpam" 
              checked={checkedRules.noSpam}
              onChange={() => handleCheckboxChange('noSpam')}
              className="mr-2"
            />
            <label htmlFor="noSpam" className="text-gray-700">
              No spam
            </label>
          </div>

          <button 
            onClick={handleAgree}
            disabled={isAgreementDisabled}
            className={`w-full py-2 rounded mt-4 ${
              isAgreementDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityRulesPopup;