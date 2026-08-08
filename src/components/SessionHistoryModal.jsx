import React, { useState, useEffect } from 'react';
import { liveSessionService } from '../services/liveSessionService';
import AttendanceModal from './AttendanceModal';

const SessionHistoryModal = ({ isOpen, onClose, coursId, coursTitle }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSessionHistory();
    }
  }, [isOpen]);

  const fetchSessionHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await liveSessionService.getCourseSessionHistory(coursId);
      setSessions(data);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique des sessions');
      console.error('Error fetching session history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = (session) => {
    setSelectedSession(session);
    setShowAttendance(true);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionDuration = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const durationMs = end - start;
    const minutes = Math.round(durationMs / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-900/20';
      case 'ENDED': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-yellow-400 bg-yellow-900/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return 'En cours';
      case 'ENDED': return 'Terminée';
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white">Historique des sessions</h2>
              <p className="text-gray-400 text-sm mt-1">{coursTitle}</p>
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

            {!loading && !error && sessions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">Aucune session trouvée</div>
                <p className="text-gray-400 text-sm">Aucune session n'a encore été créée pour ce cours.</p>
              </div>
            )}

            {sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 text-gray-400 font-semibold">Date de début</th>
                      <th className="text-left py-3 text-gray-400 font-semibold">Date de fin</th>
                      <th className="text-left py-3 text-gray-400 font-semibold">Durée</th>
                      <th className="text-left py-3 text-gray-400 font-semibold">Mode</th>
                      <th className="text-left py-3 text-gray-400 font-semibold">Statut</th>
                      <th className="text-left py-3 text-gray-400 font-semibold">Participants</th>
                      <th className="text-left py-3 text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.sessionId} className="border-b border-gray-600/50 hover:bg-gray-700/30">
                        <td className="py-4 text-white">
                          {formatDateTime(session.startedAt)}
                        </td>
                        <td className="py-4 text-gray-300">
                          {formatDateTime(session.endedAt)}
                        </td>
                        <td className="py-4 text-gray-300">
                          {getSessionDuration(session.startedAt, session.endedAt)}
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-blue-900/20 text-blue-400 rounded-lg text-xs">
                            {session.mode}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs ${getStatusColor(session.status)}`}>
                            {getStatusLabel(session.status)}
                          </span>
                        </td>
                        <td className="py-4 text-gray-300">
                          <div className="flex items-center gap-2">
                            <span>{session.participants?.length || 0}</span>
                            {session.participants?.length > 0 && (
                              <div className="flex -space-x-1">
                                {session.participants.slice(0, 3).map((participant, index) => (
                                  <div
                                    key={index}
                                    className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white border border-gray-600"
                                    title={participant.userName}
                                  >
                                    {participant.userName.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {session.participants.length > 3 && (
                                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white border border-gray-600">
                                    +{session.participants.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleViewAttendance(session)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                          >
                            Voir présence
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={showAttendance}
        onClose={() => setShowAttendance(false)}
        coursId={coursId}
        sessionId={selectedSession?.sessionId}
        sessionTitle={`Session du ${formatDateTime(selectedSession?.startedAt)}`}
      />
    </>
  );
};

export default SessionHistoryModal;