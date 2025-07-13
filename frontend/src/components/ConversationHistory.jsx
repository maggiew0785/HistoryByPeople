import React, { useState, useEffect } from 'react';
import storageManager from '../services/storageManager';

export default function ConversationHistory({ 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
  refreshTrigger
}) {
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Load conversations on mount, when currentConversationId changes, or when refresh is triggered
  useEffect(() => {
    loadConversations();
  }, [currentConversationId, refreshTrigger]);

  const loadConversations = () => {
    const allConversations = storageManager.getConversations();
    
    // Enhance conversations with persona counts
    const conversationsWithPersonas = allConversations.map(conv => {
      const personas = storageManager.getPersonasByConversation(conv.id);
      return {
        ...conv,
        personaCount: personas.length,
        hasVideos: personas.some(p => p.scenes?.some(s => s.status === 'complete'))
      };
    });
    
    setConversations(conversationsWithPersonas);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(msg => 
      (msg.content || msg.text || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    setShowDeleteConfirm(conversationId);
  };

  const confirmDelete = (conversationId) => {
    const success = storageManager.deleteConversation(conversationId);
    if (success) {
      loadConversations();
      onDeleteConversation?.(conversationId);
    }
    setShowDeleteConfirm(null);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'clarification': return '❓';
      case 'curation': return '🎭';
      case 'visualization': return '🎬';
      default: return '💬';
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-gray-100 border-b border-gray-200"
          title="Expand History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <button
          onClick={onNewConversation}
          className="p-3 hover:bg-gray-100 border-b border-gray-200 text-blue-600"
          title="New Conversation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="flex-1 overflow-y-auto">
          {conversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full p-2 text-left hover:bg-gray-100 border-b border-gray-100 ${
                conv.id === currentConversationId ? 'bg-blue-50 border-blue-200' : ''
              }`}
              title={conv.title}
            >
              <div className="text-lg">{getPhaseIcon(conv.currentPhase)}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">History</h2>
          <div className="flex gap-2">
            <button
              onClick={onNewConversation}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              title="New Conversation"
            >
              New
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded"
              title="Collapse History"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`group border-b border-gray-200 hover:bg-gray-100 cursor-pointer ${
                conv.id === currentConversationId ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getPhaseIcon(conv.currentPhase)}</span>
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conv.title}
                      </h3>
                      {conv.hasVideos && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full" title="Has generated videos">
                          🎬 {conv.personaCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(conv.lastModified)} • {conv.messages.length} messages
                    </p>
                    {conv.metadata?.messageCount > 10 && (
                      <p className="text-xs text-green-600 mt-1">
                        Active conversation
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, conv.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete conversation"
                    aria-label={`Delete conversation: ${conv.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          {conversations.length > 0 && (
            <span className="ml-2">
              • {conversations.reduce((sum, conv) => sum + conv.messages.length, 0)} total messages
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Conversation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete the conversation and all associated personas and videos. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
