export default function VideoPanel() {
  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Video Panel</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto chat-scroll">
        <div className="text-gray-600">Video content will appear here...</div>
      </div>
    </div>
  );
}
