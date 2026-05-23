interface Props {
  output: string;
  error: string;
  isLoading: boolean;
}

export default function Output({ output, error, isLoading }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 text-green-400 font-mono p-4 h-full rounded-lg overflow-auto shadow-inner">
      <div className="text-gray-400 text-xs mb-2 font-bold uppercase tracking-wider">Console Output</div>
      {isLoading && (
        <div className="flex items-center text-yellow-400">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Executing code...
        </div>
      )}
      {!isLoading && output && <pre className="whitespace-pre-wrap">{output}</pre>}
      {!isLoading && error && <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>}
      {!isLoading && !output && !error && (
        <p className="text-gray-500 italic">Output will appear here after execution...</p>
      )}
    </div>
  );
}
