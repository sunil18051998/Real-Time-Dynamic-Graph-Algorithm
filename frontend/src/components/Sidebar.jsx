export default function Sidebar({ logs }) {
  return (
    <div className="bg-gray-100 w-80 p-4 border-l overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2">Engine Responses</h2>
      <ul className="space-y-2 text-sm">
        {logs.map((log, idx) => (
          <li key={idx} className="p-2 bg-white rounded shadow">
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
