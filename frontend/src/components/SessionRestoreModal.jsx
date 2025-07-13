import React from 'react';

export default function SessionRestoreModal({ 
  lastConversation, 
  onRestore, 
  onStartNew, 
  onDismiss 
}) {
  if (!lastConversation) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getPhaseDescription = (phase) => {
    switch (phase) {
      case 'clarification': return 'Asking clarifying questions';
      case 'curation': return 'Exploring historical perspectives';
      case 'visualization': return 'Ready for visual storytelling';
      default: return 'In progress';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600">
            You have an active conversation from your last session.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">
            {lastConversation.title}
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">Last active:</span> {formatDate(lastConversation.lastModified)}
            </p>
            <p>
              <span className="font-medium">Messages:</span> {lastConversation.messages.length}
            </p>
            <p>
              <span className="font-medium">Status:</span> {getPhaseDescription(lastConversation.currentPhase)}
            </p>
          </div>
          
          {lastConversation.messages.length > 0 && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-xs text-gray-500 mb-1">Last message:</p>
              <p className="text-sm text-gray-800 line-clamp-3">
                {lastConversation.messages[lastConversation.messages.length - 1]?.content}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue Conversation
          </button>
          <button
            onClick={onStartNew}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Start New
          </button>
        </div>

        <button
          onClick={onDismiss}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          I'll decide later
        </button>
      </div>
    </div>
  );
}
