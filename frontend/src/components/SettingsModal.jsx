import React, { useState, useEffect } from 'react';
import storageManager from '../services/storageManager';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(storageManager.getSettings());
      setStats(storageManager.getStorageStats());
    }
  }, [isOpen]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storageManager.saveSettings(newSettings);
  };

  const handleExportData = () => {
    const data = storageManager.exportData();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historybypeople-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const success = storageManager.importData(e.target.result);
          if (success) {
            alert('Data imported successfully! Please refresh the page.');
          } else {
            alert('Failed to import data. Please check the file format.');
          }
        } catch (error) {
          alert('Error importing data: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearAllData = () => {
    if (showClearConfirm) {
      const success = storageManager.clearAllData();
      if (success) {
        alert('All data cleared successfully! Please refresh the page.');
        onClose();
      } else {
        alert('Failed to clear data.');
      }
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Storage Statistics */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Storage Statistics</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Conversations:</span>
              <span className="font-medium">{stats.conversations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Messages:</span>
              <span className="font-medium">{stats.totalMessages || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Personas:</span>
              <span className="font-medium">{stats.personas || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Scenes:</span>
              <span className="font-medium">{stats.totalScenes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Videos:</span>
              <span className="font-medium text-green-600">{stats.activeVideos || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Expired Videos:</span>
              <span className="font-medium text-orange-600">{stats.expiredVideos || 0}</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Preferences</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoSave !== false}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Auto-save conversations</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoRestore !== false}
                onChange={(e) => handleSettingChange('autoRestore', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Auto-restore last session</span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Data Management</h3>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Export All Data
            </button>
            
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm cursor-pointer block text-center"
              >
                Import Data
              </label>
            </div>
            
            <button
              onClick={handleClearAllData}
              className={`w-full px-4 py-2 rounded text-sm ${
                showClearConfirm
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              {showClearConfirm ? 'Click Again to Confirm Clear All' : 'Clear All Data'}
            </button>
            
            {showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Data is stored locally in your browser. Export regularly to backup your conversations.
        </div>
      </div>
    </div>
  );
}
