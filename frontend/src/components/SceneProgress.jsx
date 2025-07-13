import React from 'react';

export default function SceneProgress({ scene, isCompleted, isActive, error }) {
  const getStatusIcon = () => {
    if (error) return '❌';
    if (isCompleted) return '✅';
    if (isActive) return '🔄';
    return '⏳';
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isCompleted) return 'text-green-600';
    if (isActive) return 'text-blue-600';
    return 'text-gray-500';
  };

  const getBgColor = () => {
    if (error) return 'bg-red-50 border-red-200';
    if (isCompleted) return 'bg-green-50 border-green-200';
    if (isActive) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className={`p-3 rounded-lg border ${getBgColor()} mb-2`}>
      <div className="flex items-center gap-3">
        <span className={`text-lg ${getStatusColor()}`}>
          {getStatusIcon()}
        </span>
        <div className="flex-1">
          <div className={`font-medium text-sm ${getStatusColor()}`}>
            Scene {scene.sceneNumber}: {scene.title}
          </div>
          {isActive && (
            <div className="text-xs text-blue-500 mt-1">
              Generating image and video...
            </div>
          )}
          {error && (
            <div className="text-xs text-red-500 mt-1">
              {error}
            </div>
          )}
          {isCompleted && scene.videoUrl && (
            <div className="text-xs text-green-500 mt-1">
              Image and video generated successfully
            </div>
          )}
        </div>
        {isActive && (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
    </div>
  );
}
