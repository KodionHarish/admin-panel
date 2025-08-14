export default function TotalSummary({ totalDuration ,colorClass}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2">Active Time : <span className={`${colorClass}`}>{totalDuration}</span></h1>
        </div>
      </div>
    </div>
  );
}