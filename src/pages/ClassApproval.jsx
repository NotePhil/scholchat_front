import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const ClassApproval = () => {
  const [searchParams] = useSearchParams();
  const classeId = searchParams.get('classeId');
  const etablissementId = searchParams.get('etablissementId');
  
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const approveClass = async () => {
      try {
        const response = await axios.post(
          `http://localhost:8486/scholchat/etablissements/approve-class/${classeId}/${etablissementId}`
        );
        
        setStatus('success');
        setMessage('Classe validée avec succès par l\'établissement !');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Erreur lors de la validation de la classe');
      }
    };

    if (classeId && etablissementId) {
      approveClass();
    }
  }, [classeId, etablissementId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Validation en cours...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que l'établissement valide la classe.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Validation réussie !
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              La classe est maintenant approuvée par l'établissement et active.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Erreur de validation
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Veuillez contacter l'administrateur si le problème persiste.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassApproval;