import React, { useState, useEffect } from 'react';
import { liveSessionService } from '../services/liveSessionService';

const AttendanceModal = ({ isOpen, onClose, coursId, sessionId, sessionTitle }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchAttendance();
    }
  }, [isOpen, sessionId]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await liveSessionService.getSessionAttendance(coursId, sessionId);
      setAttendanceData(data);
    } catch (err) {
      setError('Erreur lors du chargement des données de présence');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'EXPECTED': return 'text-yellow-400 bg-yellow-900/20';
      case 'JOINED': return 'text-green-400 bg-green-900/20';
      case 'LEFT': return 'text-red-400 bg-red-900/20';
      case 'COMPLETED': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'EXPECTED': return 'Attendu';
      case 'JOINED': return 'Présent';
      case 'LEFT': return 'Parti';
      case 'COMPLETED': return 'Terminé';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Présence de la session</h2>
            <p className="text-gray-400 text-sm mt-1">{sessionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Chargement...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-center">
              {error}
            </div>
          )}

          {attendanceData && (
            <>
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {attendanceData.summary?.totalExpected || 0}
                  </div>
                  <div className="text-sm text-gray-400">Attendus</div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {attendanceData.summary?.totalJoined || 0}
                  </div>
                  <div className="text-sm text-gray-400">Présents</div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {attendanceData.summary?.totalLeft || 0}
                  </div>
                  <div className="text-sm text-gray-400">Partis</div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {attendanceData.summary?.currentlyActive || 0}
                  </div>
                  <div className="text-sm text-gray-400">Actifs</div>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="space-y-6">
                {Object.entries(attendanceData.attendance || {}).map(([status, users]) => (
                  <div key={status} className="bg-gray-700 rounded-xl p-4">
                    <h3 className={`font-semibold mb-3 px-3 py-1 rounded-lg inline-block ${getStatusColor(status)}`}>
                      {getStatusLabel(status)} ({users.length})
                    </h3>
                    
                    {users.length === 0 ? (
                      <p className="text-gray-500 text-sm">Aucun utilisateur</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th className="text-left py-2 text-gray-400">Nom</th>
                              <th className="text-left py-2 text-gray-400">Rejoint à</th>
                              <th className="text-left py-2 text-gray-400">Quitté à</th>
                              <th className="text-left py-2 text-gray-400">Durée</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user, index) => {
                              const joinTime = user.joinedAt ? new Date(user.joinedAt) : null;
                              const leftTime = user.leftAt ? new Date(user.leftAt) : null;
                              const duration = joinTime && leftTime 
                                ? Math.round((leftTime - joinTime) / 1000 / 60) // minutes
                                : null;

                              return (
                                <tr key={index} className="border-b border-gray-600/50">
                                  <td className="py-2 text-white">{user.userName}</td>
                                  <td className="py-2 text-gray-300">{formatTime(user.joinedAt)}</td>
                                  <td className="py-2 text-gray-300">{formatTime(user.leftAt)}</td>
                                  <td className="py-2 text-gray-300">
                                    {duration ? `${duration} min` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;